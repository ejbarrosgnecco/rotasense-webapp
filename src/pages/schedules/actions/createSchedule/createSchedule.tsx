import axios from "axios";
import axiosRetry from "axios-retry";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react"
import Select from "react-dropdown-select";
import DatePicker, { DateObject } from "react-multi-date-picker";
import { trackPromise } from "react-promise-tracker";
import { useDispatch, useSelector } from "react-redux";
import ErrorMessage from "../../../../components/error/error";
import FullScreenPromiseTracker from "../../../../components/promiseTrackers/fullScreenTracker";
import toastNotification from "../../../../components/toastNotifications/toastNotifications";
import { ScheduleChange, setSchedule } from "../../../../store/features/schedules/schedule";
import { RootState } from "../../../../store/store";
import { SuccessResponse } from "../../../../types.config";
import { Schedule } from "../../components/scheduleColumn/scheduleColumn"

import "./createSchedule-styles.scss";

axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

interface ScheduleSlot {
    startTime: string,
    endTime: string,
    action: string
}

const CreateSchedule: React.FC<{
    memberDetails: Schedule["member"],
    closeModal: Dispatch<SetStateAction<boolean>>
}> = ({ memberDetails, closeModal }): JSX.Element => {
    const userDetails = useSelector((state: RootState) => state.userAuthentication);
    const scheduleDetails = useSelector((state: RootState) => state.schedule);

    const dispatch = useDispatch();
    
    const fullDate = new Date(`${scheduleDetails.date}T12:00:00.000`);

    const [scheduleSelections, setScheduleSelections] = useState<ScheduleSlot[]>([
        {
            startTime: "--:--",
            endTime: "--:--",
            action: ""
        }
    ])

    const [repeatDates, setRepeatDates] = useState<string[]>([])

    const [showAdditionalSettings, setShowAdditionalSettings] = useState<boolean>(false);

    const [availableActions, setAvailableActions] = useState<{ action: string, color: string }[]>([])
    const [timeSelectChoices, setTimeSelectChoices] = useState<{ hours: string[], minutes: string[] }>({
        hours: [],
        minutes: ["00", "15", "30", "45"]
    })

    const [errors, setErrors] = useState<{ [key: string]: boolean }>({})

    const getAvailableActions = async (): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "GET",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/schedules/${scheduleDetails.team._id}/actions`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    },
                    params: {
                        role: memberDetails.role
                    }
                })
                .then((value: { data: SuccessResponse}) => {
                    const response = value.data;

                    if(response.success === true) {
                        setAvailableActions(response.data);

                        resolve()
                    } else {
                        toastNotification({
                            type: "bad",
                            text: "There was an issue fetching team actions, please try again"
                        })

                        resolve()
                    }
                })
                .catch(() => {
                    toastNotification({
                        type: "bad",
                        text: "There was an issue fetching team actions, please try again"
                    })

                    resolve();
                })
            })
        , 'getActions')
    }

    useEffect(() => {
        // Get all available actions
        getAvailableActions();

        // Get all available hours & minutes options for select dropdowns
        let hours: string[] = []
        for (let d = new Date(`2023-02-02T${scheduleDetails.timeframe.from}:00.000`); d <= new Date(`2023-02-02T${scheduleDetails.timeframe.to}:00.000`); d.setHours(d.getHours() + 1)) {
            const hour = d.getHours().toString()
            hours.push(`${hour.length === 1 ? 0 : ""}${hour}`)
        }
        setTimeSelectChoices({
            ...timeSelectChoices,
            hours: hours
        })
    }, [])

    const handleChangeScheduleTimings = (e: { value: string }[], i: number, key: string): void => {
        const keyName = key.split(":")[0];
        const keyPart = key.split(":")[1];

        const parts = ["hour", "minute"]
        
        const value = e[0].value;

        let prevArray = [...scheduleSelections];
        
        let newValue = (prevArray as any)[i][keyName].split(":")
        newValue[parts.indexOf(keyPart)] = value
        newValue = newValue.join(":");

        (prevArray as any)[i][keyName] = newValue

        setScheduleSelections(prevArray)
        setErrors({
            ...errors,
            format: false,
            [`${i}_invalid`]: false,
            [`${i}_${keyName}`]: false
        })
    }

    const handleChangeScheduleActions = (e: { value: string }[], i: number): void =>  {
        const value = e[0].value;

        let prevArray = [...scheduleSelections];
        prevArray[i].action = value;

        setScheduleSelections(prevArray)
        setErrors({
            ...errors,
            format: false,
            [`${i}_action`]: false
        })
    }

    const handleRemoveScheduleLine = (e: React.FormEvent<HTMLButtonElement>, i: number): void => {
        let prevArray = [...scheduleSelections];
        prevArray.splice(i, 1);

        setErrors({})
        setScheduleSelections(prevArray)
    }

    const handleAddScheduleLine = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();

        setScheduleSelections([
            ...scheduleSelections,
            {
                startTime: "-",
                endTime: "-",
                action: ""
            }
        ])
    }

    const handleDataValidation = (): boolean => {
        let errorsCount: number = 0;
        let errorsObject: { [key: string]: boolean } = {};

        // Check that all times & actions are valid
        for (let i = 0; i < scheduleSelections.length; i++) {
            const schedule = scheduleSelections[i];
            
            let timesValid: boolean = true;
            
            if(/^([0-9]{2})+:+([0-9]{2})$/.test(schedule.startTime) === false) {
                errorsCount++;
                errorsObject[`${i}_startTime`] = true;
                errorsObject.format = true;
                timesValid = false
            }

            if(/^([0-9]{2})+:+([0-9]{2})$/.test(schedule.endTime) === false) {
                errorsCount++;
                errorsObject[`${i}_endTime`] = true;
                errorsObject.format = true;
                timesValid = false
            }

            // Check that from < to
            if (timesValid === true) {
                if(new Date(`2023-02-02T${schedule.startTime}:00.000`) > new Date(`2023-02-02T${schedule.endTime}:00.000`)) {
                    errorsCount++;
                    errorsObject[`${i}_invalid`] = true;
                    errors.format = true;
                }
            }

            if(schedule.action === "") {
                errorsCount++;
                errorsObject[`${i}_action`] = true;
                errorsObject.format = true;
            }
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

    const handleSubmitSchedule = async (e: React.FormEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();

        if(handleDataValidation() === true) {
            // Format timeslots
            let timeslotsFormatted: { time: string, action: string }[] = [];

            for (const timeslot of scheduleSelections) {
                const fromTime = new Date(`2023-02-02T${timeslot.startTime}:00.000`);
                const toTime = new Date(`2023-02-02T${timeslot.endTime}:00.000`);

                for (let d = fromTime; d < toTime; d.setMinutes(d.getMinutes() + 15)) {
                    // Check if timeslot hasn't been used twice
                    if(!timeslotsFormatted.some(t => t.time === d.toTimeString().substring(0, 5))) {
                        timeslotsFormatted.push({
                            time: d.toTimeString().substring(0, 5),
                            action: timeslot.action
                        })
                    } else {
                        return setErrors({
                            ...errors,
                            duplicate: true
                        })
                    }
                    
                }
            }

            timeslotsFormatted.sort((a, b) => new Date(`2023-02-02T${a.time}:00.000`).getTime() - new Date(`2023-02-02T${b.time}:00.000`).getTime())

            // Submit to server
            trackPromise(
                new Promise<void>( async (resolve) => {
                    await axios({
                        method: "POST",
                        url: process.env.REACT_APP_BACKEND_BASE_URL + `/schedules/${scheduleDetails.team._id}/${memberDetails._id}`,
                        headers: {
                            Authorization: "Bearer " + userDetails.accessToken
                        },
                        data: {
                            scheduleId: scheduleDetails._id,
                            date: scheduleDetails.date,
                            schedule: scheduleSelections,
                            repeatDates: repeatDates
                        }
                    })
                    .then((value: { data: SuccessResponse }) => {
                        const response = value.data;

                        if(response.success === true) {
                            const editIndex: number = scheduleDetails.schedules.findIndex(i => i.member._id === memberDetails._id);
                            let objectCopy = {...scheduleDetails.schedules[editIndex]};
                            
                            objectCopy.submitted = true
                            objectCopy.schedule = timeslotsFormatted
                            
                            let newArray = [...scheduleDetails.schedules]
                            newArray[editIndex] = objectCopy

                            let updateObject: ScheduleChange  = {
                                schedules: newArray
                            }

                            if(response.data?.scheduleId) {
                                updateObject["_id"] = response.data.scheduleId;
                            }

                            dispatch(setSchedule(updateObject))

                            closeModal(false)

                            resolve()
                        } else {
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

                        resolve();
                    })
                })
            , 'submitSchedule')
        }
    }

    return (
        <React.Fragment>
            <FullScreenPromiseTracker
                searchArea="submitSchedule"
                message="Please wait..."
            />
            
            <div className="modal-backdrop show">
                <div className="modal-wrapper-container">
                    <div className={`standard-modal xxl-width`}>
                        <div className="standard-modal-title">
                            <h3>Create a schedule</h3>

                            <button 
                                className="close-modal-button"
                                onClick={() => closeModal(false)}
                            />
                        </div>

                        <div className="standard-modal-body">
                            <h3>{memberDetails.name}</h3>
                            <p style={{marginTop: 5}}><i>{fullDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric"})}</i></p>

                            <br/>

                            <table className="structural-table" style={{borderSpacing: 10}}>
                                <tbody>
                                    <tr>
                                        <td style={{textAlign: 'center'}}>From</td>
                                        <td style={{textAlign: 'center'}}>To</td>
                                        <td>&nbsp;</td>
                                        <td>&nbsp;</td>
                                    </tr>
                                    
                                    {
                                        scheduleSelections.map((line, i) => {
                                            return (
                                                <React.Fragment>
                                                    <tr>
                                                        <td>
                                                            <div className="time-select-wrapper">
                                                                {/* Hours */}
                                                                <Select
                                                                    className={`standard-select mini ${errors[`${i}_startTime`] || errors[`${i}_invalid`] ? 'error' : ''}`}
                                                                    style={{ width: 60 }}
                                                                    options={timeSelectChoices.hours.map(hour => {
                                                                        return { value: hour }
                                                                    })}
                                                                    labelField={"value"}
                                                                    values={[{ value: line.startTime.split(":")[0] }]}
                                                                    placeholder="-"
                                                                    multi={false}
                                                                    backspaceDelete={false}
                                                                    searchable={false}
                                                                    onChange={(e) => handleChangeScheduleTimings(e, i, 'startTime:hour')}
                                                                />
                                                                :
                                                                {/* Minutes */}
                                                                <Select
                                                                    className={`standard-select mini ${errors[`${i}_startTime`] || errors[`${i}_invalid`] ? 'error' : ''}`}
                                                                    style={{ width: 60 }}
                                                                    options={timeSelectChoices.minutes.map(minute => {
                                                                        return { value: minute }
                                                                    })}
                                                                    labelField={"value"}
                                                                    values={[{ value: line.startTime.split(":")[1] }]}
                                                                    placeholder="-"
                                                                    multi={false}
                                                                    backspaceDelete={false}
                                                                    searchable={false}
                                                                    onChange={(e) => handleChangeScheduleTimings(e, i, 'startTime:minute')}
                                                                />
                                                            </div>
                                                        </td>

                                                        <td>
                                                            <div className="time-select-wrapper">
                                                                {/* Hours */}
                                                                <Select
                                                                    className={`standard-select mini ${errors[`${i}_endTime`] || errors[`${i}_invalid`] ? 'error' : ''}`}
                                                                    style={{ width: 60 }}
                                                                    options={timeSelectChoices.hours.map(hour => {
                                                                        return { value: hour }
                                                                    })}
                                                                    labelField={"value"}
                                                                    values={[{ value: line.endTime.split(":")[0] }]}
                                                                    placeholder="-"
                                                                    multi={false}
                                                                    backspaceDelete={false}
                                                                    searchable={false}
                                                                    onChange={(e) => handleChangeScheduleTimings(e, i, 'endTime:hour')}
                                                                />
                                                                :
                                                                {/* Minutes */}
                                                                <Select
                                                                    className={`standard-select mini ${errors[`${i}_endTime`] || errors[`${i}_invalid`] ? 'error' : ''}`}
                                                                    style={{ width: 60 }}
                                                                    options={timeSelectChoices.minutes.map(minute => {
                                                                        return { value: minute }
                                                                    })}
                                                                    labelField={"value"}
                                                                    values={[{ value: line.endTime.split(":")[1] }]}
                                                                    placeholder="-"
                                                                    multi={false}
                                                                    backspaceDelete={false}
                                                                    searchable={false}
                                                                    onChange={(e) => handleChangeScheduleTimings(e, i, 'endTime:minute')}
                                                                />
                                                            </div>
                                                        </td>

                                                        <td>
                                                            <Select
                                                                className={`standard-select ${errors[`${i}_action`] ? 'error' : ''}`}
                                                                style={{ minWidth: 200}}
                                                                options={availableActions.map(a => {
                                                                    return { value: a.action }
                                                                })}
                                                                labelField="value"
                                                                placeholder="Select an action"
                                                                multi={false}
                                                                backspaceDelete={false}
                                                                searchable={false}
                                                                values={ line.action === "" ? [] : [{ value: line.action }]}
                                                                onChange={(e) => handleChangeScheduleActions(e, i)}
                                                                noDataLabel="No actions found"
                                                            />
                                                        </td>

                                                        <td>
                                                            {
                                                                i > 0 ? (
                                                                    <button
                                                                        style={{marginLeft: 5}}
                                                                        className="remove-button"
                                                                        onClick={(e) => handleRemoveScheduleLine(e, i)}
                                                                    />
                                                                ) : <div style={{width: 38}}/>
                                                            }
                                                        </td>
                                                    </tr>
                                                    {
                                                        errors[`${i}_invalid`] ? (
                                                            <tr>
                                                                <td colSpan={2}>
                                                                    <ErrorMessage
                                                                        message="Time 'from' cannot be higher than 'to'"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ) : null
                                                    }
                                                    
                                                </React.Fragment>
                                            )
                                        })
                                    }
                                </tbody>
                            </table>

                            {
                                errors.format ? (
                                    <ErrorMessage
                                        topSpacing="20px"
                                        message="Please ensure everything is filled in correctly"
                                    />
                                ) : null
                            }

                            {
                                errors.duplicate ? (
                                    <ErrorMessage
                                        message="Please ensure that timeslots do not overlap"
                                    />
                                ) : null
                            }

                            <br/>
                            
                            <center>
                                <button 
                                    className="hover-box-button"
                                    onClick={handleAddScheduleLine}
                                >Add new row <i className="fa-solid fa-plus"/></button>
                            </center>

                            <br/>

                            <input 
                                className="standard-accordion-trigger invisible"
                                type="checkbox"
                                id="users"
                                name="users"
                                checked={showAdditionalSettings}
                                onChange={(e) => {
                                    setShowAdditionalSettings(e.target.checked)
                                }}
                            />
                            <label htmlFor="users" className="standard-accordion-header">Additional settings</label>
                            <div className="standard-accordion-body">
                                <h5 style={{ margin: "0 0 10px 0"}}>Repeat schedule</h5>

                                <DatePicker
                                    multiple={true}
                                    render={(value, openCalendar) => {
                                        return (
                                            <div 
                                                className={`date-picker-front ${errors.dates ? 'error' : ''}`}
                                                onClick={openCalendar}
                                                style={{ justifyContent: "center", minWidth: 160, marginBottom: 10 }}
                                            >Open calendar</div> 
                                        )
                                    }}
                                    highlightToday={false}
                                    currentDate={new DateObject().setDate(scheduleDetails.date)}
                                    value={
                                        [
                                            scheduleDetails.date,
                                            ...repeatDates
                                        ]
                                    }
                                    onChange={(e: DateObject[]) => {
                                        setRepeatDates(
                                            e.filter(i => new Date(i.unix * 1000 + 7200000).toISOString().substring(0, 10) !== scheduleDetails.date).map((obj): string => {
                                                return new Date(obj.unix * 1000 + 7200000).toISOString().substring(0, 10);
                                            })
                                        )

                                        setErrors({
                                            ...errors,
                                            dates: false,
                                            error: false
                                        })
                                    }}
                                />

                            {
                                repeatDates.length === 0 ? (
                                    <p className="secondary-text">No dates selected yet</p>
                                ) : (
                                    <React.Fragment>
                                        <ul style={{ marginTop: 5 }}>
                                            {
                                                repeatDates.map(date => (
                                                    <li>{new Date(date).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric"})}</li>
                                                ))
                                            }
                                        </ul>
                                    </React.Fragment>
                                )
                            }
                            </div>
                        </div>
                        
                        <div className="standard-modal-footer">
                            <button 
                                className="standard-button green"
                                onClick={handleSubmitSchedule}
                            >Save schedule</button>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default CreateSchedule