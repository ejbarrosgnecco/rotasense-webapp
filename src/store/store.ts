import { configureStore } from "@reduxjs/toolkit";

// Persist
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

// Reducers
import appPreferencesReducer, { appPreferencesSlice } from "./features/appPreferences";

// ** App preferences persitance ** //
const persistAppPreferences = {
    key: "appPreferences",
    storage
}

const persistedAppPreferencesReducer = persistReducer(persistAppPreferences, appPreferencesReducer)

export const store = configureStore({
    reducer: {
        appPreferences: persistedAppPreferencesReducer
    },
    devTools: true
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const persistor = persistStore(store)