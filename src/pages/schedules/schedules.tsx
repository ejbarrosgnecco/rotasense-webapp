import React, { useEffect, useState } from "react"
import ScheduleColumn, { SchedulePartInteraction } from "./components/scheduleColumn/scheduleColumn"
import { trackPromise, usePromiseTracker } from "react-promise-tracker"
import axios from "axios"
import axiosRetry from "axios-retry";

import "./schedules-styles.scss"
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { SuccessResponse } from "../../types.config";
import DatePicker, { DateObject } from "react-multi-date-picker";
import { RotatingLines } from "react-loader-spinner";
import schedule, { setSchedule } from "../../store/features/schedules/schedule";
import toastNotification from "../../components/toastNotifications/toastNotifications";
import Select from "react-dropdown-select";
import ErrorMessage from "../../components/error/error";
import { useSearchParams } from "react-router-dom";
import { Department, Team } from "../organisation/organisation";

axiosRetry(axios, {
    retries: 5,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

const ManageSchedules: React.FC = (): JSX.Element => {
    const userDetails = useSelector((state: RootState) => state.userAuthentication);
    const scheduleDetails = useSelector((state: RootState) => state.schedule);

    const dispatch = useDispatch();

    const [departmentOptions, setDepartmentOptions] = useState<{ _id: string, name: string }[]>([])
    const [teamOptions, setTeamOptions] = useState<{ _id: string, name: string}[]>([])

    const [searchParams, setSearchParams] = useSearchParams();

    const [errors, setErrors] = useState({
        noUsers: false
    })

    const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);

    const getDepartmentOptions = async (): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "GET",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/organisation/departments`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        setDepartmentOptions(response.data);

                        if(response.data.length > 0) {
                            if(searchParams.get("dpt")) {
                                const findDpt: Department = response.data.find((dpt: Team) => dpt.name === scheduleDetails.department.name);

                                if(findDpt) {
                                    dispatch(setSchedule({
                                        department: {
                                            _id: findDpt._id
                                        }
                                    }))
                                } else {
                                    dispatch(setSchedule({
                                        department: {
                                            _id: response.data[0]._id,
                                            name: response.data[0].name
                                        }
                                    }))
                                }
                            } else {
                                dispatch(setSchedule({
                                    department: {
                                        _id: response.data[0]._id,
                                        name: response.data[0].name
                                    }
                                }))
                            }
                            
                        }

                        resolve();
                    } else {
                        toastNotification({
                            type: "bad",
                            text: "There was an error fetching departments, please try again"
                        })

                        resolve();
                    }
                })
                .catch(() => {
                    toastNotification({
                        type: "bad",
                        text: "There was an error fetching departments, please try again"
                    })

                    resolve();
                })
            })
        , "getDepartments")
    }

    useEffect(() => {
        if(departmentOptions.length === 0) {
            getDepartmentOptions()
        }
    }, [])

    const getTeams = async (): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "GET",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/organisation/teams`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    },
                    params: {
                        dptId: scheduleDetails.department?._id
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        setTeamOptions(response.data);

                        if(response.data.length > 0 && !initialLoadComplete) {
                            if(searchParams.get("team")) {
                                const findTeam: Team = response.data.find((t: Team) => t.name === scheduleDetails.team.name);

                                if(findTeam) {
                                    dispatch(setSchedule({
                                        team: {
                                            _id: findTeam._id
                                        }
                                    }))
                                } else {
                                    dispatch(setSchedule({
                                        team: {
                                            _id: response.data[0]._id,
                                            name: response.data[0].name
                                        }
                                    }))
                                }
                            } else {
                                dispatch(setSchedule({
                                    team: {
                                        _id: response.data[0]._id,
                                        name: response.data[0].name
                                    }
                                }))
                            }
                        }

                        resolve();
                    } else {
                        if(!response.reason?.includes("No teams could be found")) {
                            toastNotification({
                                type: "bad",
                                text: "There was an error fetching teams, please try again"
                            })
                        }

                        resolve();
                    }
                })
                .catch(() => {
                    toastNotification({
                        type: "bad",
                        text: "There was an error fetching teams, please try again"
                    })

                    resolve();
                })
            })
        , "get_teams")

        setInitialLoadComplete(true)
    }

    useEffect(() => {
        if(scheduleDetails.department?._id !== "") {
            getTeams();
        }
    }, [scheduleDetails.department?._id])

    const getSchedules = async (): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "GET",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/schedules/${scheduleDetails.team?._id}`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    },
                    params: {
                        date: scheduleDetails.date
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;
                    
                    if(response.success === true) {
                        dispatch(setSchedule({
                            _id: response.data.schedule_id || "",
                            timeframe: {
                                from: response.data.timeframe.from,
                                to: response.data.timeframe.to
                            },
                            schedules: response.data.schedules
                        }))

                        resolve();
                    } else {
                        if(response.reason?.includes("No users could be found")) {
                            setErrors({
                                ...errors,
                                noUsers: true
                            })
                        } else {
                            toastNotification({
                                type: "bad",
                                text: "There was an error loading this schedule, please try again"
                            })
                        }

                        resolve()
                    }
                })
                .catch(() => {
                    toastNotification({
                        type: "bad",
                        text: "There was an error loading this schedule, please try again"
                    })
                    
                    resolve()
                })
            })
        , "get_schedules")
    }

    useEffect(() => {
        if(scheduleDetails.team?._id) {
            dispatch(setSchedule({
                _id: "",
                timeframe: {
                    from: "",
                    to: ""
                },
                timeOptions: {
                    hours: [],
                    minutes: ["00", "15", "30", "45"]
                },
                schedules: []
            }))

            getSchedules();
        }
    }, [scheduleDetails.team._id, scheduleDetails.date])

    const getActions = async (): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "GET",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/schedules/${userDetails.team._id}/actions`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    }
                })
                .then((value: { data: SuccessResponse}) => {
                    const response = value.data;

                    if(response.success === true) {
                        const reducedObject = response.data.reduce((a: any, v: { action: string, color: string}) => ({ ...a, [v.action]: v.color}), {})
                        
                        dispatch(setSchedule({
                            teamActions: reducedObject
                        }))

                        resolve()
                    } else {
                        toastNotification({
                            type: "bad",
                            text: "There was an error fetching team actions, please try again"
                        })

                        resolve()
                    }
                })
                .catch(() => {
                    toastNotification({
                        type: "bad",
                        text: "There was an error fetching team actions, please try again"
                    })

                    resolve();
                })
            })
        , "get_actions")
    }

    useEffect(() => {
        getActions();
    }, [])

    const handleIncrementDate = (change: number): void => {
        const date = scheduleDetails.date;
        
        const newDate = new Date(new Date(date).setDate(new Date(date).getDate() + change));
        dispatch(setSchedule({
            date: newDate.toISOString().substring(0, 10)
        }))
    }

    const handleChangeDateUrl = (): void => {
        var queryParams = new URLSearchParams(window.location.search)
        queryParams.set("d", scheduleDetails.date)

        window.history.replaceState(null, "", "?" + queryParams.toString())
    }

    useEffect(() => {
        handleChangeDateUrl()
    }, [scheduleDetails.date])

    const handleChangeDepartmentUrl = (): void => {
        var queryParams = new URLSearchParams(window.location.search)
        queryParams.set("dpt", scheduleDetails.department.name)
        queryParams.delete("team")

        window.history.replaceState(null, "", "?" + queryParams.toString())
    }

    useEffect(() => {
        if(scheduleDetails.department.name !== "") {
            handleChangeDepartmentUrl()
        }
    }, [scheduleDetails.department.name])

    const handleChangeTeamUrl = (): void => {
        var queryParams = new URLSearchParams(window.location.search)
        queryParams.set("team", scheduleDetails.team.name)

        window.history.replaceState(null, "", "?" + queryParams.toString())
    }

    useEffect(() => {
        if(scheduleDetails.team.name !== "") {
            handleChangeTeamUrl()
        }
    }, [scheduleDetails.team.name])
    

    useEffect(() => {
        // Get all interval timeslots according to preferences
        let startTimeDate = new Date(`2023-02-02T${scheduleDetails.timeframe.from}:00.000`)
        let endTimeDate = new Date(`2023-02-02T${scheduleDetails.timeframe.to}:00.000`)

        let timesArray: string[] = [];
        let hoursArray: string[] = [];

        for (let d = startTimeDate; d <= endTimeDate; d.setMinutes(d.getMinutes() + 15)) {
            timesArray.push(d.toTimeString().substring(0, 5))

            if(d.getMinutes() === 0) {
                hoursArray.push(d.toTimeString().substring(0, 5))
            }
        }

        dispatch(setSchedule({
            timeOptions: {
                hours: hoursArray,
                slots: timesArray
            }
        }))
    }, [scheduleDetails.timeframe.from || scheduleDetails.timeframe.to])

    const getDepartmentsPromise = usePromiseTracker({ area: "getDepartments" }).promiseInProgress;
    const getTeamsPromise = usePromiseTracker({ area: "get_teams" }).promiseInProgress;
    const getSchedulesPromise = usePromiseTracker({ area: 'get_schedules' }).promiseInProgress;

    return (
        <React.Fragment>
            <div className="filters-bar-container">
                <div className="flex-container">
                    <span>
                        <p className="mini-label">Department</p>
                        <Select
                            className="standard-select"
                            style={{width: 180, whiteSpace: "nowrap", }}
                            options={departmentOptions.map(dpt => {
                                return { value: dpt, label: dpt.name }
                            })}
                            values={ scheduleDetails.department?._id ? [{ value: scheduleDetails.department, label: scheduleDetails.department.name }] : []}
                            backspaceDelete={false}
                            searchable={true}
                            multi={false}
                            placeholder="Select department"
                            noDataLabel="No departments found"
                            loading={getDepartmentsPromise}
                            onChange={e => {
                                if(initialLoadComplete && e.length > 0) {
                                    setTeamOptions([])
                                    dispatch(setSchedule({
                                        department: e[0].value,
                                        team: {
                                            _id: "",
                                            name: ""
                                        }
                                    }))
                                }
                            }}
                        />
                    </span>

                    <span>
                        <p className="mini-label">Team</p>
                        <Select
                            className="standard-select"
                            style={{width: 180}}
                            options={teamOptions.map(team => {
                                return { value: team, label: team.name }
                            })}
                            values={ scheduleDetails.team?._id ? [{ value: scheduleDetails.team, label: scheduleDetails.team.name }] : []}
                            backspaceDelete={false}
                            searchable={true}
                            loading={getTeamsPromise}
                            placeholder="Select team"
                            multi={false}
                            noDataLabel="No teams found"
                            onChange={e => {
                                if(e.length > 0) {
                                    setErrors({
                                        ...errors,
                                        noUsers: false
                                    })

                                    dispatch(setSchedule({
                                        team: e[0].value
                                    }))
                                }
                            }}
                        />
                    </span>
                </div>

                <div className="date-filter-wrapper">
                    <DatePicker
                        render={(value, openCalendar) => {
                            return (
                                <div
                                    className="date-picker-front"
                                    onClick={openCalendar}
                                >{new Date(scheduleDetails.date).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric"})}</div>
                            )
                        }}
                        value={scheduleDetails.date}
                        style={{ zIndex: 100 }}
                        onChange={(e: DateObject) => {
                            if(e.unix !== undefined) {
                                let date = new Date(e.unix * 1000 + 7200000).toISOString().substring(0, 10);

                                dispatch(setSchedule({
                                    date: date
                                }))
                            }
                        }}
                    />
                    <div className="date-select-arrows">
                        <button
                            className="arrow-button left"
                            onClick={() => handleIncrementDate(-1)}
                        />

                        <button
                            className="arrow-button right"
                            onClick={() => handleIncrementDate(1)}
                        />
                    </div>
                </div>
                

                <div/>
            </div>

            <div className={`schedule-column-wrapper ${getSchedulesPromise ? 'loading' : ''}`}>
                {
                    getSchedulesPromise ? (
                        <React.Fragment>
                            <RotatingLines
                                strokeColor="#dadada"
                                strokeWidth="5"
                                animationDuration="1"
                                width="80"
                                visible={true}
                            />
                            <p>Loading</p>
                        </React.Fragment>
                    ) : errors.noUsers ? (
                        <ErrorMessage
                            message="There were no users found within this team to display"
                        />
                    ) : (
                        <React.Fragment>
                            <div className={`schedule-timemarker-outer-wrapper ${scheduleDetails.expandSchedule !== "" ? 'expanded' : ""}`}>
                                <div className="hour-marker-wrapper">
                                    {scheduleDetails.timeOptions.hours.map(hour => {
                                        const isHour = new Date(`2023-07-04T${hour}:00.000`).getHours() === new Date().getHours();

                                        let pxCoordinate = -10;
                                        const currentMinutes = new Date().getMinutes();
                                        const hourProgress = currentMinutes / 60;

                                        pxCoordinate += hourProgress * 100;

                                        return (
                                            <div>
                                                <hr className="hour-marker-line"/>

                                                {
                                                    isHour ? (
                                                        <hr style={{ marginTop: pxCoordinate }} className="current-time-marker"/>
                                                    ) : null
                                                }
                                            </div>
                                        )
                                    })}
                                </div>

                                <ul className="schedule-side-timeslot-container">
                                    {scheduleDetails.timeOptions.hours.map(hour => (
                                        <li>{hour}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="schedule-columns-wrapper" id="schedule-columns-wrapper">
                                {scheduleDetails.schedules.map((schedule) => (
                                    <ScheduleColumn
                                        user={schedule.member}
                                    />
                                ))}
                            </div>
                        </React.Fragment>
                    )
                }
            </div>
        </React.Fragment>
    )
}

export default ManageSchedules