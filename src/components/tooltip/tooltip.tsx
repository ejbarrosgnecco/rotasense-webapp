import React, { useState } from "react"
import { Tooltip as Tip } from "react-tooltip"

import 'react-tooltip/dist/react-tooltip.css'

const Tooltip: React.FC<{ message: string }> = ( { message } ): JSX.Element => {
    const [Id, setId] = useState<string>((Math.random() * 100).toFixed(3))

    return (
        <React.Fragment>
            &nbsp;
            <Tip id={Id}>
                <p style={{color: "#FFF", maxWidth: 200}}>{message}</p>
            </Tip>

            <i className="fa-solid fa-circle-info" style={{cursor: "help" }}data-tooltip-id={Id}></i>
        </React.Fragment>
    )
}

export default Tooltip