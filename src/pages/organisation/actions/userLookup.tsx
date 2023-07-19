import axios from "axios";
import axiosRetry from "axios-retry";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react"
import { trackPromise, usePromiseTracker } from "react-promise-tracker";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { SuccessResponse } from "../../../types.config";

export interface UserAbbrev {
    full_name: string,
    email_address: string
    _id: string
}

axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

const UserLookup: React.FC<{
    closeModal: Dispatch<SetStateAction<boolean>>,
    handleSelectUser: (user: UserAbbrev) => void
}> = ({ closeModal, handleSelectUser }): JSX.Element => {
    const userDetails = useSelector((state: RootState) => state.userAuthentication)
    
    const [filter, setFilter] = useState<string>("");
    const [users, setUsers] = useState<UserAbbrev[]>([]);

    const [errorMessage, setErrorMessage] = useState<string>("");
    const [error, setError] = useState<boolean>(false);

    const getUsers = async (): Promise<void> => {
        trackPromise(
            new Promise<void>( async (resolve) => {
                await axios({
                    method: "GET",
                    url: process.env.REACT_APP_BACKEND_BASE_URL + "/organisation/users",
                    params: {
                        abbreviated: true
                    },
                    headers: {
                        Authorization: "Bearer " + userDetails.accessToken
                    }
                })
                .then((value: { data: SuccessResponse }) => {
                    const response = value.data;

                    if(response.success === true) {
                        setUsers(response.data)
                        resolve();
                    } else {
                        setError(true);
                        setErrorMessage(response.reason || "");
                        resolve()
                    }
                })
                .catch(() => {
                    setError(true);
                    setErrorMessage("Oops, there was a technical error, please try again");
                    resolve()
                })
            })
        , "load_users")
    }

    useEffect(() => {
        if(users.length === 0) {
            getUsers();
        }
    }, [])

    const loadingPromise = usePromiseTracker({ area: "load_users" }).promiseInProgress;

    return (
        <div className="modal-backdrop show">
            <div className="modal-wrapper-container">
                <div className="standard-modal medium-width">
                    <div className="standard-modal-title">
                        <h3>User lookup</h3>

                        <button
                            className="close-modal-button"
                            onClick={() => closeModal(false)}
                        />
                    </div>

                    <div className="standard-modal-body">
                        <label className={`expanded-input-wrapper`} htmlFor="filter">
                            <div className="expanded-input-content">
                                <input
                                    id="filter"
                                    className="expanded-input"
                                    placeholder="Enter your search query"
                                    autoComplete="off"
                                    name="filter"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    disabled={loadingPromise}
                                />
    
                                <label className="expanded-input-label" htmlFor="filter">Search by name</label>
                            </div>
                        </label>

                        <div className="options-scroll-container">
                            {
                                users.filter(u => u.full_name.toLowerCase().includes(filter.toLowerCase())).map(user => {
                                    return (
                                        <div className="user-option" onClick={() => handleSelectUser(user)}>
                                            {user.full_name}
                                        </div>
                                    )
                                })
                            }

                            {
                                users.filter(u => u.full_name.toLowerCase().includes(filter.toLowerCase())).length === 0 ? (
                                    <p style={{ padding: 10 }}>No users could be found</p>
                                ) : null
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserLookup