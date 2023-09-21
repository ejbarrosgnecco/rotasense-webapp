import axios from "axios";
import axiosRetry from "axios-retry";
import React, { useEffect, useRef, useState } from "react";
import Select from "react-dropdown-select";
import { trackPromise, usePromiseTracker } from "react-promise-tracker";
import { useDispatch, useSelector } from "react-redux";
import DecisionWindow from "../../../../components/decisionWindow/decisionWindow";
import ErrorMessage from "../../../../components/error/error";
import toastNotification from "../../../../components/toastNotifications/toastNotifications";
import { setSchedule } from "../../../../store/features/schedules/schedule";
import schedulePart, { setSchedulePart } from "../../../../store/features/schedules/schedulePart";
import { RootState } from "../../../../store/store";
import { SuccessResponse } from "../../../../types.config";

import "./viewSchedulePart-styles.scss";

axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

const ViewSchedulePart: React.FC = (): JSX.Element => {
    const userDetails = useSelector((state: RootState) => state.userAuthentication)
    const scheduleDetails = useSelector((state: RootState) => state.schedule)
    const schedulePartDetails = useSelector((state: RootState) => state.schedulePart)

    const modalRef = useRef(null);
    const dispatch = useDispatch();

    const [actionTimings, setActionTimings] = useState<{ startTime: string, endTime: string}>({
        startTime: schedulePartDetails.startTime,
        endTime: new Date(new Date(`2023-02-02T${schedulePartDetails.startTime}:00.000`).setMinutes(new Date(`2023-02-02T${schedulePartDetails.startTime}:00.000`).getMinutes() + (schedulePartDetails.slots * 15))).toTimeString().substring(0, 5)
    })

    const [availableActions, setAvailableActions] = useState<string[]>([])

    const [showDecisionDeletePart, setShowDeicisionDeletePart] = useState<boolean>(false);
    const [deleteErrorMessage, setDeleteErrorMessage] = useState<string>("");

    const [editMode, setEditMode] = useState<boolean>(false);
    const [editValues, setEditValues] = useState({
        startTime: "",
        endTime: "",
        action: ""
    })

    const [errorMessage, setErrorMessage] = useState<string>("")
    const [errors, setErrors] = useState({
        startTime: false,
        endTime: false,
        invalid: false,
        action: false,
        error: false
    })

    const handleClickOutside = (e: any) => {
        e.preventDefault();

        const parent = document.getElementById("view-part-modal");

        if(e.target !== parent && !parent?.contains(e.target)) {
            document.removeEventListener("mousedown", handleClickOutside)
            dispatch(setSchedulePart({
                showView: false
            }))
        }
    }

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
                        orgId: userDetails.organisation._id,
                        role: schedulePartDetails.user.role
                    }
                })
                .then((value: { data: SuccessResponse}) => {
                    const response = value.data;

                    if(response.success === true) {
                        setAvailableActions(response.data.map((action: { action: string, color: string}) => {
                            return action.action
                        }));

                        resolve()
                    } else {
                        toastNotification({
                            type: "bad",
                            text: response.reason || ""
                        })

                        resolve()
                    }
                })
                .catch(() => {
                    toastNotification({
                        type: "bad",
                        text: "Oops, there was a technical error retrieving schedule actions, please try again"
                    })

                    resolve();
                })
            })
        , 'getActions')
    }

    useEffect(() => {
        if(availableActions.length === 0) {
            getAvailableActions();
        }
    }, [])

    const handleResetEditMode = (e: React.FormEvent<HTMLButtonElement>): void => {
        setEditValues({
            startTime: "",
            endTime: "",
            action: ""
        })

        setErrors({
            startTime: false,
            endTime: false,
            invalid: false,
            action: false,
            error: false
        })

        setEditMode(false);
    }

    const handleStartEditMode = (e: React.FormEvent<HTMLButtonElement>): void => {
      setEditValues({
        startTime: actionTimings.startTime,
        endTime: actionTimings.endTime,
        action: schedulePartDetails.action
      })

      setEditMode(true)
    }

    const handleEditTimes = (e: { value: string }[], key: string): void => {
        const value = e[0].value;

        const keyName = key.split(":")[0];
        const keyPart = key.split(":")[1];

        const parts = ["hour", "minute"];

        let prevValue = (editValues as any)[keyName].split(":");
        prevValue[parts.indexOf(keyPart)] = value;
        prevValue = prevValue.join(":")

        setEditValues({
            ...editValues,
            [keyName]: prevValue
        })
    }

    const handleDeleteSchedulePart = async (e: React.FormEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();
        
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "DELETE",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/schedules/${scheduleDetails.team._id}/${schedulePartDetails.user._id}/part`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    },
                    data: {
                        scheduleId: scheduleDetails._id,
                        startTime: schedulePartDetails.startTime,
                        endTime: schedulePartDetails.endTime,
                        action: schedulePartDetails.action
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        // Update existing state
                        let allSchedules = Array.from(scheduleDetails.schedules);
                        const editIndex = allSchedules.findIndex(i => i.member._id === schedulePartDetails.user._id);

                        const newSchedule = { ...scheduleDetails.schedules[editIndex] }
                        let newArray = [ ...newSchedule?.schedule || [] ];

                        newArray = newArray.filter(slot => {
                            return !(
                                new Date(`2023-02-02T${slot.time}:00.000`) >= new Date(`2023-02-02T${schedulePartDetails.startTime}:00.000`)
                                &&
                                new Date(`2023-02-02T${slot.time}:00.000`) < new Date(`2023-02-02T${schedulePartDetails.endTime}:00.000`)
                                &&
                                slot.action === schedulePartDetails.action
                            )
                        })

                        allSchedules[editIndex] = {
                            ...allSchedules[editIndex],
                            schedule: newArray
                        }

                        if(newArray.length === 0) {
                            allSchedules[editIndex] = {
                                ...allSchedules[editIndex],
                                submitted: false
                            }
                        }

                        dispatch(setSchedule({
                            schedules: allSchedules
                        }))

                        dispatch(setSchedulePart({
                            showView: false,
                            startTime: ""
                        }))

                        resolve();
                    } else {
                        setDeleteErrorMessage(response.reason || "")
                        resolve();
                    }
                })
                .catch(() => {
                    setDeleteErrorMessage("Oops, there was a technical error, please try again")
                    resolve();
                })
            })
        , 'deletePart')
    }

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside)
    }, [])

    const handleDataValidation = (): boolean => {
        let errorsCount: number = 0;
        let errorsObject: { [key: string]: boolean } = {};

        let timesValid: boolean = true;

        if(editValues.action === "") {
            errorsCount++;
            errorsObject.action = true;
        }

        // Check that all times & actions are valid
        if(/^([0-9]{2})+:+([0-9]{2})$/.test(editValues.startTime) === false) {
            errorsCount++;
            errorsObject.startTime = true;
        }

        if(/^([0-9]{2})+:+([0-9]{2})$/.test(editValues.endTime) === false) {
            errorsCount++;
            errorsObject.endTime = true;
        }

         // Check that from < to
         if (timesValid === true) {
            if(new Date(`2023-02-02T${editValues.startTime}:00.000`) > new Date(`2023-02-02T${editValues.endTime}:00.000`)) {
                errorsCount++;
                errorsObject.invalid = true;
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

    const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();

        if(handleDataValidation() === true) {
            // If values remain unchanged
            if ( editValues.startTime === actionTimings.startTime &&
                 editValues.endTime === actionTimings.endTime &&
                 editValues.action === schedulePartDetails.action ) {
                handleResetEditMode(e);
            } else {
                // Proceed to make change
                trackPromise(
                    new Promise<void>( async (resolve) => {
                        await axios({
                            method: "PUT",
                            url: process.env.REACT_APP_BACKEND_BASE_URL + `/schedules/${scheduleDetails.team._id}/${schedulePartDetails.user._id}/part`,
                            headers: {
                                Authorization: "Bearer " + userDetails.accessToken
                            },
                            data: {
                                scheduleId: scheduleDetails._id,
                                prevSlot: {
                                    startTime: actionTimings.startTime,
                                    endTime: actionTimings.endTime,
                                    action: schedulePartDetails.action
                                },
                                newSlot: {
                                    startTime: editValues.startTime,
                                    endTime: editValues.endTime,
                                    action: editValues.action
                                }
                            }
                        })
                        .then((value: { data: SuccessResponse }) => {
                            const response = value.data;

                            if(response.success === true) {
                                // Update existing state
                                let allSchedules = Array.from(scheduleDetails.schedules)
                                const editIndex = allSchedules.findIndex(i => i.member._id === schedulePartDetails.user._id)

                                allSchedules[editIndex] = {
                                    ...allSchedules[editIndex],
                                    schedule: response.data.amendedSchedule
                                }

                                dispatch(setSchedule({
                                    schedules: allSchedules
                                }))

                                dispatch(setSchedulePart({
                                    action: editValues.action,
                                    startTime: editValues.startTime,
                                    endTime: editValues.endTime,
                                    slots: response.data.newSlots
                                }))

                                setActionTimings({
                                    startTime: editValues.startTime,
                                    endTime: editValues.endTime
                                })
                                
                                handleResetEditMode(e)

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
                , "editSchedulePart")
            }
        }
    }

    const submitPromise = usePromiseTracker({ area: "editSchedulePart" }).promiseInProgress;
    const getActionsPromise = usePromiseTracker({ area: "getActions" }).promiseInProgress;

    return (
        <React.Fragment>
            <div className="localised-modal" id="view-part-modal" ref={modalRef} style={{ left: schedulePartDetails.coordinates.x, top: schedulePartDetails.coordinates.y }}>
                <div className="localised-modal-header">
                    {
                        editMode ? (
                            <p style={{color: "#F58634"}}>Editing...</p>
                        ) : <br/>
                    }

                    <button
                        className="close-modal-button"
                        disabled={submitPromise}
                        onClick={() => {
                            dispatch(setSchedulePart({
                                showView: false
                            }))
                        }}
                    />
                </div>

                <div className="localised-modal-body">
                    <div className={`schedule-part-edit-columns ${editMode ? 'edit' : ""}`}>
                        <div>
                            {
                                editMode ? (
                                    <Select
                                        className="standard-select mini"
                                        options={availableActions.map(action => {
                                            return { value: action }
                                        })}
                                        labelField="value"
                                        values={[{ value: editValues.action }]}
                                        placeholder="Select an action"
                                        multi={false}
                                        backspaceDelete={false}
                                        searchable={false}
                                        additionalProps={{
                                            id: "local-modal-edit",
                                            itemID: "local-modal-edit"
                                        }}
                                        loading={getActionsPromise}
                                        disabled={submitPromise || getActionsPromise}
                                        onChange={(e) => {
                                            setEditValues({
                                                ...editValues,
                                                action: e[0].value
                                            })

                                            setErrors({
                                                ...errors,
                                                action: false,
                                                error: false
                                            })
                                        }}
                                    />
                                ) : (
                                    <h4>{schedulePartDetails.action}</h4>
                                )
                            }

                            {
                                editMode ? (
                                    <React.Fragment>
                                        <table className="structural-table" style={{borderSpacing: 5, marginTop: 10}}>
                                            <tbody>
                                                <tr>
                                                    <td style={{textAlign: 'center'}}>From</td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <div className="time-select-wrapper">
                                                            {/* Hours */}
                                                            <Select
                                                                className={`standard-select mini ${errors.startTime || errors.invalid ? 'error' : ''}`}
                                                                style={{ width: 60 }}
                                                                options={scheduleDetails.timeOptions.hours.map((hour) => {
                                                                    return { value: hour.split(":")[0] }
                                                                })}
                                                                labelField={"value"}
                                                                values={[{ value: editValues.startTime.split(":")[0] }]}
                                                                placeholder="-"
                                                                multi={false}
                                                                backspaceDelete={false}
                                                                searchable={false}
                                                                disabled={submitPromise}
                                                                onChange={(e) => {
                                                                    handleEditTimes(e, 'startTime:hour')
                                                                    setErrors({
                                                                        ...errors,
                                                                        startTime: false,
                                                                        error: false
                                                                    })
                                                                }}
                                                            />
                                                            :
                                                            {/* Minutes */}
                                                            <Select
                                                                className={`standard-select mini ${errors.startTime || errors.invalid ? 'error' : ''}`}
                                                                style={{ width: 60 }}
                                                                options={scheduleDetails.timeOptions.minutes.map(minute => {
                                                                    return { value: minute }
                                                                })}
                                                                labelField={"value"}
                                                                values={[{ value: editValues.startTime.split(":")[1] }]}
                                                                placeholder="-"
                                                                multi={false}
                                                                backspaceDelete={false}
                                                                searchable={false}
                                                                disabled={submitPromise}
                                                                onChange={(e) => {
                                                                    handleEditTimes(e, 'startTime:minute')
                                                                    setErrors({
                                                                        ...errors,
                                                                        startTime: false,
                                                                        error: false
                                                                    })
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style={{textAlign: 'center', paddingTop: 10}}>To</td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <div className="time-select-wrapper">
                                                            {/* Hours */}
                                                            <Select
                                                                className={`standard-select mini ${errors.endTime || errors.invalid ? 'error' : ''}`}
                                                                style={{ width: 60 }}
                                                                options={scheduleDetails.timeOptions.hours.map((hour) => {
                                                                    return { value: hour.split(":")[0] }
                                                                })}
                                                                labelField={"value"}
                                                                values={[{ value: editValues.endTime.split(":")[0] }]}
                                                                placeholder="-"
                                                                multi={false}
                                                                backspaceDelete={false}
                                                                searchable={false}
                                                                disabled={submitPromise}
                                                                onChange={(e) => {
                                                                    handleEditTimes(e, 'endTime:hour');
                                                                    setErrors({
                                                                        ...errors,
                                                                        endTime: false,
                                                                        error: false
                                                                    })
                                                                }}
                                                            />
                                                            :
                                                            {/* Minutes */}
                                                            <Select
                                                                className={`standard-select mini ${errors.endTime || errors.invalid ? 'error' : ''}`}
                                                                style={{ width: 60 }}
                                                                options={scheduleDetails.timeOptions.minutes.map(minute => {
                                                                    return { value: minute }
                                                                })}
                                                                labelField={"value"}
                                                                values={[{ value: editValues.endTime.split(":")[1] }]}
                                                                placeholder="-"
                                                                multi={false}
                                                                backspaceDelete={false}
                                                                searchable={false}
                                                                disabled={submitPromise}
                                                                onChange={(e) => {
                                                                    handleEditTimes(e, 'endTime:minute');
                                                                    setErrors({
                                                                        ...errors,
                                                                        endTime: false,
                                                                        error: false
                                                                    })
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {
                                            errors.invalid ? (
                                                <ErrorMessage
                                                    message="Please enter a valid time period"
                                                />
                                            ) : null
                                        }
                                    </React.Fragment>
                                ) : (
                                    <p style={{margin: "5px 0"}}>{actionTimings.startTime} - {actionTimings.endTime}</p>
                                )
                            }

                            {
                                errors.error && !submitPromise ? (
                                    <ErrorMessage
                                        message={errorMessage}
                                    />
                                ) : null
                            }
                        </div>

                        <span style={{ display: 'grid' }}>

                        {
                            !editMode ? (
                                <button
                                    style={{justifySelf: "flex-end"}}
                                    className="edit-button"
                                    onClick={handleStartEditMode}
                                    disabled={submitPromise}
                                >Edit</button>
                            ) : null
                        }

                        {
                            !editMode ? (
                                <button
                                    className="bin-button"
                                    style={{ fontSize: 16, justifySelf: "flex-end", marginTop: 5 }}
                                    disabled={submitPromise}
                                    onClick={() => setShowDeicisionDeletePart(true)}
                                >Delete&nbsp;</button>
                            ) : null
                        }

                        </span>
                    </div>
                </div>

                {
                    editMode ? (
                        <div className="localised-modal-footer">
                            <button 
                                className="plain-text-link"
                                onClick={handleResetEditMode}
                                disabled={submitPromise}
                            >Cancel</button>

                            <button
                                className="standard-button mini green"
                                onClick={handleSubmit}
                                disabled={submitPromise}
                            >Save</button>
                        </div>
                    ) : null
                }

                {
                    showDecisionDeletePart ? (
                        <DecisionWindow
                            title="Delete schedule part"
                            bodyJsx={[
                                <p>Are you sure you'd like to delete "{schedulePartDetails.action}" on {schedulePartDetails.user.name}'s schedule between {schedulePartDetails.startTime} - {schedulePartDetails.endTime}?</p>
                            ]}
                            acceptFunction={handleDeleteSchedulePart}
                            acceptButtonText="Confirm"
                            searchArea="deletePart"
                            closeModal={() => setShowDeicisionDeletePart(false)}
                            errorMessage={deleteErrorMessage}
                        />
                    ) : null
                }
            </div>
        </React.Fragment>
    )
}

export default ViewSchedulePart