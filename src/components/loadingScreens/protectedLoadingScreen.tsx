import React from "react"
import { RotatingLines } from "react-loader-spinner";

import "./protectedLoading-styles.scss";

const ProtectedLoadingScreen: React.FC = (): JSX.Element => {
    return (
        <React.Fragment>
            <div className="loading-navigation-outer-container">
                <div className="loading-navigation-upper-container">
                    <div className="loading-navigation-upper-inner-container body-width">
                        <div className="loading-logo-mask"/>

                        <div className="loading-name-mask"/>
                    </div>
                </div>
                <div className="loading-navigation-lower-container">
                    <div className="loading-navigation-lower-inner-container body-width">
                        <ul className="loading-navigation-link-mask">
                            <div/>
                            <div/>
                            <div/>
                            <div/>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div className="loading-text-container">
                <img
                    className="loading-main-logo" 
                    src="/assets/images/rotasense-logo-white-background.png"
                />

                <RotatingLines
                    strokeColor="#dadada"
                    strokeWidth="5"
                    animationDuration="1"
                    width="60"
                    visible={true}
                />
            </div>
        </React.Fragment>
        
    )
}

export default ProtectedLoadingScreen