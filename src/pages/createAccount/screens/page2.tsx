import React, { useEffect, useState } from "react"
import Select from "react-dropdown-select";
import { usePromiseTracker } from "react-promise-tracker";
import { useDispatch, useSelector } from "react-redux"
import ErrorMessage from "../../../components/error/error";
import { setNewAccount } from "../../../store/features/account/newAccount";
import { RootState } from "../../../store/store"

// ** ORGANISATION DETAILS ** //
const PageTwo: React.FC = (): JSX.Element => {
    const userDetails = useSelector((state: RootState) => state.userAuthentication);
    const newAccountData = useSelector((state: RootState) => state.newAccount);

    const dispatch = useDispatch();

    const [errorMessage, setErrorMessage] = useState<string>("");
    const [errors, setErrors] = useState({
        name: false,
        sector: false,
        employeeSize: false,
        error: false
    })

    const handleFillInForm = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;

        dispatch(setNewAccount({
            completePages: {
                2: false
            },
            organisation: {
                [name]: value
            }
        }))

        setErrors({
            ...errors,
            [name]: false,
            error: false
        })
    }

    const handleDataValidation = async (): Promise<boolean> => {
        let errorsCount: number = 0;
        let errorsObject: { [key: string]: boolean } = {};

        ["name", "sector", "employeeSize"].forEach(key => {
            if(newAccountData.organisation[(key as "name" | "sector" | "employeeSize")].length < 2) {
                errorsCount++;
                errorsObject[key] = true
            } 
        })

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

    const goToNextPage = async (e: React.FormEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();

        const validation = await handleDataValidation();

        if(validation === true) {
            dispatch(setNewAccount({
                activePage: 3,
                completePages: {
                    2: true
                }
            }))
        }
    }

    const submitPromise = usePromiseTracker({ area: "createAccount" }).promiseInProgress;

    return (
        <React.Fragment>
            <label className={`expanded-input-wrapper orange ${errors.name ? 'error attached' : ''}`} htmlFor="name">
                <div className="expanded-input-content">
                    <input
                        id="name"
                        className="expanded-input"
                        placeholder="e.g. My Business Ltd"
                        autoComplete="off"
                        name="name"
                        value={newAccountData.organisation.name}
                        onChange={handleFillInForm}
                        disabled={submitPromise}
                    />

                    <label className="expanded-input-label" htmlFor="name">Organisation name*</label>
                </div>
            </label>

            {
                errors.name ? (
                    <ErrorMessage
                        message="Please enter name of your organisation"
                        attached={true}
                        bottomSpacing="20px"
                    />
                ) : null
            }

            <label className={`expanded-input-wrapper orange ${errors.sector ? 'error attached' : ''}`} htmlFor="sector">
                <div className="expanded-input-content">
                    <Select
                        className="expanded-input-select"
                        placeholder="Select a sector"
                        options={[
                            { value: "Agriculture" },
                            { value: "Apparel manufacturing" },
                            { value: "Construction" },
                            { value: "Education" },
                            { value: "Finance & accounting" },
                            { value: "Fishing & hunting" },
                            { value: "Food manufacturing" },
                            { value: "Food & beverages" },
                            { value: "Insurance" },
                            { value: "IT & computing" },
                            { value: "Media" },
                            { value: "Mining" },
                            { value: "Motor vehicles" },
                            { value: "Museums" },
                            { value: "Oil & gas" },
                            { value: "Post & delivery services" },
                            { value: "Real estate" },
                            { value: "Retail & shopping" },
                            { value: "Telecommunications" },
                            { value: "Transportation" },
                            { value: "Utilities" },
                            { value: "Warehousing & storage" },
                            { value: "Other" }
                        ]}
                        labelField="value"
                        values={newAccountData.organisation.sector ? [{ value: newAccountData.organisation.sector }] : []}
                        onChange={e => {
                            const value = e[0].value;

                            dispatch(setNewAccount({
                                organisation: {
                                    sector: value
                                }
                            }))

                            setErrors({
                                ...errors,
                                sector: false,
                                error: false
                            })
                        }}
                        backspaceDelete={false}
                        searchable={true}
                        disabled={submitPromise}
                    />

                    <label className="expanded-input-label" htmlFor="sector">Sector*</label>
                </div>
            </label>

            {
                errors.sector ? (
                    <ErrorMessage
                        message="Please enter sector of your organisation"
                        attached={true}
                        bottomSpacing="20px"
                    />
                ) : null
            }

            <label className={`expanded-input-wrapper orange ${errors.employeeSize ? 'error attached' : ''}`} htmlFor="employeeSize">
                <div className="expanded-input-content">
                <Select
                        className="expanded-input-select"
                        placeholder="Select an option"
                        options={[
                            { value: "1-10" },
                            { value: "11-50" },
                            { value: "51-100" },
                            { value: "101-500" },
                            { value: "500+" }
                        ]}
                        labelField="value"
                        values={newAccountData.organisation.employeeSize ? [{ value: newAccountData.organisation.employeeSize }] : []}
                        onChange={e => {
                            const value = e[0].value;

                            dispatch(setNewAccount({
                                organisation: {
                                    employeeSize: value
                                }
                            }))

                            setErrors({
                                ...errors,
                                employeeSize: false,
                                error: false
                            })
                        }}
                        backspaceDelete={false}
                        searchable={false}
                        disabled={submitPromise}
                    />

                    <label className="expanded-input-label" htmlFor="employeeSize">Number of employees*</label>
                </div>
            </label>

            {
                errors.employeeSize ? (
                    <ErrorMessage
                        message="Please enter number of employees in your organisation"
                        attached={true}
                        bottomSpacing="20px"
                    />
                ) : null
            }

            <br/>
            <br/>

            <div className="form-navigation-button-container">
                <button
                    className="go-back-button"
                    onClick={() => {
                        dispatch(setNewAccount({
                            activePage: 1
                        }))
                    }}
                />
                <button 
                    className="standard-button green"
                    disabled={submitPromise}
                    onClick={goToNextPage}
                >Continue</button>
            </div>
        </React.Fragment>
    )
}

export default PageTwo