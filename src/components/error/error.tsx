import React, { CSSProperties } from "react"

import "./error-styles.scss";

const ErrorMessage: React.FC<{
    message: string,
    topSpacing?: string,
    bottomSpacing?: string,
    attached?: boolean,
    style?: CSSProperties,
}> = ({ message, topSpacing, attached, bottomSpacing, style }): JSX.Element => {
    return (
        <p 
            className={`error-message ${attached ? "attached" : ""}`}
            style={{ marginTop: topSpacing || 10, marginBottom: bottomSpacing || 10, ...style || {} }}
        >{message}</p>
    )
}

export default ErrorMessage