import axios from "axios";
import axiosRetry from "axios-retry";
import React, { useEffect, useState } from "react"
import { decodeToken } from "react-jwt";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import ProtectedLoadingScreen from "./components/loadingScreens/protectedLoadingScreen";
import Layout from "./layout";
import { resetUserAuthentication, UserRecord } from "./store/features/userAuthentication";
import { RootState } from "./store/store";
import { SuccessResponse } from "./types.config";

axiosRetry(axios, {
    retries: 5,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

const ProtectedRoute: React.FC<{
    children: JSX.Element,
    freeLayout?: boolean
}> = ({ children, freeLayout }): JSX.Element => {
    const dispatch = useDispatch();

    const userDetails = useSelector((state: RootState) => state.userAuthentication);

    const [authState, setAuthState] = useState<string>("pending")
    const [showExpired, setShowExpired]  = useState<boolean>(false);
    const [redirectionCount, setRedirectionCount] = useState<number>(6);
    const [accessTokenValid, setAccessTokenValid] = useState<boolean>(false);
    
    const location = useLocation();
    
    const validateURLPathAccess = async (): Promise<void> => {
        const accessToken = userDetails.accessToken;
        const decodedAccessToken: UserRecord | null = decodeToken(accessToken);

        // Check if user authentication is present
        if(userDetails.emailAddress === "" || userDetails.emailAddress !== decodedAccessToken?.emailAddress) {
            dispatch(resetUserAuthentication());
            window.location.href = "/login";
            return;
        } else {
            setAccessTokenValid(true);
        }

        // Check if user authentication is valid
        await axios({
            method: "POST",
            url: process.env.REACT_APP_BACKEND_BASE_URL + '/account/path-access',
            headers: {
                "X-Requested-URL": location.pathname,
                Authorization: "Bearer " + accessToken
            }
        })
        .then((value: { data: SuccessResponse }) => {
            const response = value.data;

            if(response.success === true) {
                setAuthState("authenticated")
            } else {
                setAuthState("error")
            }
        })
        .catch((err) => {
            if(err.response.status === 403) {
                dispatch(resetUserAuthentication())
                setShowExpired(true);
                setRedirectionCount(5)
            } else if (err.response.status === 401) {
                setAuthState("forbidden")
            } else {
                setAuthState("error")
            }
        })
    }

    useEffect(() => {
        if(showExpired) {
            if(redirectionCount > 0) {
                setTimeout(() => {
                    setRedirectionCount(redirectionCount - 1)
                }, 1000)
            } else {
                window.location.href = "/login"
            }
        }
    }, [redirectionCount])

    useEffect(() => {
        validateURLPathAccess();
    }, [])

    switch (authState) {
        case "pending":
            return (
                <React.Fragment>
                    { accessTokenValid ? <ProtectedLoadingScreen/> : <></>}

                    {
                        showExpired ? (
                            <div className="modal-backdrop show">
                                <div className="modal-wrapper-container">
                                    <div className="standard-modal medium-width">
                                        <div className="standard-modal-body">
                                            <i className="fa-solid fa-arrow-up-right-from-square large-icon"></i>

                                            <br/>

                                            <h2>Your session has expired</h2>

                                            <p>Your access has expired. You will now be redirected to the log in page in {redirectionCount}</p>

                                            <br/>

                                            <a href="/login" className="standard-button green">Redirect now</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null
                    }
                </React.Fragment>
            )

        case "authenticated":
            return (
                <Layout freeLayout={freeLayout}>
                    {children}
                </Layout>
            )

        default: {
            return <></>
        }
    }
}

export default ProtectedRoute