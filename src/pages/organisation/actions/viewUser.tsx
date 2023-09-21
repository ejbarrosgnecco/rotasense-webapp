import axios from "axios"
import axiosRetry from "axios-retry"
import React, { Dispatch, SetStateAction, useState } from "react"
import Select from "react-dropdown-select"
import { trackPromise, usePromiseTracker } from "react-promise-tracker"
import { useSelector } from "react-redux"
import DecisionWindow from "../../../components/decisionWindow/decisionWindow"
import ErrorMessage from "../../../components/error/error"
import InlinePromiseTracker from "../../../components/promiseTrackers/inlineTracker"
import { RootState } from "../../../store/store"
import { SuccessResponse } from "../../../types.config"
import { Team, User } from "../organisation"
import TeamLookup, { RecordIdentifier } from "./teamLookup"

interface EditUser extends User {
    department?: {
        _id: string,
        name: string
    },
    team?: {
        _id: string,
        name: string
    }
}

axiosRetry(axios, {
    retries: 5,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

const ViewUser: React.FC<{
    closeModal: () => void,
    user: User,
    setUser: Dispatch<SetStateAction<User>>,
    userOptions: User[],
    setUserOptions: Dispatch<SetStateAction<User[]>>,
    team: Team
}> = ({ closeModal, user, setUser, team, userOptions, setUserOptions }): JSX.Element => {
    const userDetails = useSelector((root: RootState) => root.userAuthentication);

    const [showDecisionUserStatus, setShowDecisionUserStatus] = useState<boolean>(false);
    const [showChangeTeam, setShowChangeTeam] = useState<boolean>(false);

    const [editMode, setEditMode] = useState<boolean>(false);
    const [editValues, setEditValues] = useState<EditUser>(user);

    const [statusError, setStatusError] = useState<string>("")
    const [editErrorMessage, setEditErrorMessage] = useState<string>("");
    const [editErrors, setEditErrors] = useState({
        firstName: false,
        lastName: false,
        emailAddress: false,
        profile: false,
        role: false,
        error: false
    })

    const handleFillInForm = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { value, name } = e.target;

        setEditValues({
            ...editValues,
            [name]: value
        })

        setEditErrors({
            ...editErrors,
            [name]: false,
            error: false
        })
    }

    const handleSelectTeam = (newDepartment: RecordIdentifier, newTeam: RecordIdentifier): void => {
        setEditValues({
            ...editValues,
            department: newDepartment,
            team: newTeam
        })

        setShowChangeTeam(false);
    }

    const handleChangeUserStatus = async (): Promise<void> => {
        const newStatus = user.status === "active" ? "suspended" : "active";

        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "PUT",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/organisation/users/${user._id}`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    },
                    data: {
                        status: newStatus
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        setUser({
                            ...user,
                            status: newStatus
                        })

                        // Remove from userOptions array
                        let newArray = [...userOptions];
                        const removeIndex = newArray.findIndex(i => i._id === user._id);

                        newArray.splice(removeIndex, 1);

                        setUserOptions(newArray);

                        setShowDecisionUserStatus(false);
                        closeModal();

                        resolve();
                    } else {
                        setStatusError(response.success || "")
                        resolve();
                    }
                })
                .catch(() => {
                    setStatusError("Oops, there was a technical error, please try again")
                    resolve();
                })
            })
        , 'change_user_status')
    }

    const handleDataValidation = (): boolean => {
        let errorsCount: number = 0;
        let errorsObject: { [key: string]: boolean } = {};

        const regularFields = ["firstName", "lastName", "profile", "role"];

        for (let i = 0; i < regularFields.length; i++) {
            const field = regularFields[i];
            
            if((editValues as any)[field].length < 2) {
                errorsCount++;
                errorsObject[field] = true;
            }
        }

        if(errorsCount === 0) {
            return true
        } else {
            setEditErrors({
                ...editErrors,
                ...errorsObject
            })

            return false
        }
    }

    const handleSubmit = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();

        if(handleDataValidation() === true) {
            const { _id, department, emailAddress, ...values } = editValues;

            trackPromise(
                new Promise<void>( async (resolve) => {
                    await axios({
                        method: "PUT",
                        url: process.env.REACT_APP_BACKEND_BASE_URL + `/organisation/users/${_id}`,
                        headers: {
                            Authorization: "Bearer " + userDetails.accessToken
                        },
                        data: values
                    })
                    .then((value: { data: SuccessResponse }) => {
                        const response = value.data;

                        if(response.success === true) {
                            // Set userOptions array
                            const newArray = [...userOptions];
                            const editIndex = newArray.findIndex(i => i._id === _id);

                            if(values.team !== undefined && values.team?._id !== team._id) {
                                newArray.splice(editIndex, 1);
                            } else {
                                newArray[editIndex] = {
                                    ...user,
                                    ...values
                                }
                            }
                            
                            setUserOptions(newArray);

                            // Set current user
                            setUser({
                                ...user,
                                ...values
                            })

                            setEditMode(false);
                            setEditValues(user);

                            resolve();
                        } else {
                            setEditErrorMessage(response.reason || "")
                            setEditErrors({
                                ...editErrors,
                                error: true
                            })
    
                            resolve();
                        }
                    })
                    .catch(() => {
                        setEditErrorMessage("Oops, there was a technical error, please try again")
                        setEditErrors({
                            ...editErrors,
                            error: true
                        })

                        resolve();
                    })
                })
            , 'edit_user')
        }
    }

    const editUserPromise = usePromiseTracker({ area: "edit_user" }).promiseInProgress;

    return (
        <React.Fragment>
            <div className="modal-backdrop show">
                <div className="modal-wrapper-container">
                    <div className={`standard-modal ${editMode ? 'large-width' : 'medium-width'}`}>
                        <div className="standard-modal-title">
                            <h3>View user</h3>

                            <button
                                className="close-modal-button"
                                onClick={closeModal}
                            />
                        </div>

                        <div className="standard-modal-body">
                            <div className="float-right-bar">
                                <button
                                    className="lock-button"
                                    disabled={editUserPromise || editMode}
                                />

                                {
                                    !editMode ? (
                                        <button
                                            className="edit-button"
                                            onClick={() => {
                                                setEditMode(true)
                                            }}
                                        />
                                    ) : null
                                }

                                <button 
                                    className={`${user.status === "active" ? "bin" : "restore-bin"}-button`}
                                    disabled={editUserPromise || editMode}
                                    onClick={() => {
                                        setShowDecisionUserStatus(true)
                                    }}
                                />
                            </div>

                            {
                                editMode ? (
                                    <React.Fragment>
                                        <div className="split-column">
                                            <span>
                                                <label className={`expanded-input-wrapper ${editErrors.firstName ? 'error' : ''}`} htmlFor="firstName">
                                                    <div className="expanded-input-content">
                                                        <input
                                                            id="firstName"
                                                            className="expanded-input"
                                                            placeholder="e.g. Joe"
                                                            autoComplete="off"
                                                            name="firstName"
                                                            value={editValues.firstName}
                                                            onChange={handleFillInForm}
                                                            disabled={editUserPromise}
                                                        />
                            
                                                        <label className="expanded-input-label" htmlFor="firstName">First name*</label>
                                                    </div>
                                                </label>

                                                {
                                                    editErrors.firstName ? (
                                                        <ErrorMessage
                                                            message="Please enter the user's first name"
                                                            bottomSpacing="20px"
                                                        />
                                                    ) : null
                                                }
                                            </span>

                                            <span>
                                                <label className={`expanded-input-wrapper ${editErrors.lastName ? 'error' : ''}`} htmlFor="lastName">
                                                    <div className="expanded-input-content">
                                                        <input
                                                            id="lastName"
                                                            className="expanded-input"
                                                            placeholder="e.g. Bloggs"
                                                            autoComplete="off"
                                                            name="lastName"
                                                            value={editValues.lastName}
                                                            onChange={handleFillInForm}
                                                            disabled={editUserPromise}
                                                        />
                            
                                                        <label className="expanded-input-label" htmlFor="lastName">Last name*</label>
                                                    </div>
                                                </label>

                                                {
                                                    editErrors.lastName ? (
                                                        <ErrorMessage
                                                            message="Please enter the user's first name"
                                                            bottomSpacing="20px"
                                                        />
                                                    ) : null
                                                }
                                            </span>
                                        </div>

                                        <label className={`expanded-input-wrapper disabled ${editErrors.emailAddress ? 'error' : ''}`} htmlFor="emailAddress">
                                            <div className="expanded-input-content">
                                                <input
                                                    id="emailAddress"
                                                    className="expanded-input"
                                                    autoComplete="off"
                                                    name="emailAddress"
                                                    value={editValues.emailAddress}
                                                    onChange={handleFillInForm}
                                                    disabled={true}
                                                />
                    
                                                <label className="expanded-input-label" htmlFor="emailAddress">Email address</label>
                                            </div>
                                        </label>

                                        <div className="split-column">
                                            <span>
                                                <label className={`expanded-input-wrapper ${user.profile === "Super Admin" ? 'disabled' : ''} ${editErrors.profile ? 'error' : ''}`} htmlFor="profile">
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
                                                            values={editValues.profile ? [{ value: editValues.profile }] : []}
                                                            onChange={e => {
                                                                const value = e[0].value;

                                                                setEditValues({
                                                                    ...editValues,
                                                                    profile: value
                                                                })

                                                                setEditErrors({
                                                                    ...editErrors,
                                                                    profile: false,
                                                                    error: false
                                                                })
                                                            }}
                                                            backspaceDelete={false}
                                                            searchable={false}
                                                            disabled={editUserPromise || user.profile === "Super Admin"}
                                                        />
                            
                                                        <label className="expanded-input-label" htmlFor="profile">Profile*</label>
                                                    </div>
                                                </label>

                                                {
                                                    editErrors.profile ? (
                                                        <ErrorMessage
                                                            message="Please select a permission profile"
                                                            bottomSpacing="20px"
                                                        />
                                                    ) : null
                                                }
                                            </span>

                                            <span>
                                                <label className={`expanded-input-wrapper ${editErrors.role ? 'error' : ''}`} htmlFor="role">
                                                    <div className="expanded-input-content">
                                                        <Select
                                                            className="expanded-input-select"
                                                            placeholder="Select a role"
                                                            options={!team.roles ? [] : team.roles.map(role => (
                                                                { value: role }
                                                            ))}
                                                            sortBy="value"
                                                            labelField="value"
                                                            values={editValues.role ? [{ value: editValues.role }] : []}
                                                            onChange={e => {
                                                                const value = e[0].value;

                                                                setEditValues({
                                                                    ...editValues,
                                                                    role: value
                                                                })

                                                                setEditErrors({
                                                                    ...editErrors,
                                                                    role: false,
                                                                    error: false
                                                                })
                                                            }}
                                                            backspaceDelete={false}
                                                            searchable={false}
                                                            disabled={editUserPromise}
                                                        />
                            
                                                        <label className="expanded-input-label" htmlFor="role">Role*</label>
                                                    </div>
                                                </label>

                                                {
                                                    editErrors.role ? (
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
                                                <label className={`expanded-input-wrapper disabled`} htmlFor="team">
                                                    <div className="expanded-input-content">
                                                        <Select
                                                            className="expanded-input-select"
                                                            placeholder="Select a team"
                                                            options={[ { value: editValues.team?.name || team.name }]}
                                                            sortBy="value"
                                                            labelField="value"
                                                            values={[ { value: editValues.team?.name || team.name }]}
                                                            onChange={e => {}}
                                                            backspaceDelete={false}
                                                            searchable={false}
                                                            disabled={true}
                                                        />
                            
                                                        <label className="expanded-input-label" htmlFor="team">Team*</label>
                                                    </div>
                                                </label>

                                                <button 
                                                    style={{ display: "block", marginTop: -5 }}
                                                    className="underline-text-link"
                                                    onClick={() => setShowChangeTeam(true)}
                                                >Change team?</button>
                                            </span>
                                        </div>
                                    </React.Fragment>
                                ) : (
                                    <React.Fragment>
                                        <h5 style={{ margin: 0 }}>Name</h5>
                                        <p style={{marginTop: 10}}>{user.firstName} {user.lastName}</p>

                                        <h5 style={{ marginBottom: 0 }}>Email address</h5>
                                        <p style={{marginTop: 10}}>{user.emailAddress}</p>

                                        <h5 style={{ marginBottom: 0 }}>Profile</h5>
                                        <p style={{marginTop: 10}}>{user.profile}</p>

                                        <h5 style={{ marginBottom: 0 }}>Role</h5>
                                        <p style={{marginTop: 10}}>{user.role}</p>
                                    </React.Fragment>
                                )
                            }
                        </div>

                        {
                            editMode ? (
                                <React.Fragment>
                                    <div className="standard-modal-footer">
                                        <button
                                            className="underline-text-link"
                                            onClick={() => {
                                                setEditMode(false);
                                                setEditValues(user);
                                            }}
                                        >Cancel</button>

                                        <button
                                            className="standard-button green"
                                            onClick={handleSubmit}
                                            disabled={editUserPromise}
                                        >Save changes</button>
                                    </div>

                                    {
                                        editUserPromise || editErrors.error ? (
                                            <div className="standard-modal-additional-info">
                                                <InlinePromiseTracker
                                                    searchArea="edit_user"
                                                />

                                                {
                                                    editErrors.error ? (
                                                        <ErrorMessage
                                                            message={editErrorMessage}
                                                        />
                                                    ) : null
                                                }
                                            </div>
                                        ) : null
                                    }
                                </React.Fragment>
                            ) : null
                        }
                    </div>
                </div>
            </div>

            {
                showChangeTeam ? (
                    <TeamLookup
                        closeModal={() => setShowChangeTeam(false)}
                        handleSelectTeam={handleSelectTeam}
                    />
                ) : null
            }

            {
                showDecisionUserStatus ? (
                    <DecisionWindow
                        title={user.status === "active" ? "Suspend user" : "Re-activate user"}
                        bodyJsx={[
                            <p className="secondary-text">Are you sure you want to {user.status === "active" ? "suspend this user? You will be able to re-activate" : "re-activate this user? You will be able to re-suspend"} them via this page.</p>
                        ]}
                        acceptFunction={handleChangeUserStatus}
                        searchArea="change_user_status"
                        closeModal={() => setShowDecisionUserStatus(false)}
                        errorMessage={statusError}
                        acceptButtonText="Confirm"
                    />
                ) : null
            }
        </React.Fragment>
    )
}

export default ViewUser