import axios from "axios";
import axiosRetry from "axios-retry";
import React, { useState } from "react"
import DatePicker, { DateObject } from "react-multi-date-picker";
import { trackPromise, usePromiseTracker } from "react-promise-tracker";
import { useDispatch, useSelector } from "react-redux";
import ErrorMessage from "../../../../components/error/error";
import InlinePromiseTracker from "../../../../components/promiseTrackers/inlineTracker";
import { setSchedule } from "../../../../store/features/schedules/schedule";
import { RootState } from "../../../../store/store";
import { SuccessResponse } from "../../../../types.config";
import UserLookup, { UserAbbrev } from "../../../organisation/actions/userLookup";

interface DuplicateSchedule {
    to: {
        _id: string,
        name: string
    },
    dates: string[]
}

axiosRetry(axios, {
    retries: 5,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

const DuplicateSchedule: React.FC<{
    user: { _id: string, name: string },
    closeModal: () => void
}> = ({ user, closeModal }): JSX.Element => {
    const userDetails = useSelector((state: RootState) => state.userAuthentication);
    const scheduleDetails = useSelector((state: RootState) => state.schedule);

    const dispatch = useDispatch();

    const [errorMessage, setErrorMessage] = useState<string>("")
    const [errors, setErrors] = useState({
        to: false,
        dates: false,
        error: false
    })

    const [showUserLookup, setShowUserLookup] = useState<boolean>(false);

    const [showWarnings, setShowWarnings] = useState({
        overwrite: true,
        actions: true
    })

    const [duplicateData, setDuplicateData] = useState<DuplicateSchedule>({
        to: {
            _id: "",
            name: ""
        },
        dates: []
    })

    const handleSelectUser = (user: UserAbbrev): void => {
        setDuplicateData({
            ...duplicateData,
            to: {
                _id: user._id,
                name: user.fullName
            }
        })

        setErrors({
            ...errors,
            to: false,
            error: false
        })

        setShowUserLookup(false);
    }

    const handleDataValidation = (): boolean => {
        let errorsCount: number = 0;
        let errorsObject: { [key: string]: boolean } = {};

        if(duplicateData.to._id === "") {
            errorsCount++;
            errorsObject.to = true;
        }

        if(duplicateData.dates.length === 0) {
            errorsCount++;
            errorsObject.dates = true;
        }

        if(errorsCount === 0) {
            return true
        } else {
            setErrors({
                ...errors,
                ...errorsObject
            })

            return false
        }
    }

    const handleSubmit =  async (e: React.FormEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();

        if(handleDataValidation() === true) {
            trackPromise(
                new Promise<void>( async (resolve) => {
                    await axios({
                        method: "COPY",
                        url: process.env.REACT_APP_BACKEND_BASE_URL + `/schedules/${scheduleDetails.team._id}/${user._id}`,
                        headers: {
                            Authorization: "Bearer " + userDetails.accessToken
                        },
                        data: {
                            scheduleId: scheduleDetails._id,
                            destinationUserId: duplicateData.to._id,
                            dates: duplicateData.dates
                        }
                    })
                    .then((value: { data: SuccessResponse }) => {
                        const response = value.data;
    
                        if(response.success === true) {
                            if(duplicateData.dates.includes(scheduleDetails.date)) {
                                let allSchedules = Array.from(scheduleDetails.schedules);
                                const editIndex = allSchedules.findIndex(i => i.member._id === duplicateData.to._id);
    
                                allSchedules[editIndex] = {
                                    ...allSchedules[editIndex],
                                    schedule: response.data.newSchedule,
                                    submitted: true
                                }
    
                                dispatch(setSchedule({
                                    schedules: allSchedules
                                }))
    
                                closeModal();
                                resolve();
                            }
    
                            resolve()
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
                        setErrorMessage("Oops, there was a technical error, please try again")
                        setErrors({
                            ...errors,
                            error: true
                        })
    
                        resolve()
                    })
                })
            , "duplicateSchedule")
        }
    }

    const submitPromise = usePromiseTracker({ area: "duplicateSchedule" }).promiseInProgress;

    return (
        <React.Fragment>
            <div className="modal-backdrop show">
                <div className="modal-wrapper-container">
                    <div className={`standard-modal medium-width`}>
                        <div className="standard-modal-title">
                            <h3>Duplicate schedule</h3>

                            <button
                                className="close-modal-button"
                                onClick={closeModal}
                            />
                        </div>

                        <div className="standard-modal-body">
                            <h5 style={{ margin: "0px 0px 10px 0px" }}>Copy to...</h5>

                            {
                                duplicateData.to._id === "" ? (
                                    <button
                                        className="plain-text-link"
                                        onClick={() => setShowUserLookup(true)}
                                        disabled={submitPromise}
                                    ><i style={{fontSize: 16}} className="fa-solid fa-magnifying-glass"/> Select team member</button>
                                ) : (
                                    <div className="flex-container">
                                        <p style={{ fontSize: 16 }}>{duplicateData.to.name}<br/><span className="secondary-text" style={{fontSize: 14}}>{duplicateData.to._id}</span></p>
                                        <button
                                            className="remove-button"
                                            disabled={submitPromise}
                                            onClick={() => {
                                                setDuplicateData({
                                                    ...duplicateData,
                                                    to: {
                                                        _id: "",
                                                        name: ""
                                                    }
                                                })
                                            }}
                                        />
                                    </div>
                                )
                            }

                            {
                                errors.to ? (
                                    <ErrorMessage
                                        message="Please select a team member to copy the schedule to"
                                    />
                                ) :  null
                            }

                            <h5 style={{ marginBottom: 10 }}>Date(s)</h5>
                            
                            <DatePicker
                                multiple={true}
                                render={(value, openCalendar) => {
                                    return (
                                        <div 
                                            className={`date-picker-front ${errors.dates ? 'error' : ''}`}
                                            onClick={openCalendar}
                                            style={{ justifyContent: "center", minWidth: 160, marginBottom: 10 }}
                                        >Open calendar</div> 
                                    )
                                }}
                                onChange={(e: DateObject[]) => {
                                    setDuplicateData({
                                        ...duplicateData,
                                        dates: e.map((obj): string => {
                                            return new Date(obj.unix * 1000 + 7200000).toISOString().substring(0, 10);
                                        })
                                    })

                                    setErrors({
                                        ...errors,
                                        dates: false,
                                        error: false
                                    })
                                }}
                            />

                            {
                                duplicateData.dates.length === 0 ? (
                                    <p className="secondary-text">No dates selected yet</p>
                                ) : (
                                    <React.Fragment>
                                        <ul style={{ marginTop: 5 }}>
                                            {
                                                duplicateData.dates.map(date => (
                                                    <li>{new Date(date).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric"})}</li>
                                                ))
                                            }
                                        </ul>
                                    </React.Fragment>
                                )
                            }

                            {
                                errors.dates ? (
                                    <ErrorMessage
                                        message="Please select at least one date to copy to"
                                    />
                                ) : null
                            }

                            {
                                showWarnings.overwrite ? (
                                    <div className="text-box with-ignore warning" style={{ marginTop: 20 }}>
                                        <div className="text-box-body">
                                            <p>Please note that by duplicating, any existing schedules on the chosen date(s) will be overwritten.</p>

                                            <button 
                                                className="ignore-text-box-button"
                                                onClick={() => {
                                                    setShowWarnings({
                                                        ...showWarnings,
                                                        overwrite: false
                                                    })
                                                }}
                                            >Ignore</button>
                                        </div>
                                        
                                    </div>
                                ) : null
                            }
                            
                            {
                                showWarnings.actions ? (
                                    <div className="text-box with-ignore info" style={{ marginTop: 20 }}>
                                        <div className="text-box-body">
                                            <p>If certain actions are unavailable to the selected team member, they will be left blank in the new schedule.</p>

                                            <button 
                                                className="ignore-text-box-button"
                                                onClick={() => {
                                                    setShowWarnings({
                                                        ...showWarnings,
                                                        actions: false
                                                    })
                                                }}
                                            >Ignore</button>
                                        </div>
                                    </div>
                                ) : null
                            }
                        </div>

                        <div className="standard-modal-footer">
                            <button
                                className="standard-button green"
                                onClick={handleSubmit}
                                disabled={submitPromise}
                            >Confirm</button>
                        </div>

                        {
                            submitPromise || errors.error ? (
                                <div className="standard-modal-additional-info">
                                    <InlinePromiseTracker
                                        searchArea="duplicateSchedule"
                                    />

                                    {
                                        errors.error ? (
                                            <ErrorMessage
                                                message={errorMessage}
                                            />
                                        ) : null
                                    }
                                </div>
                            ) : null
                        }
                    </div>
                </div>
            </div>

            {
                showUserLookup ? (
                    <UserLookup
                        closeModal={() => setShowUserLookup(false)}
                        handleSelectUser={handleSelectUser}
                    />
                ) : null
            }
        </React.Fragment>
    )
}

export default DuplicateSchedule