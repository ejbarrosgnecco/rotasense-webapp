import axios from "axios";
import axiosRetry from "axios-retry";
import React, { useEffect, useRef, useState } from "react"
import Select from "react-dropdown-select";
import { trackPromise, usePromiseTracker } from "react-promise-tracker";
import { useDispatch, useSelector } from "react-redux";
import ErrorMessage from "../../../../components/error/error";
import InlinePromiseTracker from "../../../../components/promiseTrackers/inlineTracker";
import toastNotification from "../../../../components/toastNotifications/toastNotifications";
import { setSchedule } from "../../../../store/features/schedules/schedule";
import { setSchedulePart } from "../../../../store/features/schedules/schedulePart";
import { RootState } from "../../../../store/store";
import { SuccessResponse } from "../../../../types.config";

import "../viewSchedulePart/viewSchedulePart-styles.scss";

axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

const AddSchedulePart: React.FC = (): JSX.Element => {
    const modalRef = useRef(null);
    const userDetails = useSelector((state: RootState) => state.userAuthentication);
    const scheduleDetails = useSelector((state: RootState) => state.schedule);
    const schedulePartDetails = useSelector((state: RootState) => state.schedulePart);

    const dispatch = useDispatch();

    const [errorMessage, setErrorMessage] = useState<string>("")
    const [errors, setErrors] = useState({
        action: false,
        startTime: false,
        endTime: false,
        invalidTime: false,
        error: false
    })

    const [availableMinutes, setAvailableMinutes] = useState<string[]>(["00", "15", "30", "45"]);
    const [availableActions, setAvailableActions] = useState<string[]>([]);

    const [newSchedulePart, setNewSchedulePart] = useState({
        action: "",
        startTime: schedulePartDetails.startTime,
        endTime: new Date(new Date(`2023-02-02T${schedulePartDetails.startTime}:00.000Z`).setMinutes(new Date(`2023-02-02T${schedulePartDetails.startTime}:00.000Z`).getMinutes() + 15)).toTimeString().substring(0, 5)
    })

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

    const handleEditTimes = (e: { value: string }[], key: string): void => {
        const value = e[0].value;

        const keyName = key.split(":")[0];
        const keyPart = key.split(":")[1];

        const parts = ["hour", "minute"];

        let prevValue = (newSchedulePart as any)[keyName].split(":");
        prevValue[parts.indexOf(keyPart)] = value;
        prevValue = prevValue.join(":")

        setNewSchedulePart({
            ...newSchedulePart,
            [keyName]: prevValue
        })

        setErrors({
            ...errors,
            [keyName]: false,
            error: false
        })
    }

    const handleClickOutside = (e: any) => {
        const parent = document.getElementById("add-part-modal");

        if(e.target !== parent && !parent?.contains(e.target)) {
            document.removeEventListener("mousedown", handleClickOutside)
            dispatch(setSchedulePart({
                showAdd: false,
                startTime: ""
            }))
        }
    }

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        getAvailableActions();
    }, [])

    const handleDataValidation = (): boolean => {
        let errorsCount: number = 0;
        let errorsObject: { [key: string]: boolean } = {};

        let timesValid: boolean = true

        if(/^([0-9]{2})+:+([0-9]{2})$/.test(newSchedulePart.startTime) === false) {
            errorsCount++;
            errorsObject.startTime = true;
            timesValid = false
        }

        if(/^([0-9]{2})+:+([0-9]{2})$/.test(newSchedulePart.endTime) === false) {
            errorsCount++;
            errorsObject.endTime = true;
            timesValid = false
        }

        // Check that from < to
        if (timesValid === true) {
            if(new Date(`2023-02-02T${newSchedulePart.startTime}:00.000`) > new Date(`2023-02-02T${newSchedulePart.endTime}:00.000`)) {
                errorsCount++;
                errorsObject.invalidTime = true;
            }
        }

        if(newSchedulePart.action === "") {
            errorsCount++;
            errorsObject.action = true;
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
            trackPromise(
                new Promise<void>( async (resolve) => {
                    await axios({
                        method: "PUT",
                        url: process.env.REACT_APP_BACKEND_BASE_URL + `/schedules/${scheduleDetails.team._id}/${schedulePartDetails.user._id}/add-part`,
                        headers: {
                            Authorization: "Bearer " + userDetails.accessToken
                        },
                        data: {
                            scheduleId: scheduleDetails._id,
                            newPart: newSchedulePart
                        }
                    })
                    .then((value: { data: SuccessResponse }) => {
                        const response = value.data;

                        if(response.success === true) {
                            // Update existing state
                            let allSchedules = Array.from(scheduleDetails.schedules)
                            const editIndex = allSchedules.findIndex(i => i.member._id === schedulePartDetails.user._id)

                            const newSchedule = { ...scheduleDetails.schedules[editIndex] }

                            let newArray = [...newSchedule?.schedule || []]
                            
                            for (let d = new Date(`2023-02-02T${newSchedulePart.startTime}:00.000`); d < new Date(`2023-02-02T${newSchedulePart.endTime}:00.000`); d.setMinutes(d.getMinutes() + 15 ) ) {
                                newArray.push({
                                    action: newSchedulePart.action,
                                    time: d.toTimeString().substring(0, 5)
                                })
                            }

                            newArray.sort((a, b) => new Date(`2023-02-02T${a.time}:00.000`).getTime() - new Date(`2023-02-02T${b.time}:00.000`).getTime())

                            allSchedules[editIndex] = {
                                ...allSchedules[editIndex],
                                schedule: newArray
                            }

                            dispatch(setSchedule({
                                schedules: allSchedules
                            }))

                            dispatch(setSchedulePart({
                                showAdd: false,
                                startTime: ""
                            }))

                            resolve();
                        } else {
                            setErrorMessage(response.reason || "")
                            setErrors({
                                ...errors,
                                error: true
                            })

                            resolve();
                        }
                    })
                    .catch((err) => {
                        console.error(err)
                        setErrorMessage("Oops, there was a technical error, please try again")
                        setErrors({
                            ...errors,
                            error: true
                        })

                        resolve();
                    })
                })
            , "addSlot")
        }
    }

    const getActionsPromise = usePromiseTracker({ area: "getActions" }).promiseInProgress;
    const submitPartPromise = usePromiseTracker({ area: "addSlot" }).promiseInProgress;

    return (
        <div className="localised-modal" id="add-part-modal" ref={modalRef} style={{ left: schedulePartDetails.coordinates.x, top: schedulePartDetails.coordinates.y}}>
            <div className="localised-modal-header">
                <p>Add new slot</p>

                <button
                    className="close-modal-button"
                    onClick={() => {
                        dispatch(setSchedulePart({
                            showAdd: false,
                            startTime: ""
                        }))
                    }}
                />
            </div>

            <div className="localised-modal-body">
                <div className="schedule-part-edit-columns edit">
                    <div>
                        <Select
                            className={`standard-select mini ${errors.action ? "error" : ""}`}
                            options={availableActions.map(action => {
                                return { value: action }
                            })}
                            labelField="value"
                            values={ newSchedulePart.action !== "" ? [{ value: newSchedulePart.action }] : [] }
                            placeholder="Select an action"
                            multi={false}
                            backspaceDelete={false}
                            noDataLabel="No actions found"
                            searchable={false}
                            additionalProps={{
                                id: "local-modal-edit",
                                itemID: "local-modal-edit"
                            }}
                            loading={getActionsPromise}
                            disabled={getActionsPromise || submitPartPromise}
                            onChange={(e) => {
                                setNewSchedulePart({
                                    ...newSchedulePart,
                                    action: e[0].value
                                })

                                setErrors({
                                    ...errors,
                                    action: false,
                                    error: false
                                })
                            }}
                        />

                        {
                            errors.action ? (
                                <ErrorMessage
                                    message="Please enter an action"
                                />
                            ) : null
                        }
                    </div>

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
                                            className={`standard-select mini ${errors.startTime || errors.invalidTime ? "error" : ""}`}
                                            style={{ width: 60 }}
                                            options={scheduleDetails.timeOptions.hours.map((hour) => {
                                                return { value: hour.split(":")[0] }
                                            })}
                                            labelField={"value"}
                                            values={[{ value: newSchedulePart.startTime.split(":")[0] }]}
                                            placeholder="-"
                                            multi={false}
                                            backspaceDelete={false}
                                            searchable={false}
                                            onChange={(e) => handleEditTimes(e, 'startTime:hour')}
                                        />
                                        :
                                        {/* Minutes */}
                                        <Select
                                            className={`standard-select mini ${errors.startTime || errors.invalidTime ? "error" : ""}`}
                                            style={{ width: 60 }}
                                            options={availableMinutes.map(minute => {
                                                return { value: minute }
                                            })}
                                            labelField={"value"}
                                            values={[{ value: newSchedulePart.startTime.split(":")[1] }]}
                                            placeholder="-"
                                            multi={false}
                                            backspaceDelete={false}
                                            searchable={false}
                                            onChange={(e) => handleEditTimes(e, 'startTime:minute')}
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
                                            className={`standard-select mini ${errors.endTime || errors.invalidTime ? "error" : ""}`}
                                            style={{ width: 60 }}
                                            options={scheduleDetails.timeOptions.hours.map((hour) => {
                                                return { value: hour.split(":")[0] }
                                            })}
                                            labelField={"value"}
                                            values={[{ value: newSchedulePart.endTime.split(":")[0] }]}
                                            placeholder="-"
                                            multi={false}
                                            backspaceDelete={false}
                                            searchable={false}
                                            onChange={(e) => handleEditTimes(e, 'endTime:hour')}
                                        />
                                        :
                                        {/* Minutes */}
                                        <Select
                                            className={`standard-select mini ${errors.endTime || errors.invalidTime ? "error" : ""}`}
                                            style={{ width: 60 }}
                                            options={availableMinutes.map(minute => {
                                                return { value: minute }
                                            })}
                                            labelField={"value"}
                                            values={[{ value: newSchedulePart.endTime.split(":")[1] }]}
                                            placeholder="-"
                                            multi={false}
                                            backspaceDelete={false}
                                            searchable={false}
                                            onChange={(e) => handleEditTimes(e, 'endTime:minute')}
                                        />
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {
                        errors.invalidTime ? (
                            <ErrorMessage
                                message="Please enter a valid time period"
                            />
                        ) : null
                    }

                    {
                        errors.error ? (
                            <ErrorMessage
                                message={errorMessage}
                            />
                        ) : null
                    }
                </div>
            </div>

            <div className="localised-modal-footer">
                <button
                    className="standard-button mini green"
                    onClick={handleSubmit}
                >Save</button>

                <InlinePromiseTracker
                    searchArea="addSlot"
                />
            </div>
        </div>
    )
}

export default AddSchedulePart