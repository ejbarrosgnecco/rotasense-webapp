import axios from "axios"
import axiosRetry from "axios-retry"
import React, { Dispatch, SetStateAction, useState } from "react"
import Select from "react-dropdown-select"
import { trackPromise, usePromiseTracker } from "react-promise-tracker"
import { useSelector } from "react-redux"
import CopyToClipboard from "../../../components/copyToClipboard/copyToClipboard"
import ErrorMessage from "../../../components/error/error"
import InlinePromiseTracker from "../../../components/promiseTrackers/inlineTracker"
import { UserRecord } from "../../../store/features/system/userAuthentication"
import { RootState } from "../../../store/store"
import { SuccessResponse } from "../../../types.config"
import { Team, User } from "../organisation"

axiosRetry(axios, {
    retries: 5,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

interface NewUser {
    firstName: string,
    lastName: string,
    emailAddress: string,
    team: {
        _id: string,
        name: string
    },
    profile: string,
    role: string,
    defaultPassword: string
}

const AddNewUser: React.FC<{
    closeModal: () => void,
    team: Team,
    getUsers: () => Promise<void>
}> = ({ closeModal, team, getUsers }): JSX.Element => {
    const userDetails = useSelector((state: RootState) => state.userAuthentication);

    const [userSubmitted, setUserSubmitted] = useState<boolean>(false);

    const [errorMessage, setErrorMessage] = useState<string>("")
    const [errors, setErrors] = useState({
        firstName: false,
        lastName: false,
        emailAddress: false,
        profile: false,
        role: false,
        error: false
    })

    const [newUser, setNewUser] = useState<NewUser>({
        firstName: "",
        lastName: "",
        emailAddress: "",
        team: {
            _id: team._id,
            name: team.name
        },
        profile: "",
        role: "",
        defaultPassword: ""
    })

    const handleFillInForm = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { value, name } = e.target;

        setNewUser({
            ...newUser,
            [name]: value
        })

        setErrors({
            ...errors,
            [name]: false,
            error: false
        })
    }

    const handleDataValidation = (): boolean => {
        let errorsCount: number = 0;
        let errorsObject: { [key: string]: boolean } = {};

        const regularFields = ["firstName", "lastName", "profile", "role"];

        for (let i = 0; i < regularFields.length; i++) {
            const field = regularFields[i];
            
            if((newUser as any)[field].length < 2) {
                errorsCount++;
                errorsObject[field] = true;
            }
        }

        if(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,6}$/.test(newUser.emailAddress) === false) {
            errorsCount++;
            errorsObject.emailAddress = true;
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

    const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();

        if(handleDataValidation() === true) {
            trackPromise(
                new Promise<void>( async (resolve) => {
                    await axios({
                        method: "POST",
                        url: process.env.REACT_APP_BACKEND_BASE_URL + `/organisation/users`,
                        headers: {
                            Authorization: "Bearer " + userDetails.accessToken
                        },
                        data: {
                            firstName: newUser.firstName,
                            lastName: newUser.lastName,
                            emailAddress: newUser.emailAddress,
                            team: newUser.team,
                            profile: newUser.profile,
                            role: newUser.role,
                        }
                    })
                    .then( async (value: { data: SuccessResponse }) => {
                        const response = value.data;

                        if(response.success === true) {
                            await getUsers();

                            setNewUser({
                                ...newUser,
                                defaultPassword: response.data.defaultPassword
                            })

                            setUserSubmitted(true);
                    
                            resolve();
                        } else {
                            setErrorMessage(response.reason || "");
                            setErrors({
                                ...errors,
                                error: true
                            })

                            resolve();
                        }
                    })
                    .catch(() => {
                        setErrors({
                            ...errors,
                            error: true
                        })

                        setErrorMessage("Oops, there was a technical error, please try again")
                        resolve();
                    })
                })
            , "addUser")
        }
    }

    const submitPromise = usePromiseTracker({ area: "addUser" }).promiseInProgress;

    return (
        <div className="modal-backdrop show">
            <div className="modal-wrapper-container">
                <div className={`standard-modal ${userSubmitted ? "medium-width" : "large-width"}`}>
                    <div className="standard-modal-title">
                        <h3>{!userSubmitted ? "Create new user" : "User created successfully"}</h3>

                        <button
                            className="close-modal-button"
                            onClick={closeModal}
                        />
                    </div>

                    {
                        !userSubmitted ? (
                            <React.Fragment>
                                <div className="standard-modal-body">
                                    <div className="split-column">
                                        <span>
                                            <label className={`expanded-input-wrapper ${errors.firstName ? 'error' : ''}`} htmlFor="firstName">
                                                <div className="expanded-input-content">
                                                    <input
                                                        id="firstName"
                                                        className="expanded-input"
                                                        placeholder="e.g. Joe"
                                                        autoComplete="off"
                                                        name="firstName"
                                                        value={newUser.firstName}
                                                        onChange={handleFillInForm}
                                                        disabled={submitPromise}
                                                    />
                        
                                                    <label className="expanded-input-label" htmlFor="firstName">First name*</label>
                                                </div>
                                            </label>

                                            {
                                                errors.firstName ? (
                                                    <ErrorMessage
                                                        message="Please enter the user's first name"
                                                        bottomSpacing="20px"
                                                    />
                                                ) : null
                                            }
                                        </span>

                                        <span>
                                            <label className={`expanded-input-wrapper ${errors.lastName ? 'error' : ''}`} htmlFor="lastName">
                                                <div className="expanded-input-content">
                                                    <input
                                                        id="lastName"
                                                        className="expanded-input"
                                                        placeholder="e.g. Bloggs"
                                                        autoComplete="off"
                                                        name="lastName"
                                                        value={newUser.lastName}
                                                        onChange={handleFillInForm}
                                                        disabled={submitPromise}
                                                    />
                        
                                                    <label className="expanded-input-label" htmlFor="lastName">Last name*</label>
                                                </div>
                                            </label>

                                            {
                                                errors.lastName ? (
                                                    <ErrorMessage
                                                        message="Please enter the user's last name"
                                                        bottomSpacing="20px"
                                                    />
                                                ) : null
                                            }
                                        </span>
                                    </div>

                                    <label className={`expanded-input-wrapper ${errors.emailAddress ? 'error' : ''}`} htmlFor="emailAddress">
                                        <div className="expanded-input-content">
                                            <input
                                                id="emailAddress"
                                                className="expanded-input"
                                                placeholder="e.g. joe.bloggs@mycompany.com"
                                                autoComplete="off"
                                                name="emailAddress"
                                                value={newUser.emailAddress}
                                                onChange={handleFillInForm}
                                                disabled={submitPromise}
                                            />
                
                                            <label className="expanded-input-label" htmlFor="emailAddress">Email address*</label>
                                        </div>
                                    </label>

                                    {
                                        errors.emailAddress ? (
                                            <ErrorMessage
                                                message="Please enter a valid email address"
                                                bottomSpacing="20px"
                                            />
                                        ) : null
                                    }

                                    <div className="split-column">
                                        <span>
                                            <label className={`expanded-input-wrapper ${errors.profile ? 'error' : ''}`} htmlFor="profile">
                                                <div className="expanded-input-content">
                                                    <Select
                                                        className="expanded-input-select"
                                                        placeholder="Select a profile"
                                                        options={[
                                                            { value: "Admin" },
                                                            { value: "Team manager" },
                                                            { value: "Standard" }
                                                        ]}
                                                        labelField="value"
                                                        values={newUser.profile ? [{ value: newUser.profile }] : []}
                                                        onChange={e => {
                                                            const value = e[0].value;

                                                            setNewUser({
                                                                ...newUser,
                                                                profile: value
                                                            })

                                                            setErrors({
                                                                ...errors,
                                                                profile: false,
                                                                error: false
                                                            })
                                                        }}
                                                        backspaceDelete={false}
                                                        searchable={false}
                                                        disabled={submitPromise}
                                                    />
                        
                                                    <label className="expanded-input-label" htmlFor="profile">Profile*</label>
                                                </div>
                                            </label>

                                            {
                                                errors.profile ? (
                                                    <ErrorMessage
                                                        message="Please select a permission profile"
                                                        bottomSpacing="20px"
                                                    />
                                                ) : null
                                            }
                                        </span>

                                        <span>
                                            <label className={`expanded-input-wrapper ${errors.profile ? 'error' : ''}`} htmlFor="role">
                                                <div className="expanded-input-content">
                                                    <Select
                                                        className="expanded-input-select"
                                                        placeholder="Select a role"
                                                        options={!team.roles ? [] : team.roles.map(role => (
                                                            { value: role }
                                                        ))}
                                                        sortBy="value"
                                                        labelField="value"
                                                        values={newUser.role ? [{ value: newUser.role }] : []}
                                                        onChange={e => {
                                                            const value = e[0].value;

                                                            setNewUser({
                                                                ...newUser,
                                                                role: value
                                                            })

                                                            setErrors({
                                                                ...errors,
                                                                role: false,
                                                                error: false
                                                            })
                                                        }}
                                                        backspaceDelete={false}
                                                        searchable={false}
                                                        disabled={submitPromise}
                                                    />
                        
                                                    <label className="expanded-input-label" htmlFor="role">Role*</label>
                                                </div>
                                            </label>

                                            {
                                                errors.role ? (
                                                    <ErrorMessage
                                                        message="Please select a role"
                                                        bottomSpacing="20px"
                                                    />
                                                ) : null
                                            }
                                        </span>
                                    </div>

                                    <div className="split-column">
                                        <span>
                                            <label className={`expanded-input-wrapper`} htmlFor="team">
                                                <div className="expanded-input-content">
                                                    <Select
                                                        className="expanded-input-select"
                                                        placeholder="Select a team"
                                                        options={[ { value: team.name }]}
                                                        sortBy="value"
                                                        labelField="value"
                                                        values={[ { value: team.name }]}
                                                        onChange={e => {}}
                                                        backspaceDelete={false}
                                                        searchable={false}
                                                        disabled={true}
                                                    />
                        
                                                    <label className="expanded-input-label" htmlFor="team">Team*</label>
                                                </div>
                                            </label>
                                        </span>
                                    </div>
                                </div>

                                <div className="standard-modal-footer">
                                    <button
                                        className="standard-button green"
                                        onClick={handleSubmit}
                                        disabled={submitPromise}
                                    >Confirm</button>
                                </div>

                                {
                                    submitPromise || errors.error ? (
                                        <div className="standard-modal-additional-info">
                                            <InlinePromiseTracker
                                                searchArea="addUser"
                                            />
                                            
                                            {
                                                errors.error ? (
                                                    <ErrorMessage
                                                        message={errorMessage}
                                                    />
                                                ) : null
                                            }
                                        </div>
                                    ) : null
                                }
                            </React.Fragment>
                        ) : (
                            <React.Fragment>
                                <div className="standard-modal-body">
                                    <p className="secondary-text">Please make note of the following password which has been set as the default password. Once the user logs in, they'll be able to change their password.</p>

                                    <br/>

                                    <label className={`expanded-input-wrapper password`} htmlFor="team">
                                        <div className="expanded-input-content">
                                            <input
                                                id="password"
                                                className="expanded-input"
                                                autoComplete="off"
                                                name="password"
                                                type="text"
                                                value={newUser.defaultPassword}
                                                disabled={true}
                                            />

                                            <label className="expanded-input-label" htmlFor="team">Default password</label>
                                        </div>

                                        <CopyToClipboard 
                                            toCopy={newUser.defaultPassword}
                                            styles={{ padding: 10, fontSize: 20 }}
                                        />
                                    </label>
                                </div>
                            </React.Fragment>
                        )
                    }
                    
                </div>
            </div>
        </div>
    )
}

export default AddNewUser