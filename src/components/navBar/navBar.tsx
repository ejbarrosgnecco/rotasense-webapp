import React, { useState } from "react"
import Select from "react-dropdown-select";
import { useDispatch, useSelector } from "react-redux";
import { resetUserAuthentication } from "../../store/features/system/userAuthentication";
import { RootState } from "../../store/store";
import ChangePassword from "./actions/changePassword/changePassword";

import "./navBar-styles.scss";

const NavBar: React.FC = (): JSX.Element => {
    const userDetails = useSelector((root: RootState) => root.userAuthentication);

    const dispatch = useDispatch();

    const [showChangePassword, setShowChangePassword] = useState<boolean>(false);

    const handleLogOut = async (): Promise<void> => {
        dispatch(resetUserAuthentication())
        
        setTimeout(() => {
            window.location.href = "/login"
        }, 300)
    }
    
    return (
        <React.Fragment>
            <div className="navigation-outer-container">
                <div className="navigation-upper-container">
                    <div className="navigation-upper-inner-container body-width">
                        <img className="navigation-logo" src="/assets/images/rotasense-letter.png"/>
                        
                        <Select
                            className="user-trigger-button"
                            options={[
                                { value: "Change password" },
                                { value: "Log out" }
                            ]}
                            contentRenderer={() => {
                                return (
                                    <button
                                        className="user-trigger-button"
                                    >
                                        {userDetails.firstName} {userDetails.lastName}
                                    </button>
                                )
                            }}
                            labelField="value"
                            values={[]}
                            onChange={(e) => {
                                const value = e[0].value;

                                switch (value) {
                                    case "Change password":
                                        setShowChangePassword(true)
                                        return;

                                    case "Log out":
                                        handleLogOut()
                                        return;
                                }
                            }}
                            backspaceDelete={false}
                            searchable={false}
                        />
                    </div>
                </div>

                <div className="navigation-lower-container">
                    <div className="navigation-lower-inner-container body-width">
                        <ul className="navigation-link-options">
                            <a href="/">Dashboard</a>
                            <a href="/schedules">Schedules</a>
                            <a href="/organisation">Organisation</a>
                            <a href="/settings">Settings</a>
                        </ul>
                    </div>
                </div>
            </div>

            {
                showChangePassword ? (
                    <ChangePassword
                        closeModal={() => setShowChangePassword(false)}
                    />
                ) : null
            }
        </React.Fragment>
    )
}

export default NavBar