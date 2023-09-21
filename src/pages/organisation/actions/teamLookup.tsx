import axios from "axios"
import axiosRetry from "axios-retry"
import React, { useEffect, useState } from "react"
import Select from "react-dropdown-select"
import { RotatingLines } from "react-loader-spinner"
import { trackPromise, usePromiseTracker } from "react-promise-tracker"
import { useSelector } from "react-redux"
import ErrorMessage from "../../../components/error/error"
import { RootState } from "../../../store/store"
import { SuccessResponse } from "../../../types.config"

export interface RecordIdentifier {
    _id: string,
    name: string
}

axiosRetry(axios, {
    retries: 5,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

const TeamLookup: React.FC<{
    closeModal: () => void,
    handleSelectTeam: (newDepartment: RecordIdentifier, newTeam: RecordIdentifier) => void
}> = ({ closeModal, handleSelectTeam }): JSX.Element => {
    const userDetails = useSelector((root: RootState) => root.userAuthentication);

    const [departmentOptions, setDepartmentOptions] = useState<RecordIdentifier[]>([])
    const [department, setDepartment] = useState<RecordIdentifier>({
        _id: "",
        name: ""
    })

    const [teamOptions, setTeamOptions] = useState<RecordIdentifier[]>([])

    const [errorMessage, setErrorMessage] = useState<string>("");

    const getDepartmentOptions = async (): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "GET",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/organisation/departments`,
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        setDepartmentOptions(response.data);
                        resolve();
                    } else {
                        setErrorMessage(response.reason || "");
                        resolve();
                    }
                })
                .catch(() => {
                    setErrorMessage("Oops, there was a technical error, please try again");
                    resolve();
                })
            })
            
        , 'departmentLookup')
    }

    useEffect(() => {
        if(departmentOptions.length === 0) {
            getDepartmentOptions();
        }
    }, [])

    const getTeamOptions = async (): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "GET",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + `/organisation/teams`,
                    params: {
                        dptId: department._id
                    },
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        setTeamOptions(response.data);
                        resolve();
                    } else if(response.reason === "No teams could be found for this organisation department") {
                        setTeamOptions([])
                        resolve();
                    } else {
                        setErrorMessage(response.reason || "");
                        resolve();
                    }
                })
                .catch(() => {
                    setErrorMessage("Oops, there was a technical error, please try again");
                    resolve();
                })
            })
            
        , 'team_lookup')
    }

    useEffect(() => {
        if(department._id !== "") {
            getTeamOptions();
        }
    }, [department])

    const handleSubmit = (team: RecordIdentifier): void => {
        handleSelectTeam(department, team)
    }

    const departmentLoadingPromise = usePromiseTracker({ area: "departmentLookup" }).promiseInProgress;
    const teamLoadingPromise = usePromiseTracker({ area: "team_lookup" }).promiseInProgress;

    return (
        <div className="modal-backdrop show">
            <div className="modal-wrapper-container">
                <div className="standard-modal medium-width">
                    <div className="standard-modal-title">
                        <h3>Team lookup</h3>

                        <button
                            className="close-modal-button"
                            onClick={closeModal}
                        />
                    </div>

                    <div className={`standard-modal-body ${errorMessage || departmentLoadingPromise ? 'loading' : ''}`}>
                        {
                            errorMessage || departmentLoadingPromise ? (
                                <React.Fragment>
                                    {
                                        errorMessage ? (
                                            <ErrorMessage
                                                message={errorMessage}
                                            />
                                        ) : (
                                            <React.Fragment>
                                                <RotatingLines
                                                    strokeColor="#F58634"
                                                    strokeWidth="5"
                                                    animationDuration="0.75"
                                                    width="50"
                                                    visible={true}
                                                />

                                                <p>Loading...</p>
                                            </React.Fragment>
                                        )
                                    }
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                    <label className={`expanded-input-wrapper`} htmlFor="department">
                                        <div className="expanded-input-content">
                                            <Select
                                                className="expanded-input-select"
                                                placeholder="Select a department"
                                                options={!departmentOptions ? [] : departmentOptions.map(dpt => (
                                                    { value: dpt, label: dpt.name }
                                                ))}
                                                sortBy="label"
                                                values={department.name ? [{ value: department, label: department.name }] : []}
                                                onChange={e => {
                                                    const value = e[0].value;

                                                    setTeamOptions([])
                                                    setDepartment(value)
                                                }}
                                                noDataLabel="No departments could be found"
                                                backspaceDelete={false}
                                                searchable={false}
                                            />
                
                                            <label className="expanded-input-label" htmlFor="department">Department*</label>
                                        </div>
                                    </label>

                                    {
                                        department._id ? (
                                            <React.Fragment>
                                                <label className={`expanded-input-wrapper`} htmlFor="team">
                                                    <div className="expanded-input-content">
                                                        <Select
                                                            className="expanded-input-select"
                                                            placeholder="Select a team"
                                                            options={!teamOptions ? [] : teamOptions.map(team => (
                                                                { value: team, label: team.name }
                                                            ))}
                                                            sortBy="label"
                                                            noDataLabel="No teams could be found"
                                                            values={[]}
                                                            onChange={e => {
                                                                if (e.length > 0) {
                                                                    const value = e[0].value;

                                                                    handleSubmit(value)
                                                                }
                                                            }}
                                                            backspaceDelete={false}
                                                            searchable={false}
                                                            loading={teamLoadingPromise}
                                                        />
                            
                                                        <label className="expanded-input-label" htmlFor="team">Team*</label>
                                                    </div>
                                                </label>
                                            </React.Fragment>
                                        ) : null
                                    }
                                </React.Fragment>
                            )
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TeamLookup