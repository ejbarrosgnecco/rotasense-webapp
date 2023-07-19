import axios from "axios";
import axiosRetry from "axios-retry";
import React, { useEffect, useState } from "react"
import { trackPromise, usePromiseTracker } from "react-promise-tracker";
import { useDispatch, useSelector } from "react-redux";
import { resetUserAuthentication, setUserAuthentication, UserRecord } from "../../store/features/userAuthentication";
import { SuccessResponse } from "../../types.config";
import { decodeToken } from "react-jwt";

import "./login-styles.scss";
import { RootState } from "../../store/store";
import InlinePromiseTracker from "../../components/promiseTrackers/inlineTracker";
import ErrorMessage from "../../components/error/error";

axiosRetry(axios, {
    retries: 5,
    retryDelay: (retryCount) => {
       console.log(`Error - retry attempt: ${retryCount}`)
       return retryCount * 500
    }
})

const Login: React.FC = (): JSX.Element => {
    const userDetails = useSelector((state: RootState) => state.userAuthentication);

    const dispatch = useDispatch();

    const [authState, setAuthState] = useState<string>("pending")

    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [credentials, setCredentials] = useState<{ emailAddress: string, password: string }>({
        emailAddress: "",
        password: ""
    })

    const [errorMessage, setErrorMessage] = useState<string>("")
    const [errors, setErrors] = useState({
        emailAddress: false,
        password: false,
        error: false
    })

    const checkExistingAuth = (): void => {
        const accessToken = userDetails.accessToken;
        const decodedAccessToken: UserRecord | null = decodeToken(accessToken);

        if(userDetails.emailAddress !== "" && userDetails.emailAddress === decodedAccessToken?.emailAddress) {
            window.location.href = "/"
        } else {
            setAuthState("authenticated")
            dispatch(resetUserAuthentication())
        }
    }

    useEffect(() => {
        checkExistingAuth();
    }, [])

    const handleFillInForm = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;

        setErrors({
            ...errors,
            [name]: false,
            error: false
        })

        setCredentials({
            ...credentials,
            [name]: value
        })
    }

    const handleDataValidation = (): boolean => {
        let errors_count: number = 0;
        let errors_object: { [key: string]: boolean } = {};

        if(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,6}$/.test(credentials.emailAddress) === false) {
            errors_count++;
            errors_object.emailAddress = true;
        }

        if(credentials.password === "") {
            errors_count++;
            errors_object.password = true;
        }

        if(errors_count === 0) {
            return true
        } else {
            setErrors({
                ...errors,
                ...errors_object
            })

            return false;
        }
    }

    const handleSubmitLogin = async (e: React.FormEvent<HTMLButtonElement | HTMLInputElement>): Promise<void> => {
        e.preventDefault();

        if(handleDataValidation() === true) {
            trackPromise(
                new Promise<void>( async (resolve) => {
                    await axios({
                        method: "POST",
                        url: process.env.REACT_APP_BACKEND_BASE_URL + "/account/login",
                        data: credentials
                    })
                    .then( async (value: { data: SuccessResponse }) => {
                        const response = value.data;

                        if(response.success === true) {
                            const decodedToken: UserRecord | null = decodeToken(response.data.accessToken);                            
                            
                            dispatch(setUserAuthentication({
                                userId: decodedToken?.userId || "",
                                emailAddress: decodedToken?.emailAddress || "",
                                firstName: decodedToken?.firstName || "",
                                lastName: decodedToken?.lastName || "",
                                organisation: {
                                    _id: decodedToken?.organisation._id || "",
                                    name: decodedToken?.organisation.name || ""
                                },
                                team: {
                                    _id: decodedToken?.team._id || "",
                                    name: decodedToken?.team.name || ""
                                },
                                profile: decodedToken?.profile || "",
                                role: decodedToken?.role || "",
                                accessToken: response.data.accessToken
                            }));

                            setTimeout(() => {
                                window.location.href = "/schedules"
                                resolve();
                            }, 500)
                        } else {
                            setErrorMessage(response.reason || "")
                            setErrors({
                                ...errors,
                                error: true
                            })

                            resolve();
                        }
                    })
                    .catch(() => {
                        setErrorMessage("Oops there was a technical error, please try again")
                        setErrors({
                            ...errors,
                            error: true
                        })

                        resolve();
                    })
                })
            , 'submit_login')
        }
    }

    const loginPromise = usePromiseTracker({ area: "submit_login" }).promiseInProgress;

    switch (authState) {
        case "pending":
            return (
                <React.Fragment>
                    Splash page
                </React.Fragment>
            )

        case "authenticated":
            return (
                <div className="login-outer-container">
                    <div className="login-image-container"/>
        
                    <div className="login-body-container">
                        <div className="login-body-inner-container">
                            <h1>Welcome to RotaSense</h1>
                            <p>Sign into your account by entering your email address and password below</p>
        
                            <br/>
        
                            <label className={`expanded-input-wrapper email ${errors.emailAddress ? 'error' : ''}`} htmlFor="emailAddress">
                                <div className="expanded-input-content">
                                    <input
                                        id="emailAddress"
                                        className="expanded-input"
                                        placeholder="e.g. joe.bloggs@mycompany.com"
                                        autoComplete="off"
                                        name="emailAddress"
                                        value={credentials.emailAddress}
                                        onChange={handleFillInForm}
                                        disabled={loginPromise}
                                        onKeyDown={e => {
                                            if(e.key === "Enter") {
                                                handleSubmitLogin(e);
                                            }
                                        }}
                                    />
        
                                    <label className="expanded-input-label" htmlFor="emailAddress">Email address</label>
                                </div>
                            </label>

                            {
                                errors.emailAddress ? (
                                    <ErrorMessage
                                        message="Please enter a valid email address"
                                        bottomSpacing="20px"
                                    />
                                ) : null
                            }
        
                            <label className={`expanded-input-wrapper password ${errors.password ? 'error' : ''}`} htmlFor="password">
                                <div className="expanded-input-content">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        className="expanded-input"
                                        placeholder={showPassword ? 'MyPassword123!' : '••••••••••••••'}
                                        autoComplete="off"
                                        name="password"
                                        value={credentials.password}
                                        onChange={handleFillInForm}
                                        disabled={loginPromise}
                                        onKeyDown={e => {
                                            if(e.key === "Enter") {
                                                handleSubmitLogin(e);
                                            }
                                        }}
                                    />
        
                                    <label className="expanded-input-label" htmlFor="password">Password</label>
                                </div>
        
                                <button
                                    className={`show-password-button white ${showPassword ? 'show' : 'hide'}`}
                                    onClick={(e) => {e.preventDefault(); setShowPassword(!showPassword)}}
                                    disabled={loginPromise}
                                />
                            </label>

                            {
                                errors.password ? (
                                    <ErrorMessage
                                        message="Please enter your password"
                                        bottomSpacing="20px"
                                    />
                                ) : null
                            }
        
                            <div className="float-right">
                                <button className="plain-text-link">Forgotten your password?</button>
                            </div>
        
                            <br/>

                            {
                                errors.error ? (
                                    <ErrorMessage
                                        message={errorMessage}
                                        bottomSpacing="20px"
                                        topSpacing="-10px"
                                    />
                                ) : null
                            }
        
                            <div className="float-left">
                                <button 
                                    className="standard-button green"
                                    onClick={handleSubmitLogin}
                                >Log in</button>
                            </div>

                            

                            <InlinePromiseTracker
                                searchArea="submit_login"
                            />
        
                            <div className="or-breaker-container">
                                <hr/>
                                
                                <span>OR</span>
        
                                <hr/>
                            </div>
                            
                            <h3>Don't have an account yet?</h3>
                            <p>Set up a <u>free account</u> for your organisation and start planning your schedules.</p>
        
                            <button 
                                className="standard-button light-gray"
                                disabled={loginPromise}
                            >Set up account</button>
                        </div>
                    </div>
                </div>
            )
        
        default:
            return <></>
    }
    
}

export default Login