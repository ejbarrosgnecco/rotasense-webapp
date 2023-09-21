import React, { useState } from "react"
import { usePromiseTracker } from "react-promise-tracker";
import ErrorMessage from "../../../components/error/error";
import InlinePromiseTracker from "../../../components/promiseTrackers/inlineTracker";

const EditTeamName: React.FC<{
    closeModal: () => void,
    submitName: (editValues: { [key: string]: any }) => void,
    existingName: string,
    error: boolean
}> = ({ closeModal, submitName, existingName, error }): JSX.Element => {
    const [newTeamName, setNewTeamName] = useState<string>(existingName);

    const [nameError, setNameError] = useState<boolean>(false);

    const handleSubmit = (e: React.FormEvent<HTMLButtonElement | HTMLInputElement>): void => {
        if(newTeamName.length < 2) {
            setNameError(true);
            return;
        } else {
            submitName({
                name: newTeamName
            })
        }
    }

    const editPromise = usePromiseTracker({ area: "edit_team" }).promiseInProgress;

    return (
        <React.Fragment>
            <div className="modal-backdrop show">
                <div className="modal-wrapper-container">
                    <div className="standard-modal medium-width">
                        <div className="standard-modal-title">
                            <h3>Edit team name</h3>

                            <button
                                className="close-modal-button"
                                onClick={closeModal}
                                disabled={editPromise}
                            />
                        </div>

                        <div className="standard-modal-body">
                            <p className="secondary-text">By renaming this department, all users belonging to it will be automatically updated.</p>

                            <br/>

                            <label className={`expanded-input-wrapper ${nameError ? 'error' : ''}`} htmlFor="name">
                                <div className="expanded-input-content">
                                    <input
                                        id="name"
                                        className="expanded-input"
                                        placeholder="e.g. Talent Acquisition"
                                        autoComplete="off"
                                        name="name"
                                        value={newTeamName}
                                        onChange={e => {
                                            setNewTeamName(e.target.value);
                                            setNameError(false);
                                        }}
                                        disabled={editPromise}
                                        onKeyDown={e => {
                                            if(e.key === "Enter") {
                                                handleSubmit(e);
                                            }
                                        }}
                                    />

                                    <label className="expanded-input-label" htmlFor="name">Team name*</label>
                                </div>
                            </label>

                            {
                                nameError ? (
                                    <ErrorMessage
                                        message="Please enter the name of the team"
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
                                        searchArea="edit_team"
                                    />

                                    {
                                        error ? (
                                            <ErrorMessage
                                                message="There was an error editing this team, please try again"
                                            />
                                        ) : null
                                    }
                                </div>
                            ) : null
                        }
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default EditTeamName