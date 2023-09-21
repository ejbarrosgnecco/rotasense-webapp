import React, { Dispatch, SetStateAction, useState } from "react"
import { usePromiseTracker } from "react-promise-tracker";
import DecisionWindow from "../../../components/decisionWindow/decisionWindow";
import ErrorMessage from "../../../components/error/error";
import InlinePromiseTracker from "../../../components/promiseTrackers/inlineTracker";
import { Action } from "../organisation";

const ViewEditAction: React.FC<{
    closeModal: (e: React.FormEvent<HTMLButtonElement>) => void,
    roles: string[],
    defaultState?: "edit" | "view",
    action: Action,
    saveAction: (newValue: Action, prevValue: Action) => void,
    existingActions: Action[],
    deleteAction: (action: Action) => void,
    error?: boolean
}> = ({ closeModal, defaultState, roles, action, saveAction, existingActions, deleteAction, error }): JSX.Element => {
    const [editMode, setEditMode] = useState<boolean>(defaultState === "edit");
    const [editValues, setEditValues] = useState<Action>(action);

    const [showDecisionDeleteAction, setShowDecisionDeleteAction] = useState<boolean>(false);

    const [errors, setErrors] = useState({
        action: false,
        color: false,
        restrictedTo: false,
        same_name: false
    })

    const handleDataValidation = (): boolean => {
        let errorsCount: number = 0;
        let errorsObject: { [key: string]: boolean } = {};

        if(editValues.action.length < 2) {
            errorsCount++;
            errorsObject.action = true
        } else if (editValues.action === action.action) {
            // Do nothing
        } else if (existingActions.some(a => a.action === editValues.action)) {
            errorsCount++;
            errorsObject.same_name = true
        }

        if(editValues.color === "") {
            errorsCount++;
            errorsObject.color = true;
        }

        if(editValues.restricted && editValues.restrictedTo.length === 0) {
            errorsCount++;
            errorsObject.restrictedTo = true
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
            saveAction(editValues, action)
        }
    }

    const saveActionPromise = usePromiseTracker({ area: "edit_action" }).promiseInProgress;

    return (
        <div className="modal-backdrop show">
            <div className="modal-wrapper-container">
                <div className="standard-modal medium-width">
                    <div className="standard-modal-title">
                        <h3>View action</h3>

                        <button
                            className="close-modal-button"
                            onClick={closeModal}
                        />
                    </div>

                    <div className="standard-modal-body">
                        <div className="float-right-bar">
                            {
                                !editMode ? (
                                    <button
                                        className="edit-button"
                                        onClick={() => {
                                            setEditMode(true)
                                        }}
                                    />
                                ) : null
                            }

                            <button 
                                className="bin-button"
                                onClick={() => {
                                    setShowDecisionDeleteAction(true)
                                }}
                            />
                        </div>

                        {
                            editMode ? (
                                <React.Fragment>
                                    <label className={`expanded-input-wrapper ${errors.action || errors.same_name ? 'error' : ''}`} htmlFor="action">
                                        <div className="expanded-input-content">
                                            <input
                                                id="action"
                                                className="expanded-input"
                                                placeholder="e.g. Cold outreach"
                                                autoComplete="off"
                                                name="action"
                                                value={editValues.action}
                                                onChange={(e) => {
                                                    setEditValues({
                                                        ...editValues,
                                                        action: e.target.value
                                                    })

                                                    setErrors({
                                                        ...errors,
                                                        same_name: false,
                                                        action: false
                                                    })
                                                }}
                                                disabled={saveActionPromise}
                                            />
                
                                            <label className="expanded-input-label" htmlFor="action">Action name*</label>
                                        </div>
                                    </label>

                                    {
                                        errors.same_name ? (
                                            <ErrorMessage
                                                message="This action has already been created"
                                            />
                                        ) : null
                                    }

                                    {
                                        errors.action ? (
                                            <ErrorMessage
                                                message="Please enter the name of the action"
                                            /> 
                                        ) : null
                                    }
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                    <h5 style={{margin: 0}}>Action</h5>
                                    <p style={{marginTop: 10}}>{action.action}</p>
                                </React.Fragment>
                            )
                        }

                        {
                            editMode ? (
                                <React.Fragment>
                                    <h5 style={{marginBottom: 15}}>Color*</h5>
                                    <div className="color-options-grid-container">
                                        {
                                            ["#885053", "#777DA7", "#94C9A9", "#E56399", "#F45866", "#DE6E4B", "#357DED", "#435058"].map(color => {
                                                return (
                                                    <div 
                                                        style={{ backgroundColor: color }}
                                                        className={`color-option ${editValues.color === color ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            setEditValues({
                                                                ...editValues,
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
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                    <h5 style={{marginBottom: 10}}>Color</h5>

                                    <div 
                                        style={{ backgroundColor: action.color }}
                                        className="color-option read-only"
                                    />
                                </React.Fragment>
                            )
                        }

                        <br/>

                        {
                            editMode ? (
                                <div style={{marginTop: 15}} className="checkbox-agreement-wrapper">
                                    <input
                                        type="checkbox"
                                        className="checkbox-agreement-input invisible"
                                        id="scope"
                                        checked={editValues.restricted}
                                        onChange={e => {
                                            setEditValues({
                                                ...editValues,
                                                restricted: e.target.checked,
                                                restrictedTo: []
                                            })

                                            setErrors({
                                                ...errors,
                                                restrictedTo: false
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
                            ) : (
                                <React.Fragment>
                                    <h5 style={{margin: 0}}>Restricted?</h5>
                                    <p style={{marginTop: 10}}>{action.restricted ? 'Yes' : 'No'}</p>
                                </React.Fragment>
                            )
                        }

                        {
                            editMode ? (
                                <React.Fragment>
                                    {
                                        editValues.restricted ? (
                                            <React.Fragment>
                                                <div style={{marginTop: 20}} className={`options-scroll-container ${errors.restrictedTo ? 'error' : ''}`}>
                                                    {
                                                        roles.map(role => {
                                                            return (
                                                                <div 
                                                                    className={`user-option ${editValues.restrictedTo.includes(role) ? "selected" : ""}`}
                                                                    onClick={() => {
                                                                        if(editValues.restrictedTo.includes(role)) {
                                                                            const index = editValues.restrictedTo.indexOf(role)

                                                                            let newArray = [...editValues.restrictedTo];
                                                                            newArray.splice(index, 1);

                                                                            setEditValues({
                                                                                ...editValues,
                                                                                restrictedTo: newArray
                                                                            })
                                                                        } else {
                                                                            setEditValues({
                                                                                ...editValues,
                                                                                restrictedTo: [
                                                                                    ...editValues.restrictedTo,
                                                                                    role
                                                                                ]
                                                                            })

                                                                            setErrors({
                                                                                ...errors,
                                                                                restrictedTo: false
                                                                            })
                                                                        }
                                                                    }}
                                                                >{role}</div>
                                                            )
                                                        })
                                                    }
                                                </div>

                                                {
                                                    errors.restrictedTo ? (
                                                        <ErrorMessage
                                                            topSpacing="15px"
                                                            message="Please select at least one role for restriction"
                                                        />
                                                    ) : null
                                                }
                                            </React.Fragment>
                                        ) : null
                                    }
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                    {
                                        action.restricted ? (
                                            <React.Fragment>
                                                <h5 style={{marginBottom: 10}}>Restricted to</h5>
                                                <div className={`options-scroll-container ${errors.restrictedTo ? 'error': ''}`}>
                                                    {
                                                        action.restrictedTo.map(role => {
                                                            return (
                                                                <div className="role-option">{role}</div>
                                                            )
                                                        })
                                                    }
                                                </div>
                                            </React.Fragment>
                                        ) : null
                                    }
                                </React.Fragment>
                            )
                        }
                    </div>

                    {
                        editMode ? (
                            <React.Fragment>
                                <div className="standard-modal-footer">
                                    <button
                                        className="underline-text-link"
                                        onClick={() => {
                                            setEditMode(false);
                                            setEditValues(action);
                                        }}
                                    >Cancel</button>

                                    <button
                                        className="standard-button green"
                                        onClick={handleSubmit}
                                    >Save changes</button>
                                </div>

                                {
                                    saveActionPromise || error ? (
                                        <div className="standard-modal-additional-info">
                                            <InlinePromiseTracker
                                                searchArea="edit_action"
                                            />

                                            {
                                                error ? (
                                                    <ErrorMessage
                                                        message="There was an issue editing this action, please try again"
                                                    />
                                                ) : null
                                            }
                                        </div>
                                    ) : null
                                }
                            </React.Fragment>
                        ) : null
                    }
                </div>
            </div>

            {
                showDecisionDeleteAction ? (
                    <DecisionWindow
                        title="Delete action"
                        bodyJsx={[
                            <p>Are you sure you'd like to delete the action "{action.action}"</p>
                        ]}
                        closeModal={() => setShowDecisionDeleteAction(false)}
                        acceptFunction={() => {
                            deleteAction(action)
                        }}
                    />
                ) : null
            }
        </div>
    )
}

export default ViewEditAction