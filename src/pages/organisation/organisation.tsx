import axios from "axios";
import axiosRetry from "axios-retry";
import React, { useEffect, useState } from "react";
import Select from "react-dropdown-select";
import { RotatingLines } from "react-loader-spinner";
import { trackPromise, usePromiseTracker } from "react-promise-tracker";
import { useSelector } from "react-redux";
import DecisionWindow from "../../components/decisionWindow/decisionWindow";
import { RootState } from "../../store/store";
import { SuccessResponse } from "../../types.config";
import AddNewAction from "./actions/addNewAction";
import AddNewDepartment from "./actions/addNewDepartment";
import AddNewTeam from "./actions/addNewTeam";
import RenameDepartment from "./actions/renameDepartment";

import "./organisation-styles.scss";

axiosRetry(axios, {
    retries: 5,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

export interface Department {
    _id: string,
    name: string,
    team_count: number
}

export type Action = {
    action: string,
    color: string,
    restricted: boolean,
    restricted_to: string[]
}

export interface Team {
    _id: string,
    name: string,
    department?: {
        _id: string,
        name: string
    },
    manager?: {
        _id: string,
        name: string,
        email_address: string
    },
    operating_hours?: {
        from: string,
        to: string
    },
    actions?: Action[],
    organisation?: {
        name: string,
        _id: string
    },
    roles?: string[],
    updatedAt?: string
}

interface User {
    _id: string,
    first_name: string,
    last_name: string,
    email_address: string,
    role: string
}

const Organisation: React.FC = (): JSX.Element => {
    const userDetails = useSelector((state: RootState) => state.userAuthentication);

    const [showRenameDepartment, setShowRenameDepartment] = useState<Department | undefined>()
    const [showDeleteDepartment, setShowDeleteDepartment] = useState<string>("");
    const [showAddNewDepartment, setShowAddNewDepartment] = useState<boolean>(false);
    const [departmentOptions, setDepartmentOptions] = useState<Department[]>([]);
    const [department, setDepartment] = useState<Department>({
        _id: "",
        name: "",
        team_count: 0
    })

    const [showAddNewAction, setShowAddNewAction] = useState<boolean>(false);
    const [showAddNewTeam, setShowAddNewTeam] = useState<boolean>(false);
    const [teamOptions, setTeamOptions] = useState<Team[]>([])
    const [team, setTeam] = useState<Team>({
        _id: "",
        name: ""
    });
    

    const [showAddNewUser, setShowAddNewUser] = useState<boolean>(false);
    const [user, setUser] = useState<User>({
        _id: "",
        first_name: "",
        last_name: "",
        email_address: "",
        role: ""
    });
    const [userOptions, setUserOptions] = useState<User[]>([])

    const [errors, setErrors] = useState({
        getDepartments: false,
        deleteDepartment: false,
        renameDepartment: false,
        getTeams: false,
        getTeamById: false,
        getUsers: false
    })

    const [editErrors, setEditErrors] = useState({
        "operatingHours.from": false,
        "operatingHours.to": false
    })

    const [editMode, setEditMode] = useState<string>("");

    const [accordionSelected, setAccordionSelected] = useState<string>("")

    const getDepartmentOptions = async (): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "GET",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + "/organisation/departments",
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        setDepartmentOptions(response.data);
                        resolve()
                    } else {
                        setErrors({
                            ...errors,
                            getDepartments: true
                        })

                        resolve()
                    }
                })
                .catch(() => {
                    setErrors({
                        ...errors,
                        getDepartments: true
                    })

                    resolve()
                })
            })
        , 'get_departments')
    }

    useEffect(() => {
        if(departmentOptions.length === 0) {
            getDepartmentOptions();
        }
    }, [])

    const handleSelectDepartment = (dpt: Department): void => {
        if(dpt._id === department._id) {
            setDepartment({
                _id: "",
                name: "",
                team_count: 0
            })
        } else {
            setDepartment(dpt)
        }

        setTeamOptions([])
        setTeam({
            _id: "",
            name: ""
        })
    }

    const handleResetDeleteDepartment = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();

        setErrors({
            ...errors,
            deleteDepartment: false
        })

        setShowDeleteDepartment("")
    }

    const handleResetRenameDepartment = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();

        setErrors({
            ...errors,
            renameDepartment: false
        })

        setShowRenameDepartment(undefined)
    }

    const handleDeleteDepartment = async (e: React.FormEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();

        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "DELETE",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/organisation/departments/${showDeleteDepartment}`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        const deleteIndex = departmentOptions.findIndex(d => d._id === showDeleteDepartment);

                        let newArray = [...departmentOptions];
                        newArray.splice(deleteIndex, 1);

                        setDepartmentOptions(newArray);
                        setShowDeleteDepartment("");

                        resolve();
                    } else {
                        setErrors({
                            ...errors,
                            deleteDepartment: true
                        })

                        resolve()
                    }
                })
                .catch(() => {
                    setErrors({
                        ...errors,
                        deleteDepartment: true
                    })

                    resolve()
                })
            })
        , "delete_department")
    }

    const getTeamOptions = async (): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "GET",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + "/organisation/teams",
                    params: {
                        dptId: department._id
                    },
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        setTeamOptions(response.data);
                        resolve()
                    } else {
                        setErrors({
                            ...errors,
                            getTeams: true
                        })

                        resolve()
                    }
                })
                .catch(() => {
                    setErrors({
                        ...errors,
                        getTeams: true
                    })

                    resolve()
                })
            })
        , 'get_teams')
    }

    useEffect(() => {
        getTeamOptions()
    }, [department])

    const handleSelectTeam = (t: Team): void => {
        if(t._id === team._id) {
            setTeam({
                _id: "",
                name: ""
            })
        } else {
            setTeam({
                ...team,
                ...t
            })
        }
    }

    const getTeamUsers = async (): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "GET",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + "/organisation/users",
                    params: {
                        teamId: team._id
                    },
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        // Add pagination for more scaleability
                        setUserOptions(response.data)

                        resolve()
                    } else {
                        setErrors({
                            ...errors,
                            getUsers: true
                        })

                        resolve()
                    }
                })
                .catch(() => {
                    setErrors({
                        ...errors,
                        getUsers: true
                    })

                    resolve()
                })
            })
        , 'get_users')
    }

    const getTeamById = async (): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "GET",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/organisation/teams/${team._id}`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        setTeam({
                            ...team,
                            ...response.data
                        })

                        resolve()
                    } else {
                        setErrors({
                            ...errors,
                            getTeamById: true
                        })

                        resolve()
                    }
                })
                .catch(() => {
                    setErrors({
                        ...errors,
                        getTeamById: true
                    })

                    resolve()
                })
            })
        , 'get_team_by_id')
    }

    useEffect(() => {
        if(team._id !== "") {
            getTeamById();
            getTeamUsers();
        }
    }, [team._id])

    const handleSelectAccordion = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { checked, name } = e.target;
        
        setAccordionSelected(checked ? name : "")
    }

    const handleChangeEditValues = (e: React.ChangeEvent<HTMLInputElement>): void => {

    }

    const handleSaveNewAction = async (newAction: Action): Promise<void> => {

    }

    const getDepartmentsPromise = usePromiseTracker({ area: "get_departments" }).promiseInProgress;
    const getTeamsPromise = usePromiseTracker({ area: "get_teams" }).promiseInProgress;
    const getTeamByIdPromise = usePromiseTracker({ area: "get_team_by_id" }).promiseInProgress;
    const getUsersPromise = usePromiseTracker({ area: "get_users" }).promiseInProgress;

    return (
        <React.Fragment>
            <div className="organisation-sections-container">
                <div className="organisation-section">
                    <div className="organisation-section-header">
                        <h4>Departments</h4>

                        <button
                            className="add-button light-gray"
                            onClick={() => setShowAddNewDepartment(true)}
                        />
                    </div>
                    <div className="organisation-section-body">
                        {
                            getDepartmentsPromise ? (
                                <div style={{
                                    display: "flex",
                                    columnGap: 10,
                                    alignItems: "center"
                                }}>
                                    <RotatingLines
                                        strokeColor="grey"
                                        strokeWidth="5"
                                        animationDuration="0.75"
                                        width="30"
                                        visible={true}
                                    />
                                    <p>Loading...</p>
                                </div>
                            ) : (
                                <React.Fragment>
                                    {
                                        departmentOptions.length === 0 ? (
                                            <p>No departments found. <button className="underline-text-link" onClick={() => setShowAddNewDepartment(true)}>Add the first?</button></p>
                                        ) : (
                                            <React.Fragment>
                                                {
                                                    departmentOptions.map(dpt => (
                                                        <div className={`department-item ${dpt._id === department._id ? 'selected' : ''}`} onClick={() => handleSelectDepartment(dpt)}>
                                                            {dpt.name}
                                                            <Select
                                                                className="more-options-button"
                                                                options={[
                                                                    { value: "Rename" },
                                                                    { value: "Delete", disabled: dpt.team_count > 0 }
                                                                ]}
                                                                contentRenderer={() => {
                                                                    return (
                                                                        <button
                                                                            className="more-options-button-icon"
                                                                        />
                                                                    )
                                                                }}
                                                                labelField="value"
                                                                values={[]}
                                                                onChange={(e) => {
                                                                    const value = e[0].value;

                                                                    switch (value) {
                                                                        case "Rename":
                                                                            setShowRenameDepartment(dpt)
                                                                            return;

                                                                        case "Delete":
                                                                            setShowDeleteDepartment(dpt._id)
                                                                            return;
                                                                    }
                                                                }}
                                                                backspaceDelete={false}
                                                                searchable={false}
                                                            />
                                                        </div>
                                                    ))
                                                }
                                            </React.Fragment>
                                        )
                                        
                                    }
                                </React.Fragment>
                            )
                        }
                    </div>
                </div>

                {
                    department._id !== "" ? (
                        <div className="organisation-section">
                            <div className="organisation-section-header">
                                <h4>Teams</h4>

                                <button
                                    className="add-button light-gray"
                                    onClick={() => setShowAddNewTeam(true)}
                                />
                            </div>
                            <div className="organisation-section-body">
                                {
                                    getTeamsPromise ? (
                                        <div style={{
                                            display: "flex",
                                            columnGap: 10,
                                            alignItems: "center"
                                        }}>
                                            <RotatingLines
                                                strokeColor="grey"
                                                strokeWidth="5"
                                                animationDuration="0.75"
                                                width="30"
                                                visible={true}
                                            />
                                            <p>Loading...</p>
                                        </div>
                                    ) : (
                                        <React.Fragment>
                                            {
                                                teamOptions.length === 0 ? (
                                                    <p>No teams found. <button className="underline-text-link" onClick={() => setShowAddNewTeam(true)}>Add the first?</button></p>
                                                ) : (
                                                    <React.Fragment>
                                                        {
                                                            teamOptions.map(t => (
                                                                <div 
                                                                    className={`department-item ${t._id === team._id ? 'selected' : ''}`}
                                                                    onClick={() => handleSelectTeam(t)}
                                                                >
                                                                    {t.name}
                                                                </div>
                                                            ))
                                                        }
                                                    </React.Fragment>
                                                )
                                            }
                                        </React.Fragment>
                                    )
                                }
                            </div>
                        </div>
                    ) : null
                }

                {
                    team._id !== "" ? (
                        <div className="team-display-section">
                            <div className="organisation-section-header">
                                <h4>{team.name}</h4>
                            </div>
                            <div className={`team-display-body ${getTeamByIdPromise ? 'loading' : ''}`}>
                                {
                                    getTeamByIdPromise ? (
                                        <div style={{
                                            display: "flex",
                                            columnGap: 10,
                                            alignItems: "center"
                                        }}>
                                            <RotatingLines
                                                strokeColor="grey"
                                                strokeWidth="5"
                                                animationDuration="0.75"
                                                width="30"
                                                visible={true}
                                            />
                                            <p>Loading...</p>
                                        </div>
                                    ) : (
                                        <React.Fragment>
                                            <div className="split-column" id="team-split-column">
                                                <span>
                                                    <h4>Operating hours</h4>

                                                    {
                                                        editMode === "operating_hours" ? (
                                                            <React.Fragment>
                                                                
                                                            </React.Fragment>
                                                        ) : (
                                                            <div style={{
                                                                display: 'flex',
                                                                columnGap: 15,
                                                                alignItems: 'center'
                                                            }}>
                                                                <p style={{marginTop: 10}}>{team.operating_hours?.from} - {team.operating_hours?.to}</p>

                                                                <button
                                                                    className="edit-button"
                                                                />
                                                            </div>
                                                        )
                                                    }
                                                </span>

                                                <span>
                                                    <h4>Team manager</h4>
                                                    {
                                                        editMode === "operating_hours" ? (
                                                            <React.Fragment>
                                                                
                                                            </React.Fragment>
                                                        ) : (
                                                            <div style={{
                                                                display: 'flex',
                                                                columnGap: 15,
                                                                alignItems: 'center'
                                                            }}>
                                                                <p style={{marginTop: 10}}>{team.manager?.name}</p>

                                                                <button
                                                                    className="edit-button"
                                                                />
                                                            </div>
                                                        )
                                                    }
                                                </span>
                                            </div>

                                            <br/>

                                            <input 
                                                className="standard-accordion-trigger invisible"
                                                type="checkbox"
                                                id="actions"
                                                name="actions"
                                                checked={accordionSelected === "actions"}
                                                onChange={handleSelectAccordion}
                                            />
                                            <label htmlFor="actions" className="standard-accordion-header">Actions</label>
                                            <div className="standard-accordion-body">
                                                {
                                                    team.actions?.length === 0 ? (
                                                        <p>No actions found. <button className="underline-text-link" onClick={() => setShowAddNewAction(true)}>Add the first?</button></p>
                                                    ) : (
                                                        <React.Fragment>
                                                            <table className="standard-table">
                                                                <tbody>
                                                                    <tr>
                                                                        <th>Action</th>
                                                                        <th>Color</th>
                                                                        <th>Restricted</th>
                                                                        <th></th>
                                                                    </tr>
                                                                    {
                                                                        team.actions?.map(action => {
                                                                            return (
                                                                                <tr>
                                                                                    <td>{action.action}</td>
                                                                                    <td>
                                                                                        <div 
                                                                                            className="action-color-circle"
                                                                                            style={{ backgroundColor: action.color }}
                                                                                        />
                                                                                    </td>
                                                                                    <td>{action.restricted ? "Yes" : "No"}</td>
                                                                                    <td>
                                                                                        <button
                                                                                            style={{fontSize: 20, padding: 0, border: "none"}}
                                                                                            className="underline-text-link"
                                                                                        ><i className="fa-solid fa-expand"/></button>
                                                                                    </td>
                                                                                </tr>
                                                                            )
                                                                        })
                                                                    }
                                                                </tbody>
                                                            </table>

                                                            <center>
                                                                <br/>

                                                                <button
                                                                    className="hover-box-button"
                                                                    onClick={() => setShowAddNewAction(true)}
                                                                >Add new action <i className="fa-solid fa-plus"/></button>
                                                            </center>
                                                        </React.Fragment>
                                                    )
                                                }
                                            </div>

                                            <br/>

                                            <input 
                                                className="standard-accordion-trigger invisible"
                                                type="checkbox"
                                                id="users"
                                                name="users"
                                                checked={accordionSelected === "users"}
                                                onChange={handleSelectAccordion}
                                            />
                                            <label htmlFor="users" className="standard-accordion-header">Team members</label>
                                            <div className="standard-accordion-body">
                                                {
                                                    userOptions.length === 0 ? (
                                                        <p>No members found. <button className="underline-text-link" onClick={() => setShowAddNewUser(true)}>Add the first?</button></p>
                                                    ) : (
                                                        <React.Fragment>
                                                            <table className="standard-table">
                                                                <tbody>
                                                                    <tr>
                                                                        <th>Name</th>
                                                                        <th>Email</th>
                                                                        <th>Role</th>
                                                                        <th></th>
                                                                    </tr>
                                                                    {
                                                                        userOptions.map(u => {
                                                                            return (
                                                                                <tr>
                                                                                    <td>{u.first_name} {u.last_name}</td>
                                                                                    <td>{u.email_address}</td>
                                                                                    <td>{u.role}</td>
                                                                                    <td>
                                                                                        <button
                                                                                            style={{fontSize: 20, padding: 0, border: "none"}}
                                                                                            className="underline-text-link"
                                                                                        ><i className="fa-solid fa-expand"/></button>
                                                                                    </td>
                                                                                </tr>
                                                                            )
                                                                        })
                                                                    }
                                                                </tbody>
                                                            </table>

                                                            <center>
                                                                <br/>

                                                                <button
                                                                    className="hover-box-button"
                                                                    onClick={() => setShowAddNewUser(true)}
                                                                >Add new user <i className="fa-solid fa-plus"/></button>
                                                            </center>
                                                        </React.Fragment>
                                                    )
                                                }
                                            </div>
                                        </React.Fragment>
                                    )
                                }
                            </div>
                        </div>
                    ) : null
                }
                
            </div>

            {
                showAddNewDepartment ? (
                    <AddNewDepartment
                        closeModal={setShowAddNewDepartment}
                        departmentOptions={departmentOptions}
                        setDepartmentOptions={setDepartmentOptions}
                    />
                ) : null
            }

            {
                showDeleteDepartment !== "" ? (
                    <DecisionWindow
                        closeModal={handleResetDeleteDepartment}
                        title="Delete department?"
                        acceptFunction={handleDeleteDepartment}
                        errorMessage={errors.deleteDepartment ? "There was an error deleting this department" : undefined}
                        searchArea="delete_department"
                    />
                ) : null
            }

            {
                showRenameDepartment ? (
                    <RenameDepartment
                        closeModal={handleResetRenameDepartment}
                        department={showRenameDepartment}
                        departmentOptions={departmentOptions}
                        setDepartmentOptions={setDepartmentOptions}
                    />
                ) : null
            }

            {
                showAddNewTeam ? (
                    <AddNewTeam
                        closeModal={setShowAddNewTeam}
                        teamOptions={teamOptions}
                        setTeamOptions={setTeamOptions}
                        department={department}
                    />
                ) : null
            }

            {
                showAddNewAction ? (
                    <AddNewAction
                        closeModal={setShowAddNewAction}
                        saveAction={handleSaveNewAction}
                        roles={team.roles || []}
                        existingActions={team.actions || []}
                    />
                ) : null
            }



        </React.Fragment>
    )
}

export default Organisation