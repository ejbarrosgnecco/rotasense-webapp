import axios from "axios";
import axiosRetry from "axios-retry";
import React, { Dispatch, SetStateAction, useState } from "react"
import { trackPromise, usePromiseTracker } from "react-promise-tracker";
import { useSelector } from "react-redux";
import ErrorMessage from "../../../components/error/error";
import InlinePromiseTracker from "../../../components/promiseTrackers/inlineTracker";
import { RootState } from "../../../store/store";
import { SuccessResponse } from "../../../types.config";
import { Department } from "../organisation"

axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

const RenameDepartment: React.FC<{
    closeModal: (e: React.FormEvent<HTMLButtonElement>) => void,
    department: Department,
    departmentOptions: Department[],
    setDepartmentOptions: Dispatch<SetStateAction<Department[]>>
}> = ({ closeModal, department, departmentOptions, setDepartmentOptions }): JSX.Element => {
    const userDetails = useSelector((state: RootState) => state.userAuthentication);

    const [newDepartmentName, setNewDepartmentName] = useState<string>(department.name);

    const [errorMessage, setErrorMessage] = useState<string>("")
    const [errors, setErrors] = useState({
        newDepartmentName: false,
        error: false
    })

    const handleFillInForm = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { value } = e.target;

        setNewDepartmentName(value)
        setErrors({
            newDepartmentName: false,
            error: false
        })
    }

    const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();

        if(newDepartmentName.length < 2) {
            setErrors({
                ...errors,
                newDepartmentName: true
            })

            return;
        } else {
            trackPromise(
                new Promise<void>( async (resolve) => {
                    await axios({
                        method: "PUT",
                        url: process.env.REACT_APP_BACKEND_BASE_URL + `/organisation/departments/${department._id}`,
                        headers: {
                            Authorization: "Bearer " + userDetails.accessToken
                        },
                        data: {
                            newName: newDepartmentName
                        }
                    })
                    .then((value: { data: SuccessResponse }) => {
                        const response = value.data;

                        if(response.success === true) {
                            const dptIndex = departmentOptions.indexOf(department);

                            const newArray = [...departmentOptions];
                            newArray[dptIndex] = {
                                ...departmentOptions[dptIndex],
                                name: newDepartmentName
                            }

                            setDepartmentOptions(newArray)

                            closeModal(e)

                            resolve();
                        } else {
                            setErrorMessage(response.reason || "")
                            setErrors({
                                ...errors,
                                error: true
                            })
    
                            resolve()
                        }
                    })
                    .catch(() => {
                        setErrorMessage("Oops, there was a technical error. Please try again.")
                        setErrors({
                            ...errors,
                            error: true
                        })

                        resolve()
                    })
                })
            , "renameDepartment")
        }
    }

    const renameDepartmentPromise = usePromiseTracker({ area: "renameDepartment" }).promiseInProgress;

    return (
        <div className="modal-backdrop show">
            <div className="modal-wrapper-container">
                <div className="standard-modal medium-width">
                    <div className="standard-modal-title">
                        <h3>Rename department</h3>

                        <button 
                            className="close-modal-button"
                            disabled={renameDepartmentPromise}
                            onClick={closeModal}
                        />
                    </div>

                    <div className="standard-modal-body">
                        <p className="secondary-text">By renaming this department, all teams/users belonging to it will be automatically updated.</p>

                        <br/>

                        <label className={`expanded-input-wrapper ${errors.newDepartmentName ? 'error' : ''}`} htmlFor="department">
                            <div className="expanded-input-content">
                                <input
                                    id="department"
                                    className="expanded-input"
                                    placeholder="e.g. Human Resources"
                                    autoComplete="off"
                                    name="department"
                                    value={newDepartmentName}
                                    onChange={handleFillInForm}
                                    disabled={renameDepartmentPromise}
                                />
    
                                <label className="expanded-input-label" htmlFor="department">Department name*</label>
                            </div>
                        </label>

                        {
                            errors.newDepartmentName ? (
                                <ErrorMessage
                                    message="Please enter the new name of the department"
                                />
                            ) : null
                        }

                        {
                            errors.error ? (
                                <ErrorMessage
                                    message={errorMessage}
                                />
                            ) : null
                        }
                    </div>
                    

                    <div className="standard-modal-footer">
                        <button
                            className="standard-button green"
                            onClick={handleSubmit}
                            disabled={renameDepartmentPromise}
                        >Save changes</button>
                    </div>

                    {
                        renameDepartmentPromise ? (
                            <div className="standard-modal-additional-info">
                                <InlinePromiseTracker
                                    searchArea="renameDepartment"
                                />
                            </div>
                        ) : null
                    }
                </div>
            </div>
        </div>
    )
}

export default RenameDepartment