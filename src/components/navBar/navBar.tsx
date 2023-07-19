import React from "react"

import "./navBar-styles.scss";

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
    )
}

export default NavBar