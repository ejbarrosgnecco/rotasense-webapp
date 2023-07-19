import React, { CSSProperties } from "react";
import { RotatingLines } from "react-loader-spinner";
import { usePromiseTracker } from "react-promise-tracker";

import "./promiseTracker-styles.scss";

const InlinePromiseTracker: React.FC<{ searchArea: string, message?: string, containerStyles?: CSSProperties }> = ({ searchArea, message, containerStyles }): any => {
    const promiseInProgress = usePromiseTracker({ area: searchArea }).promiseInProgress;

    return (
        promiseInProgress &&
        <div className="inline-input-tracker-wrapper" style={containerStyles ? containerStyles : {}}>
            <span style={{color: '#ccc'}}>{message || "Please wait..."}</span>

            <RotatingLines
                width="20"
                strokeColor="#dadada"
            />
        </div>
    )
}

export default InlinePromiseTracker