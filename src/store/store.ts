import { configureStore } from "@reduxjs/toolkit";

// Persist
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

// Reducers
import appPreferencesReducer, { appPreferencesSlice } from "./features/system/appPreferences";
import newAccountReducer from "./features/account/newAccount";
import userAuthenticationReducer, { userAuthenticationSlice } from "./features/system/userAuthentication";
import scheduleReducer from "./features/schedules/schedule";
import schedulePartReducer from "./features/schedules/schedulePart"

// === ACCOUNT === //
// ** New account setup ** //
const persistNewAccount = {
    key: "newAccount",
    storage
}

const persistedNewAccountReducer = persistReducer(persistNewAccount, newAccountReducer)

// === SCHEDULES === //

// === SYSTEM === //
// ** App preferences persitance ** //
const persistAppPreferences = {
    key: "appPreferences",
    storage
}

const persistedAppPreferencesReducer = persistReducer(persistAppPreferences, appPreferencesReducer);

// ** User authentication persistance ** //
const persistUserAuthentication = {
    key: "userAuthentication",
    storage
}

const persistedUserAuthenticationReducer = persistReducer(persistUserAuthentication, userAuthenticationReducer)



export const store = configureStore({
    reducer: {
        appPreferences: persistedAppPreferencesReducer,
        newAccount: persistedNewAccountReducer,
        userAuthentication: persistedUserAuthenticationReducer,
        schedule: scheduleReducer,
        schedulePart: schedulePartReducer
    },
    devTools: true
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const persistor = persistStore(store)