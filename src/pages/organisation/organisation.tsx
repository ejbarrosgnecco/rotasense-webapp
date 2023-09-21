import axios from "axios";
import axiosRetry from "axios-retry";
import React, { useEffect, useState } from "react";
import Select from "react-dropdown-select";
import { RotatingLines } from "react-loader-spinner";
import { trackPromise, usePromiseTracker } from "react-promise-tracker";
import { useSelector } from "react-redux";
import DecisionWindow from "../../components/decisionWindow/decisionWindow";
import  { Tooltip } from "react-tooltip";
import { RootState } from "../../store/store";
import { SuccessResponse } from "../../types.config";
import AddNewAction from "./actions/addNewAction";
import AddNewDepartment from "./actions/addNewDepartment";
import AddNewRole from "./actions/addNewRole";
import AddNewTeam from "./actions/addNewTeam";
import AddNewUser from "./actions/addNewUser";
import EditOperatingHours from "./actions/editOperatingHours";
import EditRole from "./actions/editRole";
import EditTeamName from "./actions/editTeamName";
import RenameDepartment from "./actions/renameDepartment";
import UserLookup, { UserAbbrev } from "./actions/userLookup";
import ViewEditAction from "./actions/viewEditAction";
import ViewUser from "./actions/viewUser";

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
    teamCount: number
}

export type Action = {
    action: string,
    color: string,
    restricted: boolean,
    restrictedTo: string[]
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
        emailAddress: string
    },
    operatingHours?: {
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

export interface User {
    _id: string,
    firstName: string,
    lastName: string,
    emailAddress: string,
    profile: string,
    role: string,
    status: string,
    team?: {
        _id: string,
        name: string
    },
    department?: {
        _id: string,
        name: string
    }
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
        teamCount: 0
    })

    const [showDecisionDeleteTeam, setShowDecisionDeleteTeam] = useState<string>("");
    const [showAddNewTeam, setShowAddNewTeam] = useState<boolean>(false);
    const [teamOptions, setTeamOptions] = useState<Team[]>([])
    const [team, setTeam] = useState<Team>({
        _id: "",
        name: ""
    });

    const [showEditRole, setShowEditRole] = useState<string>("")
    const [showAddNewRole, setShowAddNewRole] = useState<boolean>(false);
    const [showDecisionDeleteRole, setShowDecisionDeleteRole] = useState<string>("")

    const [showAddNewAction, setShowAddNewAction] = useState<boolean>(false);
    const [showViewAction, setShowViewAction] = useState<Action>({
        action: "",
        color: "",
        restricted: false,
        restrictedTo: []
    })

    const [activeUserCount, setActiveUserCount] = useState<number>(0)
    const [userStatusFilter, setUserStatusFilter] = useState<string>("active")
    const [showViewUser, setShowViewUser] = useState<User | undefined>();
    const [showAddNewUser, setShowAddNewUser] = useState<boolean>(false);
    const [user, setUser] = useState<User>({
        _id: "",
        firstName: "",
        lastName: "",
        emailAddress: "",
        profile: "",
        status: "",
        role: ""
    });
    const [userOptions, setUserOptions] = useState<User[]>([])

    const [errors, setErrors] = useState({
        getDepartments: false,
        deleteDepartment: false,
        renameDepartment: false,
        getTeams: false,
        getTeamById: false,
        deleteTeam: false,
        addAction: false,
        editAction: false,
        deleteAction: false,
        editRole: false,
        deleteRole: false,
        addRole: false,
        editTeam: false,
        getUsers: false
    })

    const [editErrors, setEditErrors] = useState({
        "operatingHours.from": false,
        "operatingHours.to": false
    })

    const [editMode, setEditMode] = useState<string>("");

    const [accordionSelected, setAccordionSelected] = useState<string>("")

    useEffect(() => {
        setErrors({
            ...errors,
            editTeam: false,
            editAction: false
        })
    }, [editMode, showViewAction])

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
        , 'getDepartments')
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
                teamCount: 0
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
        , "deleteDepartment")
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
        , 'getTeams')
    }

    useEffect(() => {
        if(department._id !== "") {
            getTeamOptions()
        }
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
                        status: userStatusFilter,
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
                        setUserOptions([])
                        setErrors({
                            ...errors,
                            getUsers: true
                        })

                        resolve()
                    }
                })
                .catch(() => {
                    setUserOptions([])
                    setErrors({
                        ...errors,
                        getUsers: true
                    })

                    resolve()
                })
            })
        , 'getUsers')
    }

    const handleEditUser = async (editValues: User): Promise<void> => {

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
        , 'getTeamById')
    }

    useEffect(() => {
        if(team._id !== "") {
            getTeamUsers();
        }
    }, [userStatusFilter])

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

    const handleEditTeam = (editValues: { [key: string]: any }): void => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "PUT",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/organisation/teams/${team._id}`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    },
                    data: editValues
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        setTeam({
                            ...team,
                            ...editValues
                        })

                        const index = teamOptions.findIndex(t => t._id === team._id);
                        let newArray = [...teamOptions];
                        newArray[index] = {
                            ...team,
                            ...editValues
                        }

                        setTeamOptions(newArray);
                        setEditMode("")

                        resolve()
                    } else {
                        setErrors({
                            ...errors,
                            editTeam: true
                        })

                        resolve()
                    }
                })
                .catch(() => {
                    setErrors({
                        ...errors,
                        editTeam: true
                    })

                    resolve()
                })
            })
        , 'editTeam')
    }

    const handleEditAction = async (action: Action): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "PUT",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/organisation/teams/${team._id}/actions`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    },
                    data: {
                        currentAction: showViewAction.action,
                        newValues: action
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        const index = (team.actions as any).findIndex((a: Action) => a.action === showViewAction.action);
                        let newArray = [...team.actions || []];
                        newArray[index] = action;
                        
                        setTeam({
                            ...team,
                            actions: newArray
                        })

                        setShowViewAction({
                            action: "",
                            color: "",
                            restricted: false,
                            restrictedTo: []
                        })

                        resolve();
                    } else {
                        // Add toast error
                        setErrors({
                            ...errors,
                            editAction: true
                        })

                        resolve()
                    }
                })
                .catch(() => {
                    // Add toast error
                    setErrors({
                        ...errors,
                        editAction: true
                    })

                    resolve()
                })
            })
        , 'editAction')
    }

    const handleDeleteAction = async (action: Action): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "DELETE",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/organisation/teams/${team._id}/actions`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    },
                    data: {
                        action: action.action
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        const index = team.actions?.findIndex(a => a.action === action.action) || -1;
                        let newArray = [...team.actions || []];
                        newArray.splice(index, 1);
                        
                        setTeam({
                            ...team,
                            actions: newArray
                        })

                        setShowViewAction({
                            action: "",
                            color: "",
                            restricted: false,
                            restrictedTo: []
                        })

                        resolve();
                    } else {
                        // Add toast error
                        setErrors({
                            ...errors,
                            deleteAction: true
                        })

                        resolve()
                    }
                })
                .catch(() => {
                    // Add toast error
                    setErrors({
                        ...errors,
                        deleteAction: true
                    })

                    resolve()
                })
            })
        , 'deleteAction')
    }

    const handleSaveNewAction = async (newAction: Action): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "POST",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/organisation/teams/${team._id}/actions`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    },
                    data: newAction
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        setTeam({
                            ...team,
                            actions: [
                                ...(team.actions as Action[]),
                                newAction
                            ]
                        })

                        setShowAddNewAction(false)

                        resolve();
                    } else {
                        setErrors({
                            ...errors,
                            addAction: true
                        })

                        resolve()
                    }
                })
                .catch(() => {
                    setErrors({
                        ...errors,
                        addAction: true
                    })

                    resolve()
                })
            })
        , 'addAction')
    }

    const handleDeleteTeam = async (e: React.FormEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();

        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "DELETE",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/organisation/teams/${showDecisionDeleteTeam}`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        const removeIndex = teamOptions.findIndex(o => o._id === showDecisionDeleteTeam)
                        let newArray = [...teamOptions];
                        newArray.splice(removeIndex, 1);

                        setTeamOptions(newArray);
                        setTeam({
                            _id: "",
                            name: ""
                        })

                        resolve();
                    } else {
                        setErrors({
                            ...errors,
                            deleteTeam: true
                        })

                        resolve();
                    }
                })
                .catch(() => {
                    setErrors({
                        ...errors,
                        deleteTeam: true
                    })

                    resolve();
                })
            })
        , 'deleteTeam')
    }

    const handleSaveNewRole = async (newRole: string): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "POST",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/organisation/teams/${team._id}/roles`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    },
                    data: {
                        newRole: newRole
                    }
                })
                .then( async (value: { data: SuccessResponse }) => {
                    const response = value.data;
                    
                    if(response.success === true) {
                        setTeam({
                            ...team,
                            roles: [
                                ...team.roles || [],
                                newRole
                            ]
                        })

                        setShowAddNewRole(false)

                        resolve();
                    } else {
                        setErrors({
                            ...errors,
                            addRole: true
                        })

                        resolve()
                    }
                })
                .catch(() => {
                    setErrors({
                        ...errors,
                        addRole: true
                    })

                    resolve()
                })
            })
        , 'addRole')
    }

    const handleEditRole = async (newRole: string): Promise<void> => {
        if(newRole === showEditRole) {
            setShowEditRole("");
            return;
        } else {
            trackPromise(
                new Promise<void>( async (resolve) => {
                    await axios({
                        method: "PUT",
                        url: process.env.REACT_APP_BACKEND_BASE_URL + `/organisation/teams/${team._id}/roles`,
                        headers: {
                            Authorization: "Bearer " + userDetails.accessToken
                        },
                        data: {
                            currentRole: showEditRole,
                            newRole: newRole
                        }
                    })
                    .then( async (value: { data: SuccessResponse }) => {
                        const response = value.data;
                        
                        if(response.success === true) {
                            await getTeamUsers();

                            const newArray = [...team.roles || []];
                            const editIndex = team.roles?.indexOf(showEditRole);

                            newArray[editIndex || -1] = newRole;

                            setTeam({
                                ...team,
                                roles: newArray
                            })

                            setShowEditRole("")

                            resolve();
                        } else {
                            setErrors({
                                ...errors,
                                editRole: true
                            })

                            resolve();
                        }
                    })
                    .catch(() => {
                        setErrors({
                            ...errors,
                            editRole: true
                        })

                        resolve();
                    })
                })
            , 'editRole')
        }
    }

    const handleDeleteRole = async (): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "DELETE",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/organisation/teams/${team._id}/roles`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    },
                    data: {
                        role: showDecisionDeleteRole
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        let newArray = [...team.roles || []];
                        const deleteIndex = team.roles?.indexOf(showDecisionDeleteRole)

                        if(deleteIndex !== undefined) {
                            newArray.splice(deleteIndex, 1);

                            setTeam({
                                ...team,
                                roles: newArray
                            })
                        }

                        setShowDecisionDeleteRole("")
                        resolve();
                    } else {
                        setErrors({
                            ...errors,
                            deleteRole: true
                        })
    
                        resolve();
                    }
                })
                .catch(() => {
                    setErrors({
                        ...errors,
                        deleteRole: true
                    })

                    resolve();
                })
            })
        , 'deleteRole')
    }

    const getDepartmentsPromise = usePromiseTracker({ area: "getDepartments" }).promiseInProgress;
    const getTeamsPromise = usePromiseTracker({ area: "getTeams" }).promiseInProgress;
    const getTeamByIdPromise = usePromiseTracker({ area: "getTeamById" }).promiseInProgress;
    const getUsersPromise = usePromiseTracker({ area: "getUsers" }).promiseInProgress;

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
                                                                    { value: "Delete", disabled: dpt.teamCount > 0 }
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
                                <div className="flex-container">
                                    <h4>{team.name}</h4>

                                    <button
                                        className="edit-button"
                                        onClick={() => setEditMode("name")}
                                    />
                                </div>
                                

                                <div className="flex-container">
                                    <button 
                                        className="bin-button" 
                                        onClick={() => setShowDecisionDeleteTeam(team._id)}
                                        disabled={getUsersPromise || userOptions.length > 0 || userStatusFilter === "suspended"}
                                    />
                                </div>
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

                                                    <div style={{
                                                        display: 'flex',
                                                        columnGap: 15,
                                                        alignItems: 'center'
                                                    }}>
                                                        <p style={{marginTop: 10}}>{team.operatingHours?.from} - {team.operatingHours?.to}</p>

                                                        {
                                                            editMode === "" ? (
                                                                <button
                                                                    className="edit-button"
                                                                    onClick={() => setEditMode("operatingHours")}
                                                                />
                                                            ) : null
                                                        }
                                                        
                                                    </div>
                                                </span>

                                                <span>
                                                    <h4>Team manager</h4>

                                                    <div style={{
                                                        display: 'flex',
                                                        columnGap: 15,
                                                        alignItems: 'center'
                                                    }}>
                                                        <p style={{marginTop: 10}}>{team.manager?.name}</p>

                                                        {
                                                            editMode === "" ? (
                                                                <button
                                                                    className="edit-button"
                                                                    onClick={() => setEditMode("manager")}
                                                                />
                                                            ) : null
                                                        }
                                                    </div>
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
                                                                                            onClick={() => setShowViewAction(action)}
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
                                                id="roles"
                                                name="roles"
                                                checked={accordionSelected === "roles"}
                                                onChange={handleSelectAccordion}
                                            />
                                            <label htmlFor="roles" className="standard-accordion-header">Roles</label>
                                            <div className="standard-accordion-body">
                                                {
                                                    team.roles?.length === 0 ? (
                                                        <p>No roles found. <button className="underline-text-link" onClick={() => setShowAddNewRole(true)}>Add the first?</button></p>
                                                    ) : (
                                                        <React.Fragment>
                                                            <table className="standard-table">
                                                                <tbody>
                                                                    <tr>
                                                                        <th>Role</th>
                                                                        <th>Headcount</th>
                                                                        <th></th>
                                                                    </tr>
                                                                    {
                                                                        team.roles?.sort((a, b) => a.localeCompare(b)).map(role => {
                                                                            const userCount = userOptions.filter(u => u.role === role).length;

                                                                            return (
                                                                                <tr>
                                                                                    <td>{role}</td>
                                                                                    <td>{userCount}</td>
                                                                                    <td style={{width: 80}}>
                                                                                        <div className="flex-container">
                                                                                            <button 
                                                                                                className="edit-button"
                                                                                                onClick={() => setShowEditRole(role)}
                                                                                            />

                                                                                            <button
                                                                                                className="bin-button"
                                                                                                disabled={userCount > 0 || userStatusFilter === "suspended"}
                                                                                                onClick={() => setShowDecisionDeleteRole(role)}
                                                                                            />
                                                                                        </div>
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
                                                                    onClick={() => setShowAddNewRole(true)}
                                                                >Add new role <i className="fa-solid fa-plus"/></button>
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
                                                <Select
                                                    className="standard-select"
                                                    options={[
                                                        { value: "active", label: "Active" },
                                                        { value: "suspended", label: "Suspended" }
                                                    ]}
                                                    style={{width: 160}}
                                                    values={[{ value: userStatusFilter, label: userStatusFilter.charAt(0).toUpperCase() + userStatusFilter.slice(1)}]}
                                                    onChange={e => {
                                                        const value = e[0].value;

                                                        setUserStatusFilter(value);
                                                    }}
                                                    multi={false}
                                                    backspaceDelete={false}
                                                    searchable={false}
                                                />

                                                <br/>

                                                {
                                                    userOptions.length === 0 ? (
                                                        <p style={{margin: "12px 0"}}>No members found. 
                                                            {
                                                                userStatusFilter === "active" ? (
                                                                    <button className="underline-text-link" onClick={() => setShowAddNewUser(true)}>Add the first?</button>
                                                                ) : null
                                                            }
                                                        </p>
                                                    ) : (
                                                        <React.Fragment>
                                                            <table className="standard-table">
                                                                <tbody>
                                                                    <tr>
                                                                        <th>Name</th>
                                                                        <th>Email</th>
                                                                        <th>Role</th>
                                                                        <th></th>
                                                                        <th></th>
                                                                    </tr>
                                                                    {
                                                                        userOptions.map(u => {
                                                                            return (
                                                                                <tr>
                                                                                    <td>{u.firstName} {u.lastName}</td>
                                                                                    <td>{u.emailAddress}</td>
                                                                                    <td>{u.role}</td>
                                                                                    <td>
                                                                                        <div
                                                                                            data-tooltip-id={u._id} 
                                                                                            className={`status-indicator ${u.status}`}
                                                                                        />

                                                                                        <Tooltip id={u._id}>
                                                                                            <p style={{ color: "#FFF", maxWidth: 200 }}>This user is {u.status}</p>
                                                                                        </Tooltip>
                                                                                    </td>
                                                                                    <td>
                                                                                        <button
                                                                                            style={{fontSize: 20, padding: 0, border: "none"}}
                                                                                            className="underline-text-link"
                                                                                            onClick={() => setShowViewUser(u)}
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
                        searchArea="deleteDepartment"
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
                        error={errors.addAction}
                    />
                ) : null
            }

            {
                showDecisionDeleteTeam !== "" ? (
                    <DecisionWindow
                        title="Delete team"
                        bodyJsx={[
                            <p>Are you sure you'd like to delete this team? This action cannot be undone</p>
                        ]}
                        acceptButtonText="Confirm"
                        acceptFunction={handleDeleteTeam}
                        searchArea="deleteTeam"
                        closeModal={() => setShowDecisionDeleteTeam("")}
                        errorMessage={errors.deleteTeam ? 'There was an error deleting this team, please try again' : undefined}
                    />
                ) : null
            }

            {
                editMode === "operatingHours" ? (
                    <EditOperatingHours
                        closeModal={() => setEditMode("")}
                        submitOperatingHours={handleEditTeam}
                        existingHours={team.operatingHours || { from: "--:--", to: "--:--"}}
                        error={errors.editTeam}
                    />
                ) : editMode === "manager" ? (
                    <UserLookup
                        closeModal={() => setEditMode("")}
                        handleSelectUser={(user: UserAbbrev) => {
                            handleEditTeam({
                                manager: {
                                    _id: user._id,
                                    name: user.fullName,
                                    emailAddress: user.emailAddress
                                }
                            })
                        }}
                        title="Edit team manager"
                    />
                ) : editMode === "name" ? (
                    <EditTeamName
                        closeModal={() => setEditMode("")}
                        submitName={handleEditTeam}
                        existingName={team.name}
                        error={errors.editTeam}
                    />
                ) : null
            }

            {
                showViewAction.action !== "" ? (
                    <ViewEditAction
                        closeModal={() => setShowViewAction({
                            action: "",
                            color: "",
                            restricted: false,
                            restrictedTo: []
                        })}
                        defaultState="view"
                        saveAction={handleEditAction}
                        roles={team.roles || []}
                        existingActions={team.actions || []}
                        deleteAction={handleDeleteAction}
                        action={showViewAction}
                        error={errors.editAction}
                    />
                ) : null
            }

            {
                showEditRole !== "" ? (
                    <EditRole
                        closeModal={() => setShowEditRole("")}
                        submitRole={handleEditRole}
                        existingRole={showEditRole}
                        error={errors.editRole ? "There was an error editing this role, please try again" : ""}
                    />
                ) : null
            }

            {
                showAddNewRole ? (
                    <AddNewRole
                        closeModal={() => setShowAddNewRole(false)}
                        submitRole={handleSaveNewRole}
                        error={errors.addRole ? "There was an error adding this role, please try again" : ""}
                    />
                ) : null
            }

            {
                showDecisionDeleteRole !== "" ? (
                    <DecisionWindow
                        title="Delete role"
                        bodyJsx={[
                            <p>Are you sure you'd like to delete this role? This action cannot be undone</p>
                        ]}
                        closeModal={() => setShowDecisionDeleteRole("")}
                        acceptFunction={handleDeleteRole}
                        acceptButtonText="Confirm"
                        searchArea="deleteRole"
                        errorMessage={errors.deleteRole ? "There was an error deleting this role, please try again" : ""}
                    />
                ) : null
            }

            {
                showAddNewUser ? (
                    <AddNewUser
                        closeModal={() => setShowAddNewUser(false)}
                        team={team}
                        getUsers={getTeamUsers}
                    />
                ) : null
            }

            {
                showViewUser ? (
                    <ViewUser
                        closeModal={() => setShowViewUser(undefined)}
                        user={showViewUser}
                        setUser={(setShowViewUser as any)}
                        userOptions={userOptions}
                        setUserOptions={setUserOptions}
                        team={team}
                    />
                ) : null
            }
        </React.Fragment>
    )
}

export default Organisation