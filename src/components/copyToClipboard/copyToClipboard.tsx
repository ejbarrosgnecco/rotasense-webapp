import React from "react";
import toastNotification from "../toastNotifications/toastNotifications";

import "./copyToClipboard-styles.scss";

const CopyToClipboard: React.FC<{ toCopy: string, styles?: React.CSSProperties }> = ({ toCopy, styles}): JSX.Element => {
    const handleCopy = (e: React.FormEvent): void => {
        navigator.clipboard.writeText(toCopy);

        toastNotification({
            type: "ui",
            text: "Copied successfully to clipboard"
        })
    }

    return <i className="copy-clipboard fa-solid fa-copy" style={styles} onClick={handleCopy}/>
}

export default CopyToClipboard