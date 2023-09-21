import axios from "axios";
import axiosRetry from "axios-retry";
import React, { useEffect, useState } from "react"
import { trackPromise, usePromiseTracker } from "react-promise-tracker"
import { useSelector } from "react-redux";
import { RootState } from "../../../../store/store";
import { SuccessResponse } from "../../../../types.config";
import ErrorMessage from "../../../error/error";
import InlinePromiseTracker from "../../../promiseTrackers/inlineTracker";

import "./changePassword-styles.scss";

axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

const ChangePassword: React.FC<{ closeModal: () => void }> = ({ closeModal }): JSX.Element => {
    const userDetails = useSelector((root: RootState) => root.userAuthentication)

    const [credentials, setCredentials] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
    })

    const [showPasswords, setShowPasswords] = useState({
        currentPassword: false,
        newPassword: false,
        confirmNewPassword: false
    })

    const [passwordMeetsGuidelines, setPasswordMeetsGuidelines] = useState<boolean>(false);
    const [passwordGuidelines, setPasswordGuidelines] = useState({
        uppercase: false,
        lowercase: false,
        minimum: false,
        special: false
    })

    const [errorMessage, setErrorMessage] = useState<string>("")
    const [errors, setErrors] = useState({
        currentPassword: false,
        newPassword: false,
        confirmNewPassword: false,
        error: false
    })

    const handleFillInForm = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;

        setCredentials({
            ...credentials,
            [name]: value
        })

        setErrors({
            ...errors,
            [name]: false,
            error: false
        })
    }

    const handleGuidelinesCheck = (): void => {
         // Contains one uppercase letter (A-Z)
      const uppercase_regex = new RegExp(/^(?=.*?[A-Z])/)
      const uppercase_match = uppercase_regex.test(credentials.newPassword)

      // Contains one lowercase letter (A-Z)
      const lowercase_regex = new RegExp(/^(?=.*?[a-z])/)
      const lowercase_match = lowercase_regex.test(credentials.newPassword)

      // At least 6 characters
      const length_match = credentials.newPassword.length >= 8

      // Contains one special character
      const special_regex = new RegExp(/^(?=.*?[#?!@$%^&*-])/)
      const special_match = special_regex.test(credentials.newPassword)


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
    }, [credentials.newPassword])

    const handleDataValidation = (): boolean => {
        let errorsCount: number = 0;
        let errorsObject: { [key: string]: boolean } = {};

        if(credentials.currentPassword.length < 8) {
            errorsCount++;
            errorsObject.currentPassword = true;
        }

        if(passwordMeetsGuidelines === false) {
            errorsCount++;
            errorsObject.newPassword = true;
        } else if (credentials.newPassword !== credentials.confirmNewPassword) {
            errorsCount++;
            errorsObject.confirmNewPassword = true;
        }

        if(errorsCount === 0) {
            return true
        } else {
            setErrors({
                ...errors,
                ...errorsObject
            })

            return false;
        }
    }


    const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();

        if(handleDataValidation() === true) {
            trackPromise(
                new Promise<void>( async (resolve) => {
                    await axios({
                        method: "PUT",
                        url: process.env.REACT_APP_BACKEND_BASE_URL + "/account/change-password",
                        headers: {
                            Authorization: "Bearer " + userDetails.accessToken
                        },
                        data: {
                            currentPassword: credentials.currentPassword,
                            newPassword: credentials.newPassword
                        }
                    })
                    .then((value: { data: SuccessResponse }) => {
                        const response = value.data;

                        if(response.success === true) {
                            closeModal();

                            resolve()
                        } else {
                            setErrorMessage(response.reason || "")
                            setErrors({
                                ...errors,
                                error: true
                            })

                            resolve();
                        }
                    })
                    .catch(() => {
                        setErrorMessage("Oops, there was a technical error, please try again")
                        setErrors({
                            ...errors,
                            error: true
                        })

                        resolve();
                    })
                })
            , "change_password")
        }
    }

    const changePasswordPromise = usePromiseTracker({ area: "change_password" }).promiseInProgress;

    return (
        <div className="modal-backdrop show">
            <div className="modal-wrapper-container">
                <div className="standard-modal medium-width">
                    <div className="standard-modal-title">
                        <h3>Change password</h3>

                        <button 
                            className="close-modal-button"
                            disabled={changePasswordPromise}
                            onClick={closeModal}
                        />
                    </div>

                    <div className="standard-modal-body">
                        <label className={`expanded-input-wrapper password ${errors.currentPassword || (errors.error && errorMessage.includes("incorrect")) ? 'error' : ''}`} htmlFor="currentPassword">
                            <div className="expanded-input-content">
                                <input
                                    id="currentPassword"
                                    className="expanded-input"
                                    type={showPasswords.currentPassword ? 'text' : 'password'}
                                    placeholder={showPasswords.currentPassword ? 'MyPassword123!' : '••••••••••••••'}
                                    autoComplete="off"
                                    name="currentPassword"
                                    value={credentials.currentPassword}
                                    onChange={handleFillInForm}
                                    disabled={changePasswordPromise}
                                />
    
                                <label className="expanded-input-label" htmlFor="currentPassword">Current password</label>
                            </div>

                            <button
                                className={`show-password-button white ${showPasswords.currentPassword ? 'show' : 'hide'}`}
                                onClick={(e) => {e.preventDefault(); setShowPasswords({ ...showPasswords, currentPassword: !showPasswords.currentPassword})}}
                                disabled={changePasswordPromise}
                            />
                        </label>

                        {
                            errors.error && errorMessage.includes("incorrect") ? (
                                <ErrorMessage
                                    message={errorMessage}
                                />
                            ) : null
                        }

                        {
                            errors.currentPassword ? (
                                <ErrorMessage
                                    message="Please enter your current password"
                                />
                            ) : null
                        }

                        <hr style={{
                            margin: "30px 0"
                        }}/>

                        <label className={`expanded-input-wrapper password ${errors.newPassword ? 'error' : ''}`} htmlFor="newPassword">
                            <div className="expanded-input-content">
                                <input
                                    id="newPassword"
                                    className="expanded-input"
                                    type={showPasswords.newPassword ? 'text' : 'password'}
                                    placeholder={showPasswords.newPassword ? 'MyPassword123!' : '••••••••••••••'}
                                    autoComplete="off"
                                    name="newPassword"
                                    value={credentials.newPassword}
                                    onChange={handleFillInForm}
                                    disabled={changePasswordPromise}
                                />
    
                                <label className="expanded-input-label" htmlFor="newPassword">New password</label>
                            </div>

                            <button
                                className={`show-password-button white ${showPasswords.newPassword ? 'show' : 'hide'}`}
                                onClick={(e) => {e.preventDefault(); setShowPasswords({ ...showPasswords, newPassword: !showPasswords.newPassword})}}
                                disabled={changePasswordPromise}
                            />
                        </label>

                        {
                            errors.newPassword ? (
                                <ErrorMessage
                                    message="Your new password must meet the below guidelines"
                                    bottomSpacing="-10px"
                                />
                            ) : null
                        }

                        {
                            !passwordMeetsGuidelines ? (
                                <React.Fragment>
                                    <div className="password-guidelines-container">
                                        <h5>Password guidelines</h5>

                                        <ul className="password-guidelines-list">
                                            <li className={passwordGuidelines.uppercase ? 'met' : 'not-met'}>Contains one uppercase letter (A-Z)</li>
                                            <li className={passwordGuidelines.lowercase ? 'met' : 'not-met'}>Contains one lowercase letter (a-z)</li>
                                            <li className={passwordGuidelines.minimum ? 'met' : 'not-met'}>Minimum of 8 characters</li>
                                            <li className={passwordGuidelines.special ? 'met' : 'not-met'}>Contains one special character</li>
                                        </ul>
                                    </div>
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                    <label className={`expanded-input-wrapper repeat-password ${errors.confirmNewPassword ? 'error' : ''}`} htmlFor="confirmNewPassword">
                                        <div className="expanded-input-content">
                                            <input
                                                id="confirmNewPassword"
                                                className="expanded-input"
                                                type={showPasswords.confirmNewPassword ? 'text' : 'password'}
                                                placeholder={showPasswords.confirmNewPassword ? 'MyPassword123!' : '••••••••••••••'}
                                                autoComplete="off"
                                                name="confirmNewPassword"
                                                value={credentials.confirmNewPassword}
                                                onChange={handleFillInForm}
                                                disabled={changePasswordPromise}
                                            />
                
                                            <label className="expanded-input-label" htmlFor="confirmNewPassword">Confirm new password</label>
                                        </div>

                                        <button
                                            className={`show-password-button white ${showPasswords.confirmNewPassword ? 'show' : 'hide'}`}
                                            onClick={(e) => {e.preventDefault(); setShowPasswords({ ...showPasswords, confirmNewPassword: !showPasswords.confirmNewPassword})}}
                                            disabled={changePasswordPromise}
                                        />
                                    </label>

                                    {
                                        errors.confirmNewPassword ? (
                                            <ErrorMessage
                                                message="The passwords entered does not match"
                                            />
                                        ) : null
                                    }
                                </React.Fragment>
                            )
                        }

                        {
                            errors.error && !errorMessage.includes("incorrect") ? (
                                <ErrorMessage
                                    message={errorMessage}
                                />
                            ) : null
                        }
                    </div>

                    <div className="standard-modal-footer">
                        <button
                            className="standard-button green"
                            disabled={changePasswordPromise}
                            onClick={handleSubmit}
                        >Confirm</button>
                    </div>

                    {
                        changePasswordPromise ? (
                            <div className="standard-modal-additional-info">
                                <InlinePromiseTracker
                                    searchArea="change_password"
                                />
                            </div>
                        ) : null
                    }
                </div>
            </div>
        </div>
    )
}

export default ChangePassword