import axios from "axios";
import axiosRetry from "axios-retry";
import React, { Dispatch, SetStateAction, useState } from "react"
import { trackPromise, usePromiseTracker } from "react-promise-tracker";
import { useSelector } from "react-redux";
import ErrorMessage from "../../../components/error/error";
import { RootState } from "../../../store/store";
import { SuccessResponse } from "../../../types.config";
import { Department } from "../organisation";

axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

const AddNewDepartment: React.FC<{
    closeModal: Dispatch<SetStateAction<boolean>>,
    departmentOptions: Department[],
    setDepartmentOptions: Dispatch<SetStateAction<Department[]>>
}> = ({ closeModal, setDepartmentOptions, departmentOptions }): JSX.Element => {
    const userDetails = useSelector((state: RootState) => state.userAuthentication)

    const [newDepartmentName, setNewDepartmentName] = useState<string>("");
    const [errors, setErrors] = useState({
        department: false,
        error: false
    })

    const handleFillInForm = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setNewDepartmentName(e.target.value);
        setErrors({
            department: false,
            error: false
        })
    }

    const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();

        if(newDepartmentName.length < 2) {
            setErrors({
                ...errors,
                department: true
            })

            return;
        } else {
            trackPromise(
                new Promise<void>( async (resolve) => {
                    await axios({
                        method: "POST",
                        url: process.env.REACT_APP_BACKEND_BASE_URL + "/organisation/departments",
                        headers: {
                            Authorization: "Bearer " + userDetails.accessToken
                        },
                        data: {
                            departmentName: newDepartmentName
                        }
                    })
                    .then((value: { data: SuccessResponse }) => {
                        const response = value.data;

                        if(response.success === true) {
                            const newArray: Department[] = [...departmentOptions, { _id: response.data.departmentId, name: newDepartmentName, team_count: 0 }].sort((a, b) => a.name.localeCompare(b.name));

                            setDepartmentOptions(newArray);
                            closeModal(false);

                            resolve();
                        } else {
                            setErrors({
                                ...errors,
                                error: true
                            })

                            resolve()
                        }
                    })
                    .catch((err) => {
                        setErrors({
                            ...errors,
                            error: true
                        })

                        resolve()
                    })
                })
            , 'add_department')
        }
    }

    const addDepartmentPromise = usePromiseTracker({ area: "add_department" }).promiseInProgress;

    return (
        <div className="modal-backdrop show">
            <div className="modal-wrapper-container">
                <div className="standard-modal medium-width">
                    <div className="standard-modal-title">
                        <h3>Add new department</h3>

                        <button
                            className="close-modal-button"
                            onClick={() => closeModal(false)}
                        />
                    </div>

                    <div className="standard-modal-body">
                        <p className="secondary-text">Add a new department to your organisation by entering its name below.</p>
                        
                        <br/>

                        <label className={`expanded-input-wrapper ${errors.department ? 'error' : ''}`} htmlFor="department">
                            <div className="expanded-input-content">
                                <input
                                    id="department"
                                    className="expanded-input"
                                    placeholder="e.g. Human Resources"
                                    autoComplete="off"
                                    name="department"
                                    value={newDepartmentName}
                                    onChange={handleFillInForm}
                                    disabled={addDepartmentPromise}
                                />
    
                                <label className="expanded-input-label" htmlFor="department">Department name*</label>
                            </div>
                        </label>

                        {
                            errors.department ? (
                                <ErrorMessage
                                    message="Please enter the name of your new department"
                                    bottomSpacing="0px"
                                />
                            ) : null
                        }
                    </div>

                    

                    <div className="standard-modal-footer">
                        <button
                            className="standard-button green"
                            onClick={handleSubmit}
                        >Save changes</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddNewDepartment