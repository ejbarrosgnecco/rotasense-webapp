import React from "react"
import { RotatingLines } from "react-loader-spinner"
import { usePromiseTracker } from "react-promise-tracker";

import "./promiseTracker-styles.scss";

const FullScreenPromiseTracker: React.FC<{ searchArea: string, message: string }> = ({ searchArea, message }): any => {
    const promiseInProgress = usePromiseTracker({ area: searchArea }).promiseInProgress;
    
    return (
        promiseInProgress &&
        <div className="modal-backdrop show top-level">
            <div className="modal-wrapper-container">
                <div className="standard-modal">
                    <div className="standard-modal-body">
                        <div className="full-screen-promise-modal">
                            <RotatingLines
                                strokeColor="#F58634"
                                strokeWidth="5"
                                animationDuration="0.75"
                                width="80"
                                visible={true}
                            />

                            <p>{message}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FullScreenPromiseTracker