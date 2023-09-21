import React, { useState } from "react"
import { usePromiseTracker } from "react-promise-tracker"
import ErrorMessage from "../../../components/error/error";
import InlinePromiseTracker from "../../../components/promiseTrackers/inlineTracker";

const AddNewRole: React.FC<{
    closeModal: () => void,
    submitRole: (newRole: string) => void,
    error: string
}> = ({ closeModal, submitRole, error }): JSX.Element => {
    const [newRoleName, setNewRoleName] = useState<string>("");

    const [nameError, setNameError] = useState<boolean>(false);

    const handleSubmit = (e: React.FormEvent<HTMLButtonElement | HTMLInputElement>): void => {
        if(newRoleName.length < 2) {
            setNameError(true);
            return;
        } else {
            submitRole(newRoleName)
        }
    }

    const addRolePromise = usePromiseTracker({ area: "addRole" }).promiseInProgress;

    return (
            <div className="modal-backdrop show">
                <div className="modal-wrapper-container">
                    <div className="standard-modal medium-width">
                        <div className="standard-modal-title">
                            <h3>Add new role</h3>

                            <button
                                className="close-modal-button"
                                onClick={closeModal}
                                disabled={addRolePromise}
                            />
                        </div>

                        <div className="standard-modal-body">
                            <label className={`expanded-input-wrapper ${nameError ? 'error' : ''}`} htmlFor="role">
                                <div className="expanded-input-content">
                                    <input
                                        id="role"
                                        className="expanded-input"
                                        placeholder="e.g. Software Engineer"
                                        autoComplete="off"
                                        name="role"
                                        value={newRoleName}
                                        onChange={e => {
                                            setNewRoleName(e.target.value);
                                            setNameError(false);
                                        }}
                                        disabled={addRolePromise}
                                        onKeyDown={e => {
                                            if(e.key === "Enter") {
                                                handleSubmit(e);
                                            }
                                        }}
                                    />

                                    <label className="expanded-input-label" htmlFor="role">Role*</label>
                                </div>
                            </label>

                            {
                                nameError ? (
                                    <ErrorMessage
                                        message="Please enter the name of the role"
                                    />
                                ) : null
                            }
                        </div>

                        <div className="standard-modal-footer">
                            <button
                                className="standard-button green"
                                onClick={handleSubmit}
                                disabled={addRolePromise}
                            >Confirm</button>
                        </div>

                        {
                            addRolePromise || error ? (
                                <div className="standard-modal-additional-info">
                                    <InlinePromiseTracker
                                        searchArea="addRole"
                                    />

                                    {
                                        error ? (
                                            <ErrorMessage
                                                message="There was an error adding this role, please try again"
                                            />
                                        ) : null
                                    }
                                </div>
                            ) : null
                        }
                    </div>
                </div>
            </div>
    )
}

export default AddNewRole