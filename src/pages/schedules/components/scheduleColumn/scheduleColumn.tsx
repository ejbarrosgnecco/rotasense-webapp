import React, { useEffect, useState } from "react"
import CreateSchedule from "../../actions/createSchedule/createSchedule";
import ViewSchedulePart from "../../actions/viewSchedulePart/viewSchedulePart";

import "./scheduleColumn-styles.scss";

interface Timeframe {
    from: string,
    to: string
}

export interface Schedule {
    submitted: boolean,
    member: {
        name: string,
        email_address: string,
        _id: string,
        role: string
    },
    schedule: {
        [key: string]: string
    }[]
}

const ScheduleColumn: React.FC<{
    date: string,
    timeframe: Timeframe,
    teamId: string,
    scheduleId?: string,
    schedule: Schedule,
    timeslots: string[],
    availableActions: { [key: string]: string },
    availableHours: string[]
}> = ({ date, teamId, scheduleId, timeframe, schedule, timeslots, availableActions, availableHours }): JSX.Element => {
    const [showCreateSchedule, setShowCreateSchedule] = useState<boolean>(false);
    
    const [showSchedulePart, setShowSchedulePart] = useState<boolean>(false);
    const [schedulePart, setSchedulePart] = useState<{ action: string, startTime: string, slots: number, coordinates: { x: number, y: number }}>({
        action: "",
        startTime: "",
        slots: 1,
        coordinates: {
            x: 0,
            y: 0
        }
    })

    const handleShowCreateSchedule = (e: React.FormEvent<HTMLDivElement>) => {
        e.preventDefault();

        if(schedule.submitted === false) {
            setShowCreateSchedule(true)
        }
    }

    const handleHideSchedulePart = (): void => {
        setShowSchedulePart(false);
        setSchedulePart({
            action: "",
            startTime: "",
            slots: 1,
            coordinates: {
                x: 0,
                y: 0
            }
        })
    }

    const printScheduleTimeslots = (): JSX.Element[] => {
        let jsx: JSX.Element[] = [];

        if(schedule.schedule) {
            let prev: { index: number, action: string } = { index: -1, action: "-"};

            let slotSegments: { action: string, slots: number, startTime: string }[] = [];

            for (let i = 0; i < timeslots.length; i++) {
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
                        <div className="schedule-item blank">
                            Add +
                        </div>
                    )
                } else {
                    jsx.push(
                        <div 
                            className="schedule-item fill" 
                            style={{height: 25 * segment.slots, backgroundColor: availableActions[segment.action]}}
                            onClick={(e) => {
                                if(showSchedulePart === false) {
                                    const containerDimensions = document.querySelector("#schedule-columns-wrapper");
                                    
                                    const containerWidth = containerDimensions?.clientWidth || 0

                                    const screenWidth = window.innerWidth;
                                    const sidePadding = (screenWidth - containerWidth) / 2

                                    console.log(e)

                                    setSchedulePart({
                                        action: segment.action,
                                        startTime: segment.startTime,
                                        slots: segment.slots,
                                        coordinates: {
                                            x: e.pageX - sidePadding - 40,
                                            y: e.pageY - 280
                                        }
                                    })
    
                                    setShowSchedulePart(true)
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

    return (
        <React.Fragment>
            <div className="schedule-column">
                <label>{schedule.member.name}</label>

                <div className={`schedule-column-contents ${schedule.submitted ? '' : 'blank'}`} style={ !schedule.submitted ? { height: timeslots.length * 25}: { }} onClick={handleShowCreateSchedule}>
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
                        date={date}
                        timeframe={timeframe}
                        teamId={teamId}
                        memberDetails={schedule.member}
                        closeModal={setShowCreateSchedule}
                        scheduleId={scheduleId}
                    />
                ) : null
            }

            {
                showSchedulePart ? (
                    <ViewSchedulePart
                        scheduleId={scheduleId || ""}
                        schedulePart={schedulePart}
                        hideSchedulePart={handleHideSchedulePart}
                        availableActions={Object.keys(availableActions)}
                        availableHours={availableHours}
                    />
                ) : null
            }
        </React.Fragment>
    )
}

export default ScheduleColumn