import React, { useEffect, useState } from "react"
import { decodeToken } from "react-jwt";
import { useDispatch, useSelector } from "react-redux";
import ProtectedLoadingScreen from "../../components/loadingScreens/protectedLoadingScreen"
import { resetUserAuthentication, UserRecord } from "../../store/features/system/userAuthentication";
import { RootState } from "../../store/store";

// Screens
import PageOne from "./screens/page1";

// CSS
import "./createAccount-styles.scss";
import PageTwo from "./screens/page2";
import PageThree from "./screens/page3";
import DecisionWindow from "../../components/decisionWindow/decisionWindow";
import { resetNewAccount, setNewAccount } from "../../store/features/account/newAccount";
import FullScreenPromiseTracker from "../../components/promiseTrackers/fullScreenTracker";

const CreateAccount: React.FC = (): JSX.Element => {
    const userDetails = useSelector((state: RootState) => state.userAuthentication);
    const newAccountData = useSelector((state: RootState) => state.newAccount);

    const dispatch = useDispatch();

    const [authState, setAuthState] = useState<string>("pending");
    const [showResume, setShowResume] = useState<boolean>(false);

    const checkExistingAuth = (): void => {
        const accessToken = userDetails.accessToken;
        const decodedAccessToken: UserRecord | null = decodeToken(accessToken);

        if(userDetails.emailAddress !== "" && userDetails.emailAddress === decodedAccessToken?.emailAddress) {
            window.location.href = "/"
        } else {
            // Check if account creation in progress
            const inProgress = Object.values(newAccountData.completePages).some(i => i === true);

            if(inProgress) {
                setShowResume(true)
            } else {
                setAuthState("authenticated")
                dispatch(resetUserAuthentication())
            }
        }
    }

    useEffect(() => {
        if(authState === "pending") {
            checkExistingAuth();
        }
    }, [])

    const handleResumeExistingProgress = (e: React.FormEvent<HTMLButtonElement>): void => {
        const currentPage = Object.values(newAccountData.completePages).findIndex(i => i === false);
        
        dispatch(setNewAccount({
            activePage: currentPage >= 0 ? (currentPage as any) + 1 : 1
        }))

        setAuthState("authenticated")
    }

    const handleRestartProgress = (): void => {
        dispatch(resetNewAccount());
        setAuthState("authenticated")
    }

    const getScreenContent = (): JSX.Element => {
        switch (newAccountData.activePage) {
            case 1:
                return <PageOne />

            case 2:
                return <PageTwo />

            case 3:
                return <PageThree />

            default:
                return <></>
        }
    }

    switch (authState) {
        case "pending":
            return (
                <React.Fragment>
                    <ProtectedLoadingScreen />

                    {
                        showResume ? (
                            <DecisionWindow
                                title="Resume unfinished progress"
                                bodyJsx={[
                                    <p>It seems you have already started creating a new account that hasn't been finished. Would you like to resume your progress?</p>
                                ]}
                                closeModal={() => handleRestartProgress()}
                                acceptFunction={handleResumeExistingProgress}
                                hideCloseButton={true}
                                acceptButtonText="Resume"
                                declineButtonText="Start again"
                            />
                        ) : null
                    }
                </React.Fragment>
            )

        case "authenticated":
            return (
                <React.Fragment>
                    <FullScreenPromiseTracker
                        message="Setting up account..."
                        searchArea="createAccount"
                    />

                    <div className="create-outer-container">
                        <div className="create-body-container">
                            <div className="create-body-inner-container">
                                <h1 style={{ textAlign: "center" }}>Create your free account</h1>
                                
                                <div className="progress-bar-container">
                                    {
                                        [1, 2, 3].map((stage) => {
                                            return (
                                                <React.Fragment>
                                                    <div className={`progress-bar-stage ${stage < newAccountData.activePage ? "active" : ""}`}>
                                                        <div className="progress-bar-stage-inner">
                                                            {stage}
                                                        </div>
                                                    </div>

                                                    {
                                                        stage < 3 ? (
                                                            <hr className={`progress-bar-stage ${stage < newAccountData.activePage ? "active" : ""}`} />
                                                        ) : null
                                                    }
                                                </React.Fragment>
                                            )
                                        })
                                    }
                                </div>

                                <br/>
                                <br/>
                                <br/>

                                { getScreenContent() }
                            </div>

                            <div className="create-body-footer">
                                Already have an account?&nbsp;
                                <button 
                                    className="underline-text-link"
                                    onClick={() => window.location.href = "/login"}
                                >Sign in</button>
                            </div>
                        </div>

                        <div className="create-caddy-container">
                            <img
                                style={{ width: "75%" }}
                                src="/assets/images/rotasense-logo-long.png"
                            />

                            <ul className="selling-points-list">
                                <li>
                                    <span>
                                        <h3>Unlimited teams & users</h3>
                                        <p>There are no limitations on the number of departments, teams or users you can create</p>
                                    </span>
                                </li>

                                <li>
                                    <span>
                                        <h3>No card details required</h3>
                                        <p>Rotasense aims to provide a 'free-forever' model, given users abide to fair usage policies</p>
                                    </span>
                                </li>

                                <li>
                                    <span>
                                        <h3>Quick sign up</h3>
                                        <p>Signing up and setting up your account takes as little as 60 seconds, no complications.</p>
                                    </span>
                                </li>

                                <li>
                                    <span>
                                        <h3>Cancel anytime</h3>
                                        <p>You cancel and destroy your data at anytime, free of charge.</p>
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </React.Fragment>
            )

        default:
            return <></>
    }
}

export default CreateAccount