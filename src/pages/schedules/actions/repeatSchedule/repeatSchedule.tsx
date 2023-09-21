import React from "react"

const RepeatSchedule: React.FC<{
    user: { name: string, _id: string, role: string },
    closeModal: () => void
}> = ({ user, closeModal }): JSX.Element => {
    return (
        <React.Fragment>
            <div className="modal-backdrop show">
                <div className="modal-wrapper-container">
                    <div className={`standard-modal medium-width`}>
                        <div className="standard-modal-title">
                            <h3>Repeat schedule</h3>

                            <button
                                className="close-modal-button"
                                onClick={closeModal}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default RepeatSchedule