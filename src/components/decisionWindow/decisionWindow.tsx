import React from "react"
import { usePromiseTracker } from "react-promise-tracker"
import ErrorMessage from "../error/error"
import InlinePromiseTracker from "../promiseTrackers/inlineTracker"

const DecisionWindow: React.FC<{
    title: string,
    bodyJsx?: JSX.Element[],
    acceptButtonText?: string,
    declineButtonText?: string,
    hideCloseButton?: boolean,
    closeModal: (e: React.FormEvent<HTMLButtonElement>) => void,
    acceptFunction: (e: React.FormEvent<HTMLButtonElement>) => void,
    searchArea?: string,
    errorMessage?: string
}> = ({ title, bodyJsx, acceptFunction, declineButtonText, acceptButtonText, hideCloseButton, closeModal, searchArea, errorMessage }): JSX.Element => {
    const { promiseInProgress } = usePromiseTracker({ area: searchArea })

    return (
        <div className="modal-backdrop show">
            <div className="modal-wrapper-container">
                <div className="standard-modal medium-width">
                    <div className="standard-modal-title">
                        <h3>{title}</h3>

                        {
                            !hideCloseButton ? (
                                <button
                                    className="close-modal-button"
                                    onClick={closeModal}
                                />
                            ) : null
                        }
                        
                    </div>

                    {
                        bodyJsx ? (
                            <div className="standard-modal-body">
                                {bodyJsx}
                            </div>
                        ) : null
                    }
                
                    <div className="standard-modal-footer">
                        <button
                            className="plain-text-link"
                            onClick={closeModal}
                        >{declineButtonText || "Cancel"}</button>

                        <button
                            className="standard-button green"
                            onClick={acceptFunction}
                        >{acceptButtonText || "Continue"}</button>

                        
                    </div>

                    {
                        (searchArea && promiseInProgress) || errorMessage ? (
                            <div className="standard-modal-additional-info">
                                <InlinePromiseTracker
                                    searchArea={searchArea || ""}
                                />

                                {
                                    errorMessage ? (
                                        <ErrorMessage
                                            message={errorMessage}
                                            topSpacing="0px"
                                            bottomSpacing="0px"
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

export default DecisionWindow