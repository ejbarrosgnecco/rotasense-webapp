import React from "react"

import "./error-styles.scss";

const ErrorMessage: React.FC<{
    message: string,
    topSpacing?: string,
    bottomSpacing?: string
}> = ({ message, topSpacing, bottomSpacing }): JSX.Element => {
    return (
        <p 
            className="error-message"
            style={{ marginTop: topSpacing || 10, marginBottom: bottomSpacing || 10 }}
        >{message}</p>
    )
}

export default ErrorMessage