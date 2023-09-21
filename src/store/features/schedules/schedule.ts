import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import getAllKeys from "../../utils/getAllKeys"

export interface Schedule {
    _id: string,
    department: {
        _id: string,
        name: string
    },
    team: {
        _id: string,
        name: string
    },
    timeframe: {
        from: string,
        to: string
    },
    date: string,
    timeOptions: {
        hours: string[],
        minutes: string[],
        slots: string[]
    },
    teamActions: {
        [key: string]: string
    },
    expandSchedule: string,
    schedules: {
        submitted: boolean,
        member: {
            _id: string,
            emailAddress: string,
            name: string,
            role: string
        },
        schedule: {
            time: string,
            action: string
        }[]
    }[]
}

export interface ScheduleChange {
    _id?: string,
    department?: {
        _id?: string,
        name?: string
    },
    team?: {
        _id?: string,
        name?: string
    },
    timeframe?: {
        from?: string,
        to?: string
    },
    date?: string,
    timeOptions?: {
        hours?: string[],
        minutes?: string[],
        slots?: string[]
    },
    teamActions?: {
        [key: string]: string
    },
    expandSchedule?: string,
    schedules?: {
        submitted?: boolean,
        member?: {
            _id?: string,
            emailAddress?: string,
            name?: string,
            role?: string
        },
        schedule?: {
            time?: string,
            action?: string
        }[]
    }[]
}

const urlParams = new URLSearchParams(window.location.search)

const initialState: Schedule = {
    _id: "",
    department: {
        _id: "",
        name: urlParams.get("team") ? (urlParams.get("team") as string) : ""
    },
    team: {
        _id: "",
        name: urlParams.get("team") ? (urlParams.get("team") as string) : ""
    },
    timeframe: {
        from: "",
        to: ""
    },
    date: /^\d{4}-([0]\d|1[0-2])-([0-2]\d|3[01])$/.test(urlParams.get("d") || "") ? (urlParams.get("d") as string) : new Date().toISOString().substring(0, 10),
    timeOptions: {
        hours: [],
        minutes: ["00", "15", "30", "45"],
        slots: []
    },
    teamActions: {},
    expandSchedule: "",
    schedules: []
}

export const scheduleSlice = createSlice({
    name: "schedule",
    initialState,
    reducers: {
        setSchedule: (state, action: PayloadAction<ScheduleChange>) => {
            const allKeys = getAllKeys(action.payload)

            allKeys.forEach(keyString => {
                var keys: string[] = keyString.split(".")
                var last = keys.pop();

                keys.reduce((o: any, k: string) => o[k] = o[k], state)[(last as string)] = keys.reduce((o: any, k: string) => o[k] = o[k], action.payload)[(last as string)]
            })
        }
    }
})

export const { setSchedule } = scheduleSlice.actions;

export default scheduleSlice.reducer