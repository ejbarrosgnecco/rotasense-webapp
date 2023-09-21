import axios from "axios"
import axiosRetry from "axios-retry"
import React, { useEffect, useState } from "react";
import Select from "react-dropdown-select";
import { trackPromise, usePromiseTracker } from "react-promise-tracker";
import { useDispatch, useSelector } from "react-redux";
import ErrorMessage from "../../../../components/error/error";
import InlinePromiseTracker from "../../../../components/promiseTrackers/inlineTracker";
import toastNotification from "../../../../components/toastNotifications/toastNotifications";
import { setSchedule } from "../../../../store/features/schedules/schedule";
import { RootState } from "../../../../store/store";
import { SuccessResponse } from "../../../../types.config";

import "../createSchedule/createSchedule-styles.scss";

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

const EditSchedule: React.FC<{
    user: { _id: string, name: string, role: string },
    closeModal: () => void
}> = ({ user, closeModal }): JSX.Element => {
    const userDetails = useSelector((state: RootState) => state.userAuthentication);
    const scheduleDetails = useSelector((state: RootState) => state.schedule);

    const dispatch = useDispatch();

    const fullDate = new Date(`${scheduleDetails.date}T12:00:00.000`);

    const [scheduleSelections, setScheduleSelections] = useState<ScheduleSlot[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [errors, setErrors] = useState<{ [key: string]: boolean }>({
        format: false,
        error: false
    });

    const [availableActions, setAvailableActions] = useState<{ action: string, color: string }[]>([]);

    const getAvailableActions = async (): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "GET",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/schedules/${userDetails.team._id}/actions`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    },
                    params: {
                        role: user.role
                    }
                })
                .then((value: { data: SuccessResponse }) => {
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
        , 'get_actions')
    }

    const initiateScheduleValues = (): void => {
        let prev: { index: number, action: string } = { index: -1, action: "-" };

        let slotSegments: { action: string, startTime: string, endTime: string }[] = [];
        
        const userIndex = scheduleDetails.schedules.findIndex(i => i.member._id === user._id);
        const userScheduleSlots = scheduleDetails.schedules[userIndex].schedule;
        
        for (let i = 0; i < userScheduleSlots.length; i++) {
            const slot = userScheduleSlots[i];
            const startTime = new Date(`2023-02-02T${slot.time}:00.000`);

            if(slot.action === prev.action) {
                slotSegments[prev.index].endTime = new Date(startTime.setMinutes(startTime.getMinutes() + 15)).toTimeString().substring(0, 5);
            } else {
                slotSegments.push({ action: slot.action, startTime: startTime.toTimeString().substring(0, 5), endTime: new Date(startTime.setMinutes(startTime.getMinutes() + 15)).toTimeString().substring(0, 5)});
                prev = { index: slotSegments.length - 1, action: slot.action }
            }
        }

        setScheduleSelections(slotSegments)
    }

    useEffect(() => {
        // Get all available actions
        if(availableActions.length === 0) {
            getAvailableActions();
        }

        initiateScheduleValues();
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
            error: false,
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
            error: false,
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
            trackPromise(
                new Promise<void>( async (resolve) => {
                    await axios({
                        method: "PUT",
                        url: process.env.REACT_APP_BACKEND_BASE_URL + `/schedules/${scheduleDetails.team._id}/${user._id}`,
                        headers: {
                            Authorization: "Bearer " + userDetails.accessToken
                        },
                        data: {
                            scheduleId: scheduleDetails._id,
                            schedule: scheduleSelections
                        }
                    })
                    .then((value: { data: SuccessResponse }) => {
                        const response = value.data;

                        if(response.success === true) {
                            const editIndex: number = scheduleDetails.schedules.findIndex(i => i.member._id === user._id);
                            let objectCopy = { ...scheduleDetails.schedules[editIndex] }

                            objectCopy.schedule = response.data.newSchedule;

                            let newArray = [...scheduleDetails.schedules];
                            newArray[editIndex] = objectCopy;

                            dispatch(setSchedule({
                                schedules: newArray
                            }))

                            closeModal();

                            resolve()
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
                        setErrorMessage("Oops, there was a technical error, please try again");
                        setErrors({
                            ...errors,
                            error: true
                        })

                        resolve();
                    })
                })
            , 'editSchedule')
        }
    }

    const editSchedulePromise = usePromiseTracker({ area: "editSchedule" }).promiseInProgress;

    return (
        <div className="modal-backdrop show">
            <div className="modal-wrapper-container">
                <div className={`standard-modal xxl-width`}>
                    <div className="standard-modal-title">
                        <h3>Create a schedule</h3>

                        <button 
                            className="close-modal-button"
                            onClick={closeModal}
                            disabled={editSchedulePromise}
                        />
                    </div>

                    <div className="standard-modal-body">
                        <h3>{user.name}</h3>
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
                                                                    options={scheduleDetails.timeOptions.hours.map(hour => {
                                                                        return { value: hour.split(":")[0] }
                                                                    })}
                                                                    labelField={"value"}
                                                                    values={[{ value: line.startTime.split(":")[0] }]}
                                                                    placeholder="-"
                                                                    multi={false}
                                                                    backspaceDelete={false}
                                                                    searchable={false}
                                                                    onChange={(e) => handleChangeScheduleTimings(e, i, 'startTime:hour')}
                                                                    disabled={editSchedulePromise}
                                                                />
                                                                :
                                                                {/* Minutes */}
                                                                <Select
                                                                    className={`standard-select mini ${errors[`${i}_startTime`] || errors[`${i}_invalid`] ? 'error' : ''}`}
                                                                    style={{ width: 60 }}
                                                                    options={scheduleDetails.timeOptions.minutes.map(minute => {
                                                                        return { value: minute }
                                                                    })}
                                                                    labelField={"value"}
                                                                    values={[{ value: line.startTime.split(":")[1] }]}
                                                                    placeholder="-"
                                                                    multi={false}
                                                                    backspaceDelete={false}
                                                                    searchable={false}
                                                                    onChange={(e) => handleChangeScheduleTimings(e, i, 'startTime:minute')}
                                                                    disabled={editSchedulePromise}
                                                                />
                                                            </div>
                                                        </td>

                                                        <td>
                                                            <div className="time-select-wrapper">
                                                                {/* Hours */}
                                                                <Select
                                                                    className={`standard-select mini ${errors[`${i}_endTime`] || errors[`${i}_invalid`] ? 'error' : ''}`}
                                                                    style={{ width: 60 }}
                                                                    options={scheduleDetails.timeOptions.hours.map(hour => {
                                                                        return { value: hour.split(":")[0] }
                                                                    })}
                                                                    labelField={"value"}
                                                                    values={[{ value: line.endTime.split(":")[0] }]}
                                                                    placeholder="-"
                                                                    multi={false}
                                                                    backspaceDelete={false}
                                                                    searchable={false}
                                                                    onChange={(e) => handleChangeScheduleTimings(e, i, 'endTime:hour')}
                                                                    disabled={editSchedulePromise}
                                                                />
                                                                :
                                                                {/* Minutes */}
                                                                <Select
                                                                    className={`standard-select mini ${errors[`${i}_endTime`] || errors[`${i}_invalid`] ? 'error' : ''}`}
                                                                    style={{ width: 60 }}
                                                                    options={scheduleDetails.timeOptions.minutes.map(minute => {
                                                                        return { value: minute }
                                                                    })}
                                                                    labelField={"value"}
                                                                    values={[{ value: line.endTime.split(":")[1] }]}
                                                                    placeholder="-"
                                                                    multi={false}
                                                                    backspaceDelete={false}
                                                                    searchable={false}
                                                                    onChange={(e) => handleChangeScheduleTimings(e, i, 'endTime:minute')}
                                                                    disabled={editSchedulePromise}
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
                                                                disabled={editSchedulePromise}
                                                            />
                                                        </td>

                                                        <td>
                                                            {
                                                                i > 0 ? (
                                                                    <button
                                                                        style={{marginLeft: 5}}
                                                                        className="remove-button"
                                                                        onClick={(e) => handleRemoveScheduleLine(e, i)}
                                                                        disabled={editSchedulePromise}
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
                                disabled={editSchedulePromise}
                            >Add new row <i className="fa-solid fa-plus"/></button>
                        </center>
                    </div>

                    <div className="standard-modal-footer">
                        <button 
                            className="standard-button green"
                            onClick={handleSubmitSchedule}
                            disabled={editSchedulePromise}
                        >Save schedule</button>
                    </div>

                    {
                            editSchedulePromise || errors.error ? (
                                <div className="standard-modal-additional-info">
                                    <InlinePromiseTracker
                                        searchArea="editSchedule"
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
                </div>
            </div>
        </div>
    )
}

export default EditSchedule