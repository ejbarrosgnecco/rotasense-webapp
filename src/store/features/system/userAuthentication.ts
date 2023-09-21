import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserRecord {
    userId: string,
    firstName: string,
    lastName: string,
    emailAddress: string,
    organisation: {
        _id: string,
        name: string
    },
    team: {
        _id: string,
        name: string
    },
    profile: string,
    role: string,
    accessToken: string
}

const initialState: UserRecord = {
    userId: "",
    firstName: "",
    lastName: "",
    emailAddress: "",
    organisation: {
        _id: "",
        name: ""
    },
    team: {
        _id: "",
        name: ""
    },
    profile: "",
    role: "",
    accessToken: ""
}

export const userAuthenticationSlice = createSlice({
    name: "userAuthentication",
    initialState,
    reducers: {
        setUserAuthentication: (state, action: PayloadAction<UserRecord>) => {
            state.userId = action.payload.userId;
            state.firstName = action.payload.firstName;
            state.lastName = action.payload.lastName;
            state.emailAddress = action.payload.emailAddress;
            state.organisation = action.payload.organisation;
            state.team = action.payload.team;
            state.profile = action.payload.profile;
            state.role = action.payload.role;
            state.accessToken = action.payload.accessToken
        },
        resetUserAuthentication: (state) => {
            state.userId = "";
            state.firstName = "";
            state.lastName = "";
            state.emailAddress = "";
            state.organisation = {
                _id: "",
                name: ""
            };
            state.team = {
                _id: "",
                name: ""
            }
            state.profile = "";
            state.role = "";
            state.accessToken = "";
        }
    }
})

export const { setUserAuthentication, resetUserAuthentication } = userAuthenticationSlice.actions

export default userAuthenticationSlice.reducer