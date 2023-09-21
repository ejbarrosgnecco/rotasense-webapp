import axios from "axios"
import axiosRetry from "axios-retry"
import React, { useEffect, useState } from "react"
import { trackPromise, usePromiseTracker } from "react-promise-tracker"
import { useDispatch, useSelector } from "react-redux"
import ErrorMessage from "../../../components/error/error"
import InlinePromiseTracker from "../../../components/promiseTrackers/inlineTracker"
import { setNewAccount } from "../../../store/features/account/newAccount"
import { RootState } from "../../../store/store"
import { SuccessResponse } from "../../../types.config"

axiosRetry(axios, {
    retries: 5,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

// ** USER DETAILS ** //
const PageOne: React.FC = (): JSX.Element => {
    const newAccountData = useSelector((state: RootState) => state.newAccount);

    const dispatch = useDispatch();

    const [errors, setErrors] = useState({
        firstName: false,
        lastName: false,
        emailAddress: false,
        duplicateEmail: false,
        password: false,
        error: false
    })

    const [showPassword, setShowPassword] = useState<boolean>(false);

    const [passwordMeetsGuidelines, setPasswordMeetsGuidelines] = useState<boolean>(false);
    const [passwordGuidelines, setPasswordGuidelines] = useState({
        uppercase: false,
        lowercase: false,
        minimum: false,
        special: false
    })

    const handleGuidelinesCheck = (): void => {
        // Contains one uppercase letter (A-Z)
        const uppercase_regex = new RegExp(/^(?=.*?[A-Z])/)
        const uppercase_match = uppercase_regex.test(newAccountData.user.password)

        // Contains one lowercase letter (A-Z)
        const lowercase_regex = new RegExp(/^(?=.*?[a-z])/)
        const lowercase_match = lowercase_regex.test(newAccountData.user.password)

        // At least 6 characters
        const length_match = newAccountData.user.password.length >= 8

        // Contains one special character
        const special_regex = new RegExp(/^(?=.*?[#?!@$%^&*-])/)
        const special_match = special_regex.test(newAccountData.user.password)


        setPasswordGuidelines({
            uppercase: uppercase_match,
            lowercase: lowercase_match,
            minimum: length_match,
            special: special_match
        })
        
        if(uppercase_match && lowercase_match && length_match && special_match) {
            setPasswordMeetsGuidelines(true)
        } else {
            setPasswordMeetsGuidelines(false)
        }
    }

   useEffect(() => {
       handleGuidelinesCheck()
   }, [newAccountData.user.password])

    const handleFillInForm = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;

        dispatch(setNewAccount({
            completePages: {
                1: false
            },
            user: {
                [name]: value,
                emailAddressVerified: name === "emailAddress" ? false : newAccountData.user.emailAddressVerified
            }
        }))

        setErrors({
            ...errors,
            [name]: false,
            duplicateEmail: name === "emailAddress" ? false : errors.duplicateEmail,
            error: false
        })
    }

    const validateEmailAddress = async (): Promise<void> => {
        if(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,6}$/.test(newAccountData.user.emailAddress)) {
            trackPromise(
                new Promise<void>( async (resolve) => {
                    await axios({
                        method: "POST",
                        url: process.env.REACT_APP_BACKEND_BASE_URL + `/account/setup/email-validation`,
                        data: {
                            emailAddress: newAccountData.user.emailAddress
                        }
                    })
                    .then((value: { data: SuccessResponse }) => {
                        const response = value.data;

                        if(response.success === true) {
                            const valid = !response.data.usedPreviously && response.data.validEmail;

                            if(valid) {
                                dispatch(setNewAccount({
                                    user: {
                                        emailAddressVerified: true
                                    }
                                }))

                                setErrors({
                                    ...errors,
                                    duplicateEmail: false
                                })

                                resolve();
                            } else {
                                dispatch(setNewAccount({
                                    user: {
                                        emailAddressVerified: false
                                    }
                                }))

                                setErrors({
                                    ...errors,
                                    duplicateEmail: true
                                })

                                resolve();
                            }
                        }
                    })
                    .catch(() => {
                        // Do nothing
                    })
                })
            , "emailValidation")
        }
    }

    useEffect(() => {
        validateEmailAddress();
    }, [])

    const handleDataValidation = async (): Promise<boolean> => {
        let errorsCount: number = 0;
        let errorsObject: { [key: string]: boolean } = {};

        const data = newAccountData.user;

        if(data.firstName.length < 2) {
            errorsCount++;
            errorsObject.firstName = true;
        }

        if(data.lastName.length < 2) {
            errorsCount++;
            errorsObject.lastName = true;
        }

        if(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,6}$/.test(data.emailAddress) === false) {
            errorsCount++;
            errorsObject.emailAddress = true;
        } else if (data.emailAddressVerified === false) {
            errorsCount++;
        }

        if(!passwordMeetsGuidelines) {
            errorsCount++;
            errorsObject.password = true;
        }

        if(errorsCount === 0) {
            return true
        } else {
            setErrors({
                ...errors,
                ...errorsObject
            })

            return false
        }
    }

    const goToNextPage = async (e: React.FormEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();

        const validation = await handleDataValidation();

        if(validation === true) {
            dispatch(setNewAccount({
                activePage: 2,
                completePages: {
                    1: true
                }
            }))
        }
    }

    const submitPromise = usePromiseTracker({ area: "createAccount" }).promiseInProgress;

    return (
        <React.Fragment>
            <div className="split-column">
                <span>
                    <label className={`expanded-input-wrapper orange ${errors.firstName ? 'error attached' : ''}`} htmlFor="firstName">
                        <div className="expanded-input-content">
                            <input
                                id="firstName"
                                className="expanded-input"
                                placeholder="e.g. Joe"
                                autoComplete="off"
                                name="firstName"
                                value={newAccountData.user.firstName}
                                onChange={handleFillInForm}
                                disabled={submitPromise}
                            />

                            <label className="expanded-input-label" htmlFor="firstName">First name*</label>
                        </div>
                    </label>

                    {
                        errors.firstName ? (
                            <ErrorMessage
                                message="Please enter your first name"
                                attached={true}
                                bottomSpacing="20px"
                            />
                        ) : null
                    }
                </span>

                <span>
                    <label className={`expanded-input-wrapper orange ${errors.lastName ? 'error attached' : ''}`} htmlFor="lastName">
                        <div className="expanded-input-content">
                            <input
                                id="lastName"
                                className="expanded-input"
                                placeholder="e.g. Bloggs"
                                autoComplete="off"
                                name="lastName"
                                value={newAccountData.user.lastName}
                                onChange={handleFillInForm}
                                disabled={submitPromise}
                            />

                            <label className="expanded-input-label" htmlFor="lastName">Last name*</label>
                        </div>
                    </label>

                    {
                        errors.lastName ? (
                            <ErrorMessage
                                message="Please enter your last name"
                                attached={true}
                                bottomSpacing="20px"
                            />
                        ) : null
                    }
                </span>               
            </div>

            <label className={`expanded-input-wrapper email orange ${errors.emailAddress || errors.duplicateEmail ? 'error attached' : ''}`} htmlFor="emailAddress">
                <div className="expanded-input-content">
                    <input
                        id="emailAddress"
                        className="expanded-input"
                        placeholder="e.g. joe.bloggs@mycompany.com"
                        autoComplete="off"
                        name="emailAddress"
                        value={newAccountData.user.emailAddress}
                        onBlur={validateEmailAddress}
                        onChange={handleFillInForm}
                        disabled={submitPromise}
                    />

                    <label className="expanded-input-label" htmlFor="emailAddress">Email address*</label>
                </div>
            </label>

            <InlinePromiseTracker
                searchArea="emailValidation"
            />

            {
                errors.duplicateEmail ? (
                    <ErrorMessage
                        message="This email address has been used for another organisation's account"
                        attached={true}
                        bottomSpacing="20px"
                    />
                ) : errors.emailAddress ? (
                    <ErrorMessage
                        message="Please enter a valid email address"
                        attached={true}
                        bottomSpacing="20px"
                    />
                ) : null
            }

            <label className={`expanded-input-wrapper password orange ${errors.password ? 'error attached' : ''}`} htmlFor="password">
                <div className="expanded-input-content">
                    <input
                        id="password"
                        className="expanded-input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={showPassword ? 'MyPassword123!' : '••••••••••••••'}
                        autoComplete="off"
                        name="password"
                        value={newAccountData.user.password}
                        onChange={handleFillInForm}
                        disabled={submitPromise}
                    />

                    <label className="expanded-input-label" htmlFor="password">Password*</label>
                </div>

                <button
                    className={`show-password-button white ${showPassword ? 'show' : 'hide'}`}
                    style={{ color: "#FFF"}}
                    onClick={(e) => {e.preventDefault(); setShowPassword(!showPassword)}}
                    disabled={submitPromise}
                />
            </label>

            {
                errors.password ? (
                    <ErrorMessage
                        message="Password must meet below guidelines"
                        attached={true}
                        bottomSpacing="20px"
                    />
                ) : null
            }

            <div className="password-guidelines-container">
                <h4>Password guidelines</h4>

                <ul className="password-guidelines-list">
                    <li className={passwordGuidelines.uppercase ? 'met' : 'not-met'}>Contains one uppercase letter (A-Z)</li>
                    <li className={passwordGuidelines.lowercase ? 'met' : 'not-met'}>Contains one lowercase letter (a-z)</li>
                    <li className={passwordGuidelines.minimum ? 'met' : 'not-met'}>Minimum of 8 characters</li>
                    <li className={passwordGuidelines.special ? 'met' : 'not-met'}>Contains one special character</li>
                </ul>
            </div>

            <br/>
            <br/>

            <div className="form-navigation-button-container">
                <button 
                    className="standard-button green"
                    disabled={submitPromise}
                    onClick={goToNextPage}
                >Continue</button>
            </div>
        </React.Fragment>
    )
}

export default PageOne