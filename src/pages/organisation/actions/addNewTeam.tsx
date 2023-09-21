import axios from "axios"
import axiosRetry from "axios-retry"
import React, { Dispatch, SetStateAction, useEffect, useState } from "react"
import Select from "react-dropdown-select"
import { trackPromise, usePromiseTracker } from "react-promise-tracker"
import { useSelector } from "react-redux"
import ErrorMessage from "../../../components/error/error"
import Tooltip from "../../../components/tooltip/tooltip"
import { RootState } from "../../../store/store"
import { SuccessResponse } from "../../../types.config"
import { Action, Department, Team } from "../organisation"
import AddNewAction from "./addNewAction"
import UserLookup, { UserAbbrev } from "./userLookup"
import ViewEditAction from "./viewEditAction"

interface NewTeam {
    name: string,
    department: {
        _id: string,
        name: string
    },
    manager: {
        _id: string,
        name: string,
        emailAddress: string
    },
    operatingHours: {
        from: string,
        to: string
    },
    actions: Action[],
    roles: string[]
}

axiosRetry(axios, {
    retries: 5,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

const AddNewTeam: React.FC<{
    closeModal: Dispatch<SetStateAction<boolean>>,
    teamOptions: Team[],
    setTeamOptions: Dispatch<SetStateAction<Team[]>>,
    department: Department
}> = ({ closeModal, teamOptions, setTeamOptions, department }): JSX.Element => {
    const userDetails = useSelector((state: RootState) => state.userAuthentication)

    const [showUserLookup, setShowUserLookup] = useState<boolean>(false);
    const [showAddNewAction, setShowAddNewAction] = useState<boolean>(false);

    const [showEditAction, setShowEditAction] = useState<Action>({
        action: "",
        color: "",
        restricted: false,
        restrictedTo: []
    })
    
    const [hourOptions, setHourOptions] = useState<string[]>(["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"])
    const [minuteOptions, setMinuteOptions] = useState<string[]>(["00", "15", "30", "45"])

    const [newRoleName, setNewRoleName] = useState<string>("")

    const [teamDetails, setTeamDetails] = useState<NewTeam>({
        name: "",
        department: {
            _id: "",
            name: ""
        },
        manager: {
            _id: "",
            name: "",
            emailAddress: ""
        },
        operatingHours: {
            from: "09:00",
            to: "17:00"
        },
        actions: [],
        roles: []
    })
    
    const [errorMessage, setErrorMessage] = useState<string>("")
    const [errors, setErrors] = useState({
        name: false,
        manager: false,
        "operatingHours.from": false,
        "operatingHours.to": false,
        actions: false,
        roles: false,
        error: false
    })

    const handleFillInForm = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { value, name } = e.target;
        const nameParts: string[] = name.split(".")

        if(nameParts.length === 1) {
            setTeamDetails({
                ...teamDetails,
                [nameParts[0]]: value
            })
        } else {
            setTeamDetails({
                ...teamDetails,
                [nameParts[0]]: {
                    ...(teamDetails as any)[nameParts[0]],
                    [nameParts[1]]: value
                }
            })
        }

        setErrors({
            ...errors,
            [name]: false
        })
    }

    const handleSelectTeamManager = (user: UserAbbrev): void => {
        setTeamDetails({
            ...teamDetails,
            manager: {
                _id: user._id,
                name: user.fullName,
                emailAddress: user.emailAddress
            }
        })

        setErrors({
            ...errors,
            manager: false
        })

        setShowUserLookup(false)
    }

    const handleChangeTimings = (e: { value: string }[], key: string): void => {
        const keyName = key.split(":")[0];
        const keyPart = key.split(":")[1];

        const value = e[0].value;

        const parts = ["hour", "minute"];

        let newValue = (teamDetails.operatingHours as any)[keyName].split(":");
        newValue[parts.indexOf(keyPart)] = value;
        newValue = newValue.join(":");

        setTeamDetails({
            ...teamDetails,
            operatingHours: {
                ...teamDetails.operatingHours,
                [keyName]: newValue
            }
        })

        setErrors({
            ...errors,
            [`operatingHours.${keyName}`]: false
        })
    }

    const handleSaveNewAction = (newAction: Action): void => {
        setTeamDetails({
            ...teamDetails,
            actions: [
                ...teamDetails.actions,
                newAction
            ]
        })

        setErrors({
            ...errors,
            actions: false
        })

        setShowAddNewAction(false);
    }

    const handleResetEditAction = (e: React.FormEvent<HTMLButtonElement>): void => {
        setShowEditAction({
            action: "",
            color: "",
            restricted: false,
            restrictedTo: []
        })
    }

    const handleSaveEditAction = (newValue: Action, prevValue: Action): void => {
        const index = teamDetails.actions.indexOf(prevValue)

        let newArray = [...teamDetails.actions]
        newArray[index] = newValue;

        setTeamDetails({
            ...teamDetails,
            actions: newArray
        })
        
        setShowEditAction({
            action: "",
            color: "",
            restricted: false,
            restrictedTo: []
        })
    }

    const handleDeleteAction = (action: Action): void => {
        const index = teamDetails.actions.indexOf(action);

        let newArray = [...teamDetails.actions];
        newArray.splice(index, 1);

        setTeamDetails({
            ...teamDetails,
            actions: newArray
        })

        setShowEditAction({
            action: "",
            color: "",
            restricted: false,
            restrictedTo: []
        })
    }

    const handleDataValidation = (): boolean => {
        let errorsCount: number = 0;
        let errorsObject: { [key: string]: boolean } = {};

        if(teamDetails.name.length < 2) {
            errorsCount++;
            errorsObject.name = true;
        }

        if(teamDetails.manager._id === "") {
            errorsCount++;
            errorsObject.manager = true;
        }

        if(teamDetails.roles.length === 0) {
            errorsCount++;
            errorsObject.roles = true
        }

        // Check that all times & actions are valid
        if(/^([0-9]{2})+:+([0-9]{2})$/.test(teamDetails.operatingHours.from) === false) {
            errorsCount++;
            errorsObject["operatingHours.from"] = true;
        }

        if(/^([0-9]{2})+:+([0-9]{2})$/.test(teamDetails.operatingHours.to) === false) {
            errorsCount++;
            errorsObject["operatingHours.to"] = true;
        }

        if(teamDetails.actions.length === 0) {
            errorsCount++;
            errorsObject.actions = true;
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
        if(handleDataValidation() === true) {
            trackPromise(
                new Promise<void>( async (resolve, reject) => {
                    await axios({
                        method: "POST",
                        url: process.env.REACT_APP_BACKEND_BASE_URL + "/organisation/teams",
                        headers: {
                            Authorization: "Bearer " + userDetails.accessToken
                        },
                        data: {
                            ...teamDetails,
                            department: {
                                _id: department._id,
                                name: department.name
                            }
                        }
                    })
                    .then((value: { data: SuccessResponse}) => {
                        const response = value.data;

                        if(response.success === true) {
                            setTeamOptions([
                                ...teamOptions,
                                {
                                    name: teamDetails.name,
                                    _id: response.data.teamId
                                }
                            ])

                            closeModal(false);

                            resolve();
                        } else {
                            setErrorMessage(response.reason || "");
                            setErrors({
                                ...errors,
                                error: true
                            })

                            resolve()
                        }
                    })
                    .catch(() => {
                        setErrorMessage("Oops, there was a technical error, please try again");
                        setErrors({
                            ...errors,
                            error: true
                        })

                        resolve()
                    })
                })
            , 'addNewTeam')
        }
    }

    const submitPromise = usePromiseTracker({ area: "addNewTeam" }).promiseInProgress;

    return (
        <React.Fragment>
            <div className="modal-backdrop show">
                <div className="modal-wrapper-container">
                    <div className="standard-modal medium-width">
                        <div className="standard-modal-title">
                            <h3>Add new team</h3>

                            <button
                                className="close-modal-button"
                                onClick={() => closeModal(false)}
                            />
                        </div>

                        <div className="standard-modal-body">
                            <label className={`expanded-input-wrapper ${errors.name ? 'error' : ''}`} htmlFor="name">
                                <div className="expanded-input-content">
                                    <input
                                        id="name"
                                        className="expanded-input"
                                        placeholder="e.g. Talent Acquisition"
                                        autoComplete="off"
                                        name="name"
                                        value={teamDetails.name}
                                        onChange={handleFillInForm}
                                        disabled={submitPromise}
                                    />
        
                                    <label className="expanded-input-label" htmlFor="name">Team name*</label>
                                </div>
                            </label>

                            {
                                errors.name ? (
                                    <ErrorMessage
                                        message="Please enter the name of team"
                                    />
                                ) : null
                            }

                            <h5 style={{ marginBottom: 10 }}>Team manager</h5>

                            {
                                teamDetails.manager._id === "" ? (
                                    <button
                                        className="plain-text-link"
                                        onClick={() => setShowUserLookup(true)}
                                        disabled={submitPromise}
                                    ><i style={{fontSize: 16}} className="fa-solid fa-magnifying-glass"/> Select team manager</button>
                                ) : (
                                    <div className="flex-container">
                                        <p style={{ fontSize: 16 }}>{teamDetails.manager.name}<br/><span className="secondary-text" style={{fontSize: 14}}>{teamDetails.manager._id}</span></p>
                                        <button
                                            className="remove-button"
                                            disabled={submitPromise}
                                            onClick={() => {
                                                setTeamDetails({
                                                    ...teamDetails,
                                                    manager: {
                                                        _id: "",
                                                        name: "",
                                                        emailAddress: ""
                                                    }
                                                })
                                            }}
                                        />
                                    </div>
                                )
                            }

                            {
                                errors.manager ? (
                                    <ErrorMessage
                                        message="Please select a team manager"
                                    />
                                ) : null
                            }

                            <h5 style={{ marginBottom: 0 }}>Roles <Tooltip message="The roles that are available to assign to members of this team"/></h5>

                            <div style={{marginTop: 10}} className={`options-scroll-container ${errors.roles ? 'error' : ''}`}>
                                {
                                    teamDetails.roles.map((role, i) => {
                                        return (
                                            <div className="role-option">
                                                {role}

                                                <button
                                                    className="remove-button"
                                                    onClick={() => {
                                                        const newArray = [...teamDetails.roles];
                                                        newArray.splice(i, 1);

                                                        setTeamDetails({
                                                            ...teamDetails,
                                                            roles: newArray
                                                        })
                                                    }}
                                                />
                                            </div>
                                        )
                                    })
                                }

                                <div className="add-new-role-container">
                                    <input
                                        type="text"
                                        className={`add-new-role-input ${teamDetails.roles.includes(newRoleName) ? 'error' : ''}`}
                                        placeholder="Add new role..."
                                        value={newRoleName}
                                        onChange={e => {
                                            setNewRoleName(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))
                                        }}
                                        onKeyDown={e => {
                                            if(e.key === "Enter") {
                                                if(newRoleName.length > 1 && !teamDetails.roles.includes(newRoleName)) {
                                                    setTeamDetails({
                                                        ...teamDetails,
                                                        roles: [...teamDetails.roles, newRoleName]
                                                    })

                                                    setNewRoleName("")

                                                    setErrors({
                                                        ...errors,
                                                        roles: false
                                                    })
                                                }
                                            }
                                        }}
                                    />

                                    {
                                        newRoleName.length > 1 ? (
                                            <React.Fragment>
                                                <button
                                                    className="add-new-role-button yes"
                                                    onClick={() => {
                                                        setTeamDetails({
                                                            ...teamDetails,
                                                            roles: [...teamDetails.roles, newRoleName]
                                                        })

                                                        setNewRoleName("")

                                                        setErrors({
                                                            ...errors,
                                                            roles: false
                                                        })
                                                    }}
                                                    disabled={teamDetails.roles.includes(newRoleName)}
                                                />

                                                <button
                                                    className="add-new-role-button cancel"
                                                    onClick={() => {
                                                        setNewRoleName("")
                                                    }}
                                                    disabled={teamDetails.roles.includes(newRoleName)}
                                                />
                                            </React.Fragment>
                                        ) : null
                                    }

                                    
                                </div>
                            </div>

                            {
                                errors.roles ? (
                                    <ErrorMessage
                                        topSpacing="15px"
                                        message="Please add at least one role"
                                    /> 
                                ) : null
                            }

                            <h5 style={{ marginBottom: 0 }}>Operating hours</h5>

                            <table className="structural-table" style={{borderSpacing: 10}}>
                                <tbody>
                                    <tr>
                                        <td style={{textAlign: 'center', width: '50%'}}>From</td>
                                        <td style={{textAlign: 'center', width: '50%'}}>To</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div className="time-select-wrapper">
                                                {/* Hours */}
                                                <Select
                                                    className={`standard-select mini ${errors["operatingHours.from"]=== true ? 'error' : ''}`}
                                                    style={{ width: 60 }}
                                                    options={hourOptions.map(hour => {
                                                        return { value: hour }
                                                    })}
                                                    labelField={"value"}
                                                    values={[{ value: teamDetails.operatingHours.from.split(":")[0] }]}
                                                    placeholder="-"
                                                    multi={false}
                                                    backspaceDelete={false}
                                                    searchable={false}
                                                    onChange={(e) => handleChangeTimings(e, 'from:hour')}
                                                />
                                                :
                                                {/* Minutes */}
                                                <Select
                                                    className={`standard-select mini ${errors["operatingHours.from"] === true ? 'error' : ''}`}
                                                    style={{ width: 60 }}
                                                    options={minuteOptions.map(minute => {
                                                        return { value: minute }
                                                    })}
                                                    labelField={"value"}
                                                    values={[{ value: teamDetails.operatingHours.from.split(":")[1] }]}
                                                    placeholder="-"
                                                    multi={false}
                                                    backspaceDelete={false}
                                                    searchable={false}
                                                    onChange={(e) => handleChangeTimings(e, 'from:minute')}
                                                />
                                            </div>
                                        </td>

                                        <td>
                                            <div className="time-select-wrapper">
                                                {/* Hours */}
                                                <Select
                                                    className={`standard-select mini ${errors["operatingHours.to"]=== true ? 'error' : ''}`}
                                                    style={{ width: 60 }}
                                                    options={hourOptions.map(hour => {
                                                        return { value: hour }
                                                    })}
                                                    labelField={"value"}
                                                    values={[{ value: teamDetails.operatingHours.to.split(":")[0] }]}
                                                    placeholder="-"
                                                    multi={false}
                                                    backspaceDelete={false}
                                                    searchable={false}
                                                    onChange={(e) => handleChangeTimings(e, 'to:hour')}
                                                />
                                                :
                                                {/* Minutes */}
                                                <Select
                                                    className={`standard-select mini ${errors["operatingHours.to"] === true ? 'error' : ''}`}
                                                    style={{ width: 60 }}
                                                    options={minuteOptions.map(minute => {
                                                        return { value: minute }
                                                    })}
                                                    labelField={"value"}
                                                    values={[{ value: teamDetails.operatingHours.to.split(":")[1] }]}
                                                    placeholder="-"
                                                    multi={false}
                                                    backspaceDelete={false}
                                                    searchable={false}
                                                    onChange={(e) => handleChangeTimings(e, 'to:minute')}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {
                                errors["operatingHours.from"] || errors["operatingHours.to"] ? (
                                    <ErrorMessage
                                        message="Please ensure that opening hours are formatted correctly"
                                    /> 
                                ) : null
                            }

                            <h5 style={{ marginBottom: 5 }}>Actions</h5>

                            {
                                teamDetails.actions.length === 0 ? (
                                    <p>No actions found. <button className="underline-text-link" onClick={() => setShowAddNewAction(true)}>Add the first?</button></p>
                                ) : (
                                    <div style={{marginTop: 10}} className="options-scroll-container">
                                        {
                                            teamDetails.actions.map((action, i) => (
                                                    <div className="role-option">
                                                        <div className="flex-container">
                                                            {action.action}

                                                            <div
                                                                className="color-option mini read-only"
                                                                style={{backgroundColor: action.color}}
                                                            />
                                                        </div>
                                                        

                                                        <div className="flex-container">
                                                            <button
                                                                style={{fontSize: 14}}
                                                                className="edit-button"
                                                                onClick={() => {
                                                                    setShowEditAction(action)
                                                                }}
                                                            />

                                                            <button
                                                                className="remove-button"
                                                                onClick={() => {
                                                                    let newArray = [...teamDetails.actions]
                                                                    newArray.splice(i, 1);

                                                                    setTeamDetails({
                                                                        ...teamDetails,
                                                                        actions: newArray
                                                                    })
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            )
                                        }
                                        <button 
                                            className="underline-text-link" 
                                            style={{margin: 10}}
                                            onClick={() => setShowAddNewAction(true)}
                                        >Add new action</button>
                                    </div>
                                )
                            }

                            {
                                errors.actions ? (
                                    <ErrorMessage
                                        topSpacing="15px"
                                        message="Please add at least one action"
                                    /> 
                                ) : null
                            }
                        </div>

                        <div className="standard-modal-footer">
                            <button
                                className="standard-button green"
                                onClick={handleSubmit}
                            >Save team</button>
                        </div>
                    </div>
                </div>
            </div>

            {
                showUserLookup ? (
                    <UserLookup
                        closeModal={() => setShowUserLookup(false)}
                        handleSelectUser={handleSelectTeamManager}
                    />
                ) : null
            }

            {
                showAddNewAction ? (
                    <AddNewAction
                        closeModal={setShowAddNewAction}
                        saveAction={handleSaveNewAction}
                        roles={teamDetails.roles}
                        existingActions={teamDetails.actions}
                    />
                ) : null
            }

            {
                showEditAction.action !== "" ? (
                    <ViewEditAction
                        defaultState="edit"
                        action={showEditAction}
                        closeModal={handleResetEditAction}
                        roles={teamDetails.roles}
                        saveAction={handleSaveEditAction}
                        existingActions={teamDetails.actions.filter(a => a.action !== showEditAction.action)}
                        deleteAction={handleDeleteAction}
                    />
                ) : null
            }
        </React.Fragment>
    )
}

export default AddNewTeam