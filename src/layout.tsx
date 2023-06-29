import React from "react"
import NavBar from "./components/navBar/navBar"

const Layout: React.FC<{ children: any }> = ({ children }): JSX.Element => {
    return (
        <React.Fragment>
            <NavBar/>

            <div className="main-body-container">
                <div className="main-body-inner-container body-width">
                    {children}
                </div>
            </div>
           
        </React.Fragment>
    )
}

export default Layout