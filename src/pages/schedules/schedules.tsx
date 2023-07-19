import React, { useEffect, useState } from "react"
import ScheduleColumn from "./components/scheduleColumn/scheduleColumn"
import { trackPromise, usePromiseTracker } from "react-promise-tracker"
import axios from "axios"
import axiosRetry from "axios-retry";

import "./schedules-styles.scss"
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { SuccessResponse } from "../../types.config";
import DatePicker, { DateObject } from "react-multi-date-picker";
import { RotatingLines } from "react-loader-spinner";

axiosRetry(axios, {
    retries: 5,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

const ManageSchedules: React.FC = (): JSX.Element => {
    const userDetails = useSelector((state: RootState) => state.userAuthentication)

    const [department, setDepartment] = useState<string>("Engineering");
    const [team, setTeam] = useState({
        name: "Test squad",
        id: "649ec547bfd5bc167148ce58"
    });

    const [scheduleId, setScheduleId] = useState<string | undefined>()
    const [schedules, setSchedules] = useState([]);

    const [timeframe, setTimeframe] = useState({
        from: "08:00",
        to: "20:00"
    })

    const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10))
    const [hours, setHours] = useState<string[]>([])
    const [timeslots, setTimeslots] = useState<string[]>([])

    const [availableActions, setAvailableActions] = useState<{ [ key: string ]: string }>({})

    const [errors, setErrors] = useState({
        
    })

    const getSchedules = async (): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/schedules/${userDetails.team._id}`,
                    params: {
                        date: date,
                        orgId: userDetails.organisation._id
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;
                    
                    if(response.success === true) {
                        setSchedules(response.data.schedules);
                        setTimeframe({
                            from: response.data.timeframe.from,
                            to: response.data.timeframe.to
                        })

                        if(response.data.schedule_id) {
                            setScheduleId(response.data.schedule_id)
                        }

                        resolve();
                    } else {
                        setErrors({
                            ...errors,
                            // Set an error
                        })

                        resolve()
                    }
                })
                .catch((err) => {
                    console.error(err);
                    resolve()
                })
            })
        , "get_schedules")
    }

    useEffect(() => {
        getSchedules();
    }, [date])

    const getActions = async (): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "GET",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/schedules/${userDetails.team._id}/actions`,
                    params: {
                        orgId: userDetails.organisation._id
                    }
                })
                .then((value: { data: SuccessResponse}) => {
                    const response = value.data;

                    if(response.success === true) {
                        const reducedObject = response.data.reduce((a: any, v: { action: string, color: string}) => ({ ...a, [v.action]: v.color}), {})
                        setAvailableActions(reducedObject);

                        resolve()
                    } else {
                        setErrors({
                            ...errors,
                            // Set error
                        })

                        resolve()
                    }
                })
                .catch((err) => {
                    setErrors({
                        ...errors,
                        // Set error
                    })

                    resolve()

                    resolve();
                })
            })
        , "get_actions")
    }

    const handleIncrementDate = (change: number): void => {
        const newDate = new Date(new Date(date).setDate(new Date(date).getDate() + change));
        setDate(newDate.toISOString().substring(0, 10))
    }

    useEffect(() => {
        getSchedules();
        getActions();
    }, [])

    useEffect(() => {
        // Get all interval timeslots according to preferences
        let startTimeDate = new Date(`2023-02-02T${timeframe.from}:00.000`)
        let endTimeDate = new Date(`2023-02-02T${timeframe.to}:00.000`)

        let timesArray: string[] = [];
        let hoursArray: string[] = [];

        for (let d = startTimeDate; d <= endTimeDate; d.setMinutes(d.getMinutes() + 15)) {
            timesArray.push(d.toTimeString().substring(0, 5))

            if(d.getMinutes() === 0) {
                hoursArray.push(d.toTimeString().substring(0, 5))
            }
        }
        
        setHours(hoursArray)
        setTimeslots(timesArray)
    }, [timeframe])

    const getSchedulesPromise = usePromiseTracker({ area: 'get_schedules' }).promiseInProgress;

    return (
        <React.Fragment>
            <div className="filters-bar-container">
                <div/>

                <div className="date-filter-wrapper">
                    <DatePicker
                        render={(value, openCalendar) => {
                            return (
                                <div
                                    className="date-picker-front"
                                    onClick={openCalendar}
                                >{new Date(date).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric"})}</div>
                            )
                        }}
                        onChange={(e: DateObject) => {
                            if(e.unix !== undefined) {
                                let date = new Date(e.unix * 1000 + 7200000).toISOString().substring(0, 10);

                                setDate(date)
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
                    ) : (
                        <React.Fragment>
                            <div className="schedule-timemarker-outer-wrapper">
                                <div className="hour-marker-wrapper">
                                    {hours.map(hour => {
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
                                    {hours.map(hour => (
                                        <li>{hour}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="schedule-columns-wrapper" id="schedule-columns-wrapper">
                                {schedules.map((schedule, index) => (
                                    <ScheduleColumn
                                        date={date}
                                        teamId={team.id}
                                        scheduleId={scheduleId}
                                        timeframe={timeframe}
                                        timeslots={timeslots}
                                        availableHours={hours}
                                        schedule={schedule}
                                        availableActions={availableActions}
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