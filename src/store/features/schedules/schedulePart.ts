import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import getAllKeys from "../../utils/getAllKeys"

export interface SchedulePart {
    showView: boolean,
    showAdd: boolean,
    user: {
        _id: string,
        name: string,
        role: string
    },
    action: string,
    startTime: string,
    endTime: string,
    slots: number,
    coordinates: {
        x: number,
        y: number
    }
}

interface SchedulePartChange {
    showView?: boolean,
    showAdd?: boolean,
    user?: {
        _id?: string,
        name?: string,
        role?: string
    },
    action?: string,
    startTime?: string,
    endTime?: string,
    slots?: number,
    coordinates?: {
        x?: number,
        y?: number
    }
}

const initialState: SchedulePart = {
    showView: false,
    showAdd: false,
    user: {
        _id: "",
        name: "",
        role: ""
    },
    action: "",
    startTime: "",
    endTime: "",
    slots: 0,
    coordinates: {
        x: 0,
        y: 0
    }
}

export const schedulePartSlice = createSlice({
    name: "schedulePart",
    initialState,
    reducers: {
        setSchedulePart: (state, action: PayloadAction<SchedulePartChange>) => {
            const allKeys = getAllKeys(action.payload)

            allKeys.forEach(keyString => {
                var keys: string[] = keyString.split(".")
                var last = keys.pop();

                keys.reduce((o: any, k: string) => o[k] = o[k], state)[(last as string)] = keys.reduce((o: any, k: string) => o[k] = o[k], action.payload)[(last as string)]
            })
        }
    }
})

export const { setSchedulePart } = schedulePartSlice.actions;

export default schedulePartSlice.reducer