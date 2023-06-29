import React from "react"

import "./styles.scss";

const NavBar: React.FC = (): JSX.Element => {
    return (
        <div className="navigation-outer-container">
            <div className="navigation-upper-container">
                <div className="navigation-upper-inner-container body-width">
                    <img className="navigation-logo" src="/assets/images/rotasense-letter.png"/>

                    <div className="navigation-user-trigger">
                        Elliot Barros Gnecco
                    </div>
                </div>
            </div>

            <div className="navigation-lower-container">
                <div className="navigation-lower-inner-container">
                    <ul className="navigation-link-options">
                        <a>Dashboard</a>
                        <a>Schedules</a>
                        <a>Organisation</a>
                        <a>Settings</a>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default NavBar