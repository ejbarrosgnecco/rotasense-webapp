import axios from "axios"
import axiosRetry from "axios-retry"
import React, { useEffect, useState } from "react"
import Select from "react-dropdown-select"
import { decodeToken } from "react-jwt"
import { trackPromise, usePromiseTracker } from "react-promise-tracker"
import { useDispatch, useSelector } from "react-redux"
import ErrorMessage from "../../../components/error/error"
import Tooltip from "../../../components/tooltip/tooltip"
import { setNewAccount } from "../../../store/features/account/newAccount"
import { setUserAuthentication, UserRecord } from "../../../store/features/system/userAuthentication"
import { RootState } from "../../../store/store"
import getAllKeys from "../../../store/utils/getAllKeys"
import { SuccessResponse } from "../../../types.config"
import AddNewAction from "../../organisation/actions/addNewAction"
import ViewEditAction from "../../organisation/actions/viewEditAction"
import { Action } from "../../organisation/organisation"

import "../../organisation/organisation-styles.scss";

axiosRetry(axios, {
    retries: 5,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

const PageThree: React.FC = (): JSX.Element => {
    const newAccountData = useSelector((state: RootState) => state.newAccount);

    const dispatch = useDispatch();

    const [newRoleName, setNewRoleName] = useState<string>("");

    const [showAddNewAction, setShowAddNewAction] = useState<boolean>(false);
    const [showEditAction, setShowEditAction] = useState<Action>({
        action: "",
        color: "",
        restricted: false,
        restrictedTo: []
    })

    const [hourOptions, setHourOptions] = useState<string[]>(["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"])
    const [minuteOptions, setMinuteOptions] = useState<string[]>(["00", "15", "30", "45"])

    const [createError, setCreateError] = useState<string>("");
    const [departmentError, setDepartmentError] = useState<boolean>(false);
    const [teamErrors, setTeamErrors] = useState({
        name: false,
        "operatingHours.from": false,
        "operatingHours.to": false,
        actions: false,
        roles: false
    })

    const handleFillInForm = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;

        dispatch(setNewAccount({
            completePages: {
                3: false
            },
            team: {
                [name]: value
            }
        }))

        setTeamErrors({
            ...teamErrors,
            [name]: false
        })
    }

    const handleChangeTimings = (e: { value: string }[], key: string): void => {
        const keyName = key.split(":")[0];
        const keyPart = key.split(":")[1];

        const value = e[0].value;

        const parts = ["hour", "minute"];

        let newValue = (newAccountData.team.operatingHours as any)[keyName].split(":");
        newValue[parts.indexOf(keyPart)] = value;
        newValue = newValue.join(":");

        dispatch(setNewAccount({
            team: {
                operatingHours: {
                    [keyName]: newValue
                }
            }
        }))

        setTeamErrors({
            ...teamErrors,
            [`operatingHours.${keyName}`]: false
        })
    }

    const handleSaveNewAction = (newAction: Action): void => {
        dispatch(setNewAccount({
            team: {
                actions: [
                    ...newAccountData.team.actions,
                    newAction
                ]
            }
        }))

        setTeamErrors({
            ...teamErrors,
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
        const index = newAccountData.team.actions.indexOf(prevValue)

        let newArray = [...newAccountData.team.actions]
        newArray[index] = newValue;

        dispatch(setNewAccount({
            team: {
                actions: newArray
            }
        }))
        
        setShowEditAction({
            action: "",
            color: "",
            restricted: false,
            restrictedTo: []
        })
    }

    const handleDeleteAction = (action: Action): void => {
        const index = newAccountData.team.actions.indexOf(action);

        let newArray = [...newAccountData.team.actions];
        newArray.splice(index, 1);

        dispatch(setNewAccount({
            team: {
                actions: newArray
            }
        }))

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

        const teamData = newAccountData.team;

        // Department errors
        if(newAccountData.department.length < 2) {
            errorsCount++;
            setDepartmentError(true);
        }

        // Team errors
        if(teamData.name.length < 2) {
            errorsCount++;
            errorsObject.name = true;
        }

        if(teamData.roles.length === 0) {
            errorsCount++;
            errorsObject.roles = true;
        } else {
            const invalidRoles: boolean = teamData.roles.some(r => !(typeof r === "string" && r.length > 2));
            
            if(invalidRoles) {
                errorsCount++;
                errorsObject.roles = true;
            }
        }

        // -- Check that all times & actions are valid
        if(/^([0-9]{2})+:+([0-9]{2})$/.test(teamData.operatingHours.from) === false) {
            errorsCount++;
            errorsObject["operatingHours.from"] = true;
        }

        if(/^([0-9]{2})+:+([0-9]{2})$/.test(teamData.operatingHours.to) === false) {
            errorsCount++;
            errorsObject["operatingHours.to"] = true;
        }

        if(teamData.actions.length === 0) {
            errorsCount++;
            errorsObject.actions = true;
        }

        if(errorsCount === 0) {
            return true
        } else {
            setTeamErrors({
                ...teamErrors,
                ...errorsObject
            })

            return false
        }
    }

    const submitNewAccount = async (e: React.FormEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();

        if(handleDataValidation() === true) {
            let { activePage, completePages, _persist, ...setupData }: any = newAccountData;
            const { emailAddressVerified, ...userData } = setupData.user;
            setupData.user = userData;

            trackPromise(
                new Promise<void>( async (resolve) => {
                    await axios({
                        method: "POST",
                        url: process.env.REACT_APP_BACKEND_BASE_URL + `/account/setup`,
                        data: setupData
                    })
                    .then((value: { data: SuccessResponse }) => {
                        const response = value.data;

                        if(response.success === true) {
                            const decodedToken: UserRecord | null = decodeToken(response.data.accessToken);                            
                            
                            dispatch(setUserAuthentication({
                                userId: decodedToken?.userId || "",
                                emailAddress: decodedToken?.emailAddress || "",
                                firstName: decodedToken?.firstName || "",
                                lastName: decodedToken?.lastName || "",
                                organisation: {
                                    _id: decodedToken?.organisation._id || "",
                                    name: decodedToken?.organisation.name || ""
                                },
                                team: {
                                    _id: decodedToken?.team._id || "",
                                    name: decodedToken?.team.name || ""
                                },
                                profile: decodedToken?.profile || "",
                                role: decodedToken?.role || "",
                                accessToken: response.data.accessToken
                            }));

                            setTimeout(() => {
                                window.location.href = "/schedules"
                                resolve();
                            }, 500)
                        } else {
                            setCreateError(response.reason || "");
                            resolve();
                        }
                    })
                    .catch(() => {
                        setCreateError("Oops, there was a technical error, please try again");
                        resolve();
                    })
                })
            , "createAccount")
        }
    }

    const submitPromise = usePromiseTracker({ area: "createAccount" }).promiseInProgress;

    return (
        <React.Fragment>
            <h2>Create your first team</h2>
            <p className="title-description">Inside Rotasense, team members are split into teams. You can also assign managers to organise those teams' schedules. Teams are also categorised into departments to further organise your organisation.</p>

            <br/>
            <br/>

            <label className={`expanded-input-wrapper orange ${departmentError ? 'error attached' : ''}`} htmlFor="department">
                <div className="expanded-input-content">
                    <input
                        id="department"
                        className="expanded-input"
                        placeholder="e.g. Human Resources"
                        autoComplete="off"
                        name="department"
                        value={newAccountData.department}
                        onChange={(e) => {
                            dispatch(setNewAccount({
                                completePages: {
                                    3: false
                                },
                                department: e.target.value
                            }))
                    
                            setDepartmentError(false)
                        }}
                        disabled={submitPromise}
                    />

                    <label className="expanded-input-label" htmlFor="department">Department name* <Tooltip message="The name of the department that this team will be a part of" /></label>
                </div>
            </label>

            {
                departmentError ? (
                    <ErrorMessage
                        message="Please enter the name of the department this team belongs to"
                        attached={true}
                        bottomSpacing="20px"
                    />
                ) : null
            }

            <label className={`expanded-input-wrapper orange ${teamErrors.name ? 'error attached' : ''}`} htmlFor="name">
                <div className="expanded-input-content">
                    <input
                        id="name"
                        className="expanded-input"
                        placeholder="e.g. Talent Acquisition"
                        autoComplete="off"
                        name="name"
                        value={newAccountData.team.name}
                        onChange={handleFillInForm}
                        disabled={submitPromise}
                    />

                    <label className="expanded-input-label" htmlFor="name">Team name* <Tooltip message="The name of the team you'd like to add. By default you will be added to this team. You can change at a later time." /></label>
                </div>
            </label>

            {
                teamErrors.name ? (
                    <ErrorMessage
                        message="Please enter the name of the team"
                        attached={true}
                        bottomSpacing="20px"
                    />
                ) : null
            }

            <h5 style={{ marginBottom: 0, color: "#FFF" }}>Roles <Tooltip message="The roles that are available to assign to members of this team. e.g. Junior recruiter"/></h5>

            <div style={{marginTop: 10}} className={`options-scroll-container orange ${teamErrors.roles ? 'error attached' : ''}`}>
                {
                    newAccountData.team.roles.map((role, i) => {
                        return (
                            <div className="role-option">
                                {role}

                                <button
                                    className="remove-button"
                                    onClick={() => {
                                        const newArray = [...newAccountData.team.roles];
                                        newArray.splice(i, 1);

                                        dispatch(setNewAccount({
                                            team: {
                                                roles: newArray
                                            }
                                        }))
                                    }}
                                />
                            </div>
                        )
                    })
                }

                <div className="add-new-role-container">
                    <input
                        type="text"
                        className={`add-new-role-input ${newAccountData.team.roles.includes(newRoleName) ? 'error' : ''}`}
                        placeholder="Add new role..."
                        value={newRoleName}
                        onChange={e => {
                            setNewRoleName(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))
                        }}
                        onKeyDown={e => {
                            if(e.key === "Enter") {
                                if(newRoleName.length > 1 && !newAccountData.team.roles.includes(newRoleName)) {
                                    dispatch(setNewAccount({
                                        team: {
                                            roles: [...newAccountData.team.roles, newRoleName]
                                        }
                                    }))

                                    setNewRoleName("")

                                    setTeamErrors({
                                        ...teamErrors,
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
                                        dispatch(setNewAccount({
                                            team: {
                                                roles: [...newAccountData.team.roles, newRoleName]
                                            }
                                        }))

                                        setNewRoleName("")

                                        setTeamErrors({
                                            ...teamErrors,
                                            roles: false
                                        })
                                    }}
                                    disabled={newAccountData.team.roles.includes(newRoleName)}
                                />

                                <button
                                    className="add-new-role-button cancel"
                                    onClick={() => {
                                        setNewRoleName("")
                                    }}
                                    disabled={newAccountData.team.roles.includes(newRoleName)}
                                />
                            </React.Fragment>
                        ) : null
                    }
                </div>
            </div>

            {
                teamErrors.roles ? (
                    <ErrorMessage
                        message="Please add at least one role"
                        attached={true}
                        bottomSpacing="20px"
                    />
                ) : null
            }

            <h5 style={{ marginBottom: 0, color: "#FFF" }}>Operating hours</h5>

            <table className="structural-table" style={{borderSpacing: 10}}>
                <tbody>
                    <tr>
                        <td style={{textAlign: 'center', width: '50%', color: "#FFF"}}>From</td>
                        <td style={{textAlign: 'center', width: '50%', color: "#FFF"}}>To</td>
                    </tr>
                    <tr>
                        <td>
                            <div className="time-select-wrapper">
                                {/* Hours */}
                                <Select
                                    className={`standard-select mini ${teamErrors["operatingHours.from"] === true ? 'error' : ''}`}
                                    style={{ width: 60 }}
                                    options={hourOptions.map(hour => {
                                        return { value: hour }
                                    })}
                                    labelField={"value"}
                                    values={[{ value: newAccountData.team.operatingHours.from.split(":")[0] }]}
                                    placeholder="-"
                                    multi={false}
                                    backspaceDelete={false}
                                    searchable={false}
                                    onChange={(e) => handleChangeTimings(e, 'from:hour')}
                                />
                                :
                                {/* Minutes */}
                                <Select
                                    className={`standard-select mini ${teamErrors["operatingHours.from"] === true ? 'error' : ''}`}
                                    style={{ width: 60 }}
                                    options={minuteOptions.map(minute => {
                                        return { value: minute }
                                    })}
                                    labelField={"value"}
                                    values={[{ value: newAccountData.team.operatingHours.from.split(":")[1] }]}
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
                                    className={`standard-select mini ${teamErrors["operatingHours.to"]=== true ? 'error' : ''}`}
                                    style={{ width: 60 }}
                                    options={hourOptions.map(hour => {
                                        return { value: hour }
                                    })}
                                    labelField={"value"}
                                    values={[{ value: newAccountData.team.operatingHours.to.split(":")[0] }]}
                                    placeholder="-"
                                    multi={false}
                                    backspaceDelete={false}
                                    searchable={false}
                                    onChange={(e) => handleChangeTimings(e, 'to:hour')}
                                />
                                :
                                {/* Minutes */}
                                <Select
                                    className={`standard-select mini ${teamErrors["operatingHours.to"] === true ? 'error' : ''}`}
                                    style={{ width: 60 }}
                                    options={minuteOptions.map(minute => {
                                        return { value: minute }
                                    })}
                                    labelField={"value"}
                                    values={[{ value: newAccountData.team.operatingHours.to.split(":")[1] }]}
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
                teamErrors["operatingHours.from"] || teamErrors["operatingHours.to"] ? (
                    <ErrorMessage
                        message="Please enter valid operating hours"
                        style={{
                            backgroundColor: "#F00",
                            color: "#FFF",
                            padding: 10,
                            borderRadius: 5
                        }}
                        bottomSpacing="20px"
                    />
                ) : null
            }

            <h5 style={{ marginBottom: 5, color: "#FFF" }}>Actions</h5>

            {
                newAccountData.team.actions.length === 0 ? (
                    <p style={{textAlign: "left"}}>No actions. <button className="underline-text-link" onClick={() => setShowAddNewAction(true)}>Add the first?</button></p>
                ) : (
                    <div style={{marginTop: 10}} className="options-scroll-container">
                        {
                            newAccountData.team.actions.map((action, i) => (
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
                                                    let newArray = [...newAccountData.team.actions]
                                                    newArray.splice(i, 1);

                                                    dispatch(setNewAccount({
                                                        team: {
                                                            actions: newArray
                                                        }
                                                    }))
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            )
                        }
                        <button 
                            className="plain-text-link" 
                            style={{margin: 10, color: "#ccc", paddingTop: 2}}
                            onClick={() => setShowAddNewAction(true)}
                        >Add new action</button>
                    </div>
                )
            }

            {
                teamErrors.actions ? (
                    <ErrorMessage
                        message="Please add at least one action"
                        style={{
                            backgroundColor: "#F00",
                            color: "#FFF",
                            padding: 10,
                            borderRadius: 5
                        }}
                        topSpacing="20px"
                        bottomSpacing="20px"
                    />
                ) : null
            }

            {
                createError ? (
                    <ErrorMessage
                        message={createError}
                        style={{
                            backgroundColor: "#F00",
                            color: "#FFF",
                            padding: 10,
                            borderRadius: 5
                        }}
                        topSpacing="20px"
                        bottomSpacing="20px"
                    />
                ) : null
            }

            <br/>
            <br/>

            <div className="form-navigation-button-container">
                <button
                    className="go-back-button"
                    onClick={() => {
                        dispatch(setNewAccount({
                            activePage: 2
                        }))
                    }}
                />
                <button 
                    className="standard-button green"
                    disabled={submitPromise}
                    onClick={submitNewAccount}
                >Continue</button>
            </div>

            {
                showAddNewAction ? (
                    <AddNewAction
                        closeModal={setShowAddNewAction}
                        saveAction={handleSaveNewAction}
                        roles={newAccountData.team.roles}
                        existingActions={newAccountData.team.actions}
                    />
                ) : null
            }

            {
                showEditAction.action ? (
                    <ViewEditAction
                        closeModal={handleResetEditAction}
                        defaultState="edit"
                        roles={newAccountData.team.roles}
                        existingActions={newAccountData.team.actions}
                        action={showEditAction}
                        deleteAction={handleDeleteAction}
                        saveAction={handleSaveEditAction}
                    />
                ) : null
            }
        </React.Fragment>
    )
}

export default PageThree