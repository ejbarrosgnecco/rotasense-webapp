import React, { useEffect, useState } from "react"
import ScheduleColumn from "../components/scheduleColumn/scheduleColumn"

import "./manage-styles.scss"

const ManageSchedules: React.FC = (): JSX.Element => {
    const [timeframe, setTimeframe] = useState({
        from: "08:00",
        to: "20:00"
    })

    const [hours, setHours] = useState<string[]>([])
    const [timeslots, setTimeslots] = useState<string[]>([])

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
    }, [])

    const [teamMembers, setTeamMemebers] = useState([1])

    return (
        <div className="schedule-column-wrapper">
            <ul className="schedule-side-timeslot-container">
                {hours.map(hour => (
                    <li>{hour}</li>
                ))}    
            </ul>

            {teamMembers.map((member, index) => (
                <ScheduleColumn
                    timeframe={timeframe}
                />
            ))}
        </div>
    )
}

export default ManageSchedules