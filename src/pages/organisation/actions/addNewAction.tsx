import React, { Dispatch, SetStateAction, useState } from "react"
import { usePromiseTracker } from "react-promise-tracker"
import ErrorMessage from "../../../components/error/error"
import Tooltip from "../../../components/tooltip/tooltip"
import { Action } from "../organisation"

const AddNewAction: React.FC<{
    saveAction: (newAction: Action) => void,
    existingActions: Action[],
    closeModal: Dispatch<SetStateAction<boolean>>,
    roles: string[]
}> = ({ saveAction, closeModal, roles, existingActions }): JSX.Element => {
    const [actionDetails, setActionDetails] = useState<Action>({
        action: "",
        color: "",
        restricted: false,
        restricted_to: []
    })

    const [errors, setErrors] = useState({
        action: false,
        color: false,
        restricted_to: false,
        same_name: false
    })

    const handleDataValidation = (): boolean => {
        let errorsCount: number = 0;
        let errorsObject: { [key: string]: boolean } = {};

        if(actionDetails.action.length < 2) {
            errorsCount++;
            errorsObject.action = true
        } else if (existingActions.some(a => a.action === actionDetails.action)) {
            errorsCount++;
            errorsObject.same_name = true
        }

        if(actionDetails.color === "") {
            errorsCount++;
            errorsObject.color = true;
        }

        if(actionDetails.restricted && actionDetails.restricted_to.length === 0) {
            errorsCount++;
            errorsObject.restricted_to = true
        }

        if(errorsCount > 0) {
            setErrors({
                ...errors,
                ...errorsObject
            })

            return false
        } else {
            return true
        }
    }

    const handleSubmit = (e: React.FormEvent<HTMLButtonElement>): void => {
        if(handleDataValidation() === true) {
            saveAction(actionDetails)
        }
    }

    const handleFillInForm = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;

        setActionDetails({
            ...actionDetails,
            [name]: value
        })

        setErrors({
            ...errors,
            [name]: false
        })
    }

    const saveActionPromise = usePromiseTracker({ area: "add_action" }).promiseInProgress;

    return (
        <div className="modal-backdrop show">
            <div className="modal-wrapper-container">
                <div className="standard-modal medium-width">
                    <div className="standard-modal-title">
                        <h3>Add new action</h3>

                        <button
                            className="close-modal-button"
                            onClick={() => closeModal(false)}
                        />
                    </div>

                    <div className="standard-modal-body">
                        <label className={`expanded-input-wrapper ${errors.action ? 'error' : ''}`} htmlFor="action">
                            <div className="expanded-input-content">
                                <input
                                    id="action"
                                    className="expanded-input"
                                    placeholder="e.g. Cold outreach"
                                    autoComplete="off"
                                    name="action"
                                    value={actionDetails.action}
                                    onChange={handleFillInForm}
                                    disabled={saveActionPromise}
                                />
    
                                <label className="expanded-input-label" htmlFor="action">Action name*</label>
                            </div>
                        </label>

                        {
                            errors.action ? (
                                <ErrorMessage
                                    message="Please enter the name of the action"
                                /> 
                            ) : null
                        }

                        <h5>Color* <Tooltip message="The color that this action will appear as on schedules"/></h5>

                        <div className="color-options-grid-container">
                            {
                                ["#885053", "#777DA7", "#94C9A9", "#E56399", "#F45866", "#DE6E4B", "#357DED", "#435058"].map(color => {
                                    return (
                                        <div 
                                            style={{ backgroundColor: color }}
                                            className={`color-option ${actionDetails.color === color ? 'selected' : ''}`}
                                            onClick={() => {
                                                setActionDetails({
                                                    ...actionDetails,
                                                    color: color
                                                })

                                                setErrors({
                                                    ...errors,
                                                    color: false
                                                })
                                            }}
                                        />
                                    )
                                })
                            }
                        </div>

                        {
                            errors.color ? (
                                <ErrorMessage
                                    topSpacing="20px"
                                    message="Please select an action color"
                                    bottomSpacing="0px"
                                /> 
                            ) : null
                        }

                        <br/>
                        <br/>

                        <div className="checkbox-agreement-wrapper">
                            <input
                                type="checkbox"
                                className="checkbox-agreement-input invisible"
                                id="scope"
                                checked={actionDetails.restricted}
                                onChange={e => {
                                    setActionDetails({
                                        ...actionDetails,
                                        restricted: e.target.checked,
                                        restricted_to: []
                                    })

                                    setErrors({
                                        ...errors,
                                        restricted_to: false
                                    })
                                }}
                                disabled={saveActionPromise}
                            />

                            <label
                                htmlFor="scope"
                                className="checkbox-agreement-checkbox"
                            />

                            <span>
                                <h5>Restricted</h5>
                                <p>Should this action only be available for certain roles?</p>
                            </span>
                        </div>

                        {
                            actionDetails.restricted ? (
                                <React.Fragment>
                                    <div style={{marginTop: 20}} className={`options-scroll-container ${errors.restricted_to ? 'error' : ''}`}>
                                        {
                                            roles.map(role => {
                                                return (
                                                    <div 
                                                        className={`user-option ${actionDetails.restricted_to.includes(role) ? "selected" : ""}`}
                                                        onClick={() => {
                                                            if(actionDetails.restricted_to.includes(role)) {
                                                                const index = actionDetails.restricted_to.indexOf(role)

                                                                let newArray = [...actionDetails.restricted_to];
                                                                newArray.splice(index, 1);

                                                                setActionDetails({
                                                                    ...actionDetails,
                                                                    restricted_to: newArray
                                                                })
                                                            } else {
                                                                setActionDetails({
                                                                    ...actionDetails,
                                                                    restricted_to: [
                                                                        ...actionDetails.restricted_to,
                                                                        role
                                                                    ]
                                                                })

                                                                setErrors({
                                                                    ...errors,
                                                                    restricted_to: false
                                                                })
                                                            }
                                                        }}
                                                    >{role}</div>
                                                )
                                            })
                                        }
                                    </div>

                                    {
                                        errors.restricted_to ? (
                                            <ErrorMessage
                                                topSpacing="15px"
                                                message="Please select at least one role for restriction"
                                            />
                                        ) : null
                                    }
                                </React.Fragment>
                            ) : null
                        }
                    </div>

                    <div className="standard-modal-footer">
                        <button
                            className="standard-button green"
                            onClick={handleSubmit}
                        >Save action</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddNewAction