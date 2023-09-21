import axios from "axios";
import axiosRetry from "axios-retry";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react"
import { trackPromise } from "react-promise-tracker";
import { useDispatch, useSelector } from "react-redux";
import { Tooltip } from "react-tooltip";
import DecisionWindow from "../../../../components/decisionWindow/decisionWindow";
import { setSchedule } from "../../../../store/features/schedules/schedule";
import { setSchedulePart } from "../../../../store/features/schedules/schedulePart";
import { RootState } from "../../../../store/store";
import { SuccessResponse } from "../../../../types.config";
import AddSchedulePart from "../../actions/addSchedulePart/addSchedulePart";
import CreateSchedule from "../../actions/createSchedule/createSchedule";
import DuplicateSchedule from "../../actions/duplicateSchedule/duplicateSchedule";
import EditSchedule from "../../actions/editSchedule/editSchedule";
import RepeatSchedule from "../../actions/repeatSchedule/repeatSchedule";
import ViewSchedulePart from "../../actions/viewSchedulePart/viewSchedulePart";

import "./scheduleColumn-styles.scss";

axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

interface Timeframe {
    from: string,
    to: string
}

export interface Schedule {
    submitted: boolean,
    member: {
        name: string,
        emailAddress: string,
        _id: string,
        role: string
    },
    schedule: {
        [key: string]: string
    }[]
}

export interface SchedulePartInteraction {
    action?: string,
    startTime: string,
    slots?: number,
    coordinates: { x: number, y: number }
}

const ScheduleColumn: React.FC<{
    user: { _id: string, name: string, role: string }
}> = ({ user }): JSX.Element => {
    const userDetails = useSelector((state: RootState) => state.userAuthentication);
    const scheduleDetails = useSelector((state: RootState) => state.schedule)
    const schedule = (scheduleDetails.schedules.find(s => s.member._id === user._id) as Schedule);
    const schedulePartDetails = useSelector((state: RootState) => state.schedulePart);

    const dispatch = useDispatch();

    const [showCreateSchedule, setShowCreateSchedule] = useState<boolean>(false);

    const [showDecisionDeleteSchedule, setShowDecisionDeleteSchedule] = useState<boolean>(false);
    const [showDuplicateSchedule, setShowDuplicateSchedule] = useState<boolean>(false);
    
    const [deleteScheduleErrorMessage, setDeleteScheduleErrorMessage] = useState<string>("");

    const [showEditSchedule, setShowEditSchedule] = useState<boolean>(false);

    const [showRepeatSchedule, setShowRepeatSchedule] = useState<boolean>(false);

    const handleShowCreateSchedule = (e: React.FormEvent<HTMLDivElement>) => {
        e.preventDefault();

        if(schedule.submitted === false) {
            setShowCreateSchedule(true)
        }
    }

    const printScheduleTimeslots = (): JSX.Element[] => {
        let jsx: JSX.Element[] = [];

        if(schedule.schedule) {
            let prev: { index: number, action: string } = { index: -1, action: "-"};

            let slotSegments: { action: string, slots: number, startTime: string }[] = [];
            const timeslots = scheduleDetails.timeOptions.slots;

            for (let i = 0; i < timeslots.length - 1; i++) {
                const timeslot = timeslots[i];
                const scheduleTimeslot = schedule.schedule.find(s => s.time === timeslot);

                if(scheduleTimeslot) {
                    if(prev.action === scheduleTimeslot.action) {
                        slotSegments[prev.index].slots += 1;
                    } else {
                        slotSegments.push({ action: scheduleTimeslot.action, slots: 1, startTime: timeslot });
                        prev = { index: slotSegments.length - 1, action: scheduleTimeslot.action }
                    }
                } else {
                    slotSegments.push({ action: "-", slots: 1, startTime: timeslot })
                    prev = { index: slotSegments.length - 1, action: "-"}
                }
            }

            slotSegments.forEach(segment => {
                if(segment.action === "-") {
                    jsx.push(
                        <div 
                            className={`schedule-item blank ${segment.startTime === schedulePartDetails.startTime && user._id === schedulePartDetails.user._id ? 'active' : ''}`}
                            onClick={e => {
                                const containerDimensions = document.querySelector("#schedule-columns-wrapper");
                                    
                                const containerWidth = containerDimensions?.clientWidth || 0

                                const screenWidth = window.innerWidth;
                                const sidePadding = (screenWidth - containerWidth) / 2

                                dispatch(setSchedulePart({
                                    showAdd: true,
                                    startTime: segment.startTime,
                                    user: {
                                        _id: user._id,
                                        name: user.name
                                    },
                                    coordinates: {
                                        x: e.pageX - sidePadding - 40,
                                        y: e.pageY - 280
                                    }
                                }))
                            }}
                        >
                            Add +
                        </div>
                    )
                } else {
                    let endTime: Date | string = new Date(`2023-02-02T${segment.startTime}:00.000`);
                    endTime.setMinutes(endTime.getMinutes() + ( segment.slots * 15 ))
                    endTime = new Date(endTime).toTimeString().substring(0, 5)

                    jsx.push(
                        <div 
                            className="schedule-item fill" 
                            style={{height: 25 * segment.slots, backgroundColor: scheduleDetails.teamActions[segment.action]}}
                            onClick={(e) => {
                                if(schedulePartDetails.showView === false) {
                                    const containerDimensions = document.querySelector("#schedule-columns-wrapper");
                                    
                                    const containerWidth = containerDimensions?.clientWidth || 0

                                    const screenWidth = window.innerWidth;
                                    const sidePadding = (screenWidth - containerWidth) / 2

                                    dispatch(setSchedulePart({
                                        showView: true,
                                        action: segment.action,
                                        user: {
                                            _id: user._id,
                                            name: user.name
                                        },
                                        startTime: segment.startTime,
                                        endTime: (endTime as string),
                                        slots: segment.slots,
                                        coordinates: {
                                            x: e.pageX - sidePadding - 40,
                                            y: e.pageY - 280
                                        }
                                    }))
                                }
                            }}
                        >
                            {segment.action}
                        </div>
                    )
                }
            })
        }

        return jsx
    }

    const handleDeleteSchedule = async (e: React.FormEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();

        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "DELETE",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/schedules/${scheduleDetails.team._id}/${user._id}`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    },
                    data: {
                        scheduleId: scheduleDetails._id
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        // Update existing state
                        let allSchedules = Array.from(scheduleDetails.schedules);
                        const deleteIndex = allSchedules.findIndex(i => i.member._id === user._id);

                        const newSchedule = { ...scheduleDetails.schedules[deleteIndex] }

                        allSchedules[deleteIndex] = {
                            ...allSchedules[deleteIndex],
                            schedule: [],
                            submitted: false
                        }

                        dispatch(setSchedule({
                            schedules: allSchedules
                        }))

                        setShowDecisionDeleteSchedule(false)

                        resolve();
                    } else {
                        setDeleteScheduleErrorMessage(response.reason || "")
                        resolve();
                    }
                })
                .catch(() => {
                    setDeleteScheduleErrorMessage("Oops, there was a technical error, please try again")
                    resolve();
                })
            })
        , "deleteSchedule")
    }

    return (
        <React.Fragment>
            <div className="schedule-column">
                <label
                    className={scheduleDetails.expandSchedule === user._id ? "expanded" : ""}
                    onClick={() => {
                        dispatch(setSchedule({
                            expandSchedule: scheduleDetails.expandSchedule === user._id ? "" : user._id
                        }))
                    }}
                >{schedule.member.name}</label>
                
                <div 
                    className={`schedule-column-options-wrapper ${scheduleDetails.expandSchedule !== "" ? "open" : ""} ${scheduleDetails.expandSchedule === user._id ? 'active' : ''}`}
                    onMouseEnter={() => {
                        dispatch(setSchedule({
                            expandSchedule: user._id
                        }))
                    }}
                >
                    {/* -- Delete -- */}
                    <Tooltip id={`${user._id}-bin`}>
                        <p style={{color: "#FFF", maxWidth: 200}}>Delete this schedule entry</p>
                    </Tooltip>
                    <button
                        className="bin-button"
                        data-tooltip-id={`${user._id}-bin`}
                        onClick={() => setShowDecisionDeleteSchedule(true)}
                        disabled={!schedule.submitted}
                    />

                    {/* -- Edit -- */}
                    <Tooltip id={`${user._id}-edit`}>
                        <p style={{color: "#FFF", maxWidth: 200}}>Edit this schedule entry</p>
                    </Tooltip>
                    <button
                        className="edit-button"
                        data-tooltip-id={`${user._id}-edit`}
                        onClick={() => setShowEditSchedule(true)}
                        disabled={!schedule.submitted}
                    />

                    {/* -- Repeat -- */}
                    <Tooltip id={`${user._id}-repeat`}>
                        <p style={{color: "#FFF", maxWidth: 200}}>Repeat this schedule entry</p>
                    </Tooltip>
                    <button
                        className="repeat-button"
                        data-tooltip-id={`${user._id}-repeat`}
                        onClick={() => setShowRepeatSchedule(true)}
                        disabled={!schedule.submitted}
                    />

                    {/* -- Copy -- */}
                    <Tooltip id={`${user._id}-copy`}>
                        <p style={{color: "#FFF", maxWidth: 200}}>Copy this schedule entry</p>
                    </Tooltip>
                    <button
                        className="copy-button"
                        data-tooltip-id={`${user._id}-copy`}
                        onClick={() => setShowDuplicateSchedule(true)}
                        disabled={!schedule.submitted}
                    />
                </div>

                <div className={`schedule-column-contents ${schedule.submitted ? '' : 'blank'}`} style={ !schedule.submitted ? { height: (scheduleDetails.timeOptions.slots.length - 1) * 25 }: { }} onClick={handleShowCreateSchedule}>
                    {
                        schedule.submitted ? (
                            printScheduleTimeslots()
                        ) : "Create schedule"
                    }
                </div>
            </div>
            
            {
                showCreateSchedule ? (
                    <CreateSchedule
                        memberDetails={schedule.member}
                        closeModal={setShowCreateSchedule}
                    />
                ) : null
            }

            {
                schedulePartDetails.showView && schedulePartDetails.user._id === user._id ? (
                    <ViewSchedulePart />
                ) : null
            }

            {
                schedulePartDetails.showAdd && schedulePartDetails.user._id === user._id ? (
                    <AddSchedulePart />
                ) : null
            }

            {
                showDecisionDeleteSchedule ? (
                    <DecisionWindow
                        title="Delete this schedule entry?"
                        bodyJsx={[
                            <p className="secondary-text">Delete {user.name}'s schedule entry for {new Date(scheduleDetails.date).toLocaleDateString()}</p>
                        ]}
                        acceptFunction={handleDeleteSchedule}
                        acceptButtonText="Confirm"
                        searchArea="deleteSchedule"
                        errorMessage={deleteScheduleErrorMessage}
                        closeModal={() => setShowDecisionDeleteSchedule(false)}
                    />
                ) : null
            }

            {
                showDuplicateSchedule ? (
                    <DuplicateSchedule
                        user={user}
                        closeModal={() => setShowDuplicateSchedule(false)}
                    />
                ) : null
            }

            {
                showEditSchedule ? (
                    <EditSchedule
                        user={user}
                        closeModal={() => setShowEditSchedule(false)}
                    />
                ) : null
            }

            {
                showRepeatSchedule ? (
                    <RepeatSchedule
                        user={user}
                        closeModal={() => setShowRepeatSchedule(false)}
                    />
                ) : null
            }
        </React.Fragment>
    )
}

export default ScheduleColumn