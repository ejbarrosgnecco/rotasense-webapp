import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
    theme: 'light'
}

export const appPreferencesSlice = createSlice({
    name: "appPreferences",
    initialState,
    reducers: {
        setTheme: (state, action: PayloadAction<string>) => {
            state.theme = action.payload
        }
    }
})

export const { setTheme } = appPreferencesSlice.actions

export default appPreferencesSlice.reducer