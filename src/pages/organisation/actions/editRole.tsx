import React, { useState } from "react"
import { usePromiseTracker } from "react-promise-tracker"
import ErrorMessage from "../../../components/error/error";
import InlinePromiseTracker from "../../../components/promiseTrackers/inlineTracker";

const EditRole: React.FC<{
    closeModal: () => void,
    submitRole: (newRole: string) => void,
    existingRole: string,
    error: string
}> = ({ closeModal, submitRole, existingRole, error }): JSX.Element => {
    const [newRoleName, setNewRoleName] = useState<string>(existingRole);

    const [nameError, setNameError] = useState<boolean>(false);

    const handleSubmit = (e: React.FormEvent<HTMLButtonElement | HTMLInputElement>): void => {
        if(newRoleName.length < 2) {
            setNameError(true);
            return;
        } else {
            submitRole(newRoleName)
        }
    }

    const editPromise = usePromiseTracker({ area: "edit_role" }).promiseInProgress;

    return (
            <div className="modal-backdrop show">
                <div className="modal-wrapper-container">
                    <div className="standard-modal medium-width">
                        <div className="standard-modal-title">
                            <h3>Edit role</h3>

                            <button
                                className="close-modal-button"
                                onClick={closeModal}
                                disabled={editPromise}
                            />
                        </div>

                        <div className="standard-modal-body">
                            <p className="secondary-text">By renaming this role, all users belonging to it will be automatically updated.</p>

                            <br/>

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
                                        disabled={editPromise}
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
                                disabled={editPromise}
                            >Save changes</button>
                        </div>

                        {
                            editPromise || error ? (
                                <div className="standard-modal-additional-info">
                                    <InlinePromiseTracker
                                        searchArea="edit_role"
                                    />

                                    {
                                        error ? (
                                            <ErrorMessage
                                                message="There was an error editing this role, please try again"
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

export default EditRole