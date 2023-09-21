import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import getAllKeys from "../../utils/getAllKeys";

export interface NewAccount {
    activePage: 1 | 2 | 3,
    completePages: {
        1: boolean,
        2: boolean,
        3: boolean,
    },
    user: {
        firstName: string,
        lastName: string,
        emailAddress: string,
        emailAddressVerified: boolean,
        password: string,
    },
    organisation: {
        name: string,
        sector: string,
        employeeSize: string
    },
    department: string,
    team: {
        name: string,
        operatingHours: {
            from: string,
            to: string
        },
        actions: {
            action: string,
            color: string,
            restricted: boolean,
            restrictedTo: string[]
        }[],
        roles: string[]
    }
}

export interface NewAccountChange {
    activePage?: 1 | 2 | 3,
    completePages?: {
        1?: boolean,
        2?: boolean,
        3?: boolean
    },
    user?: {
        firstName?: string,
        lastName?: string,
        emailAddress?: string,
        emailAddressVerified?: boolean,
        password?: string,
    },
    organisation?: {
        name?: string,
        sector?: string,
        employeeSize?: string
    },
    department?: string,
    team?: {
        name?: string,
        operatingHours?: {
            from?: string,
            to?: string
        },
        actions?: {
            action?: string,
            color?: string,
            restricted?: boolean,
            restrictedTo?: string[]
        }[],
        roles?: string[]
    }
}

export const initialState: NewAccount = {
    activePage: 1,
    completePages: {
        1: false,
        2: false,
        3: false
    },
    user: {
        firstName: "",
        lastName: "",
        emailAddress: "",
        emailAddressVerified: false,
        password: ""
    },
    organisation: {
        name: "",
        sector: "",
        employeeSize: ""
    },
    department: "",
    team: {
        name: "",
        operatingHours: {
            from: "--:--",
            to: "--:--"
        },
        actions: [],
        roles: []
    }
}

export const newAccountSlice = createSlice({
    name: "newAccount",
    initialState,
    reducers: {
        setNewAccount: (state, action: PayloadAction<NewAccountChange>) => {
            const allKeys = getAllKeys(action.payload);

            allKeys.forEach(keyString => {
                var keys: string[] = keyString.split(".")
                var last = keys.pop();

                keys.reduce((o: any, k: string) => o[k] = o[k], state)[(last as string)] = keys.reduce((o: any, k: string) => o[k] = o[k], action.payload)[(last as string)]
            })
        },
        resetNewAccount: (state) => {
            state.activePage = 1;
            state.completePages = {
                1: false,
                2: false,
                3: false
            };
            state.user = {
                firstName: "",
                lastName: "",
                emailAddress: "",
                emailAddressVerified: false,
                password: ""
            };
            state.organisation = {
                name: "",
                sector: "",
                employeeSize: ""
            };
            state.department = "";
            state.team = {
                name: "",
                operatingHours: {
                    from: "--:--",
                    to: "--:--"
                },
                actions: [],
                roles: []
            }
        }
    }
})

export const { setNewAccount, resetNewAccount } = newAccountSlice.actions;

export default newAccountSlice.reducer;