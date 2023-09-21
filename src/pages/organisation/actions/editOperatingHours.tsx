import React, { useState } from "react"
import Select from "react-dropdown-select"
import { usePromiseTracker } from "react-promise-tracker"
import ErrorMessage from "../../../components/error/error"
import InlinePromiseTracker from "../../../components/promiseTrackers/inlineTracker"

const EditOperatingHours: React.FC<{
    closeModal: () => void,
    submitOperatingHours: (editValues: { [key: string]: any }) => void,
    existingHours: { from: string, to: string },
    error: boolean
}> = ({ closeModal, submitOperatingHours, existingHours, error }): JSX.Element => {
    const [newOperatingHours, setNewOperatingHours] = useState<{ from: string, to: string}>(existingHours)

    const [errors, setErrors] = useState({
        ["operatingHours.from"]: false,
        ["operatingHours.to"]: false
    })

    const [hourOptions, setHourOptions] = useState<string[]>(["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"])
    const [minuteOptions, setMinuteOptions] = useState<string[]>(["00", "15", "30", "45"])

    const handleChangeTimings = (e: { value: string }[], key: string): void => {
        const keyName = key.split(":")[0];
        const keyPart = key.split(":")[1];

        const value = e[0].value;

        const parts = ["hour", "minute"];

        let newValue = (newOperatingHours as any)[keyName].split(":");
        newValue[parts.indexOf(keyPart)] = value;
        newValue = newValue.join(":");

        setNewOperatingHours({
            ...newOperatingHours,
            [keyName]: newValue
        })

        setErrors({
            ...errors,
            [`operatingHours.${keyName}`]: false
        })
    }

    const handleDataValidation = (): boolean => {
        let errorsCount: number = 0;
        let errorsObject: { [key: string]: boolean } = {};

        // Check that all times & actions are valid
        if(/^([0-9]{2})+:+([0-9]{2})$/.test(newOperatingHours.from) === false) {
            errorsCount++;
            errorsObject["operatingHours.from"] = true;
        }

        if(/^([0-9]{2})+:+([0-9]{2})$/.test(newOperatingHours.to) === false) {
            errorsCount++;
            errorsObject["operatingHours.to"] = true;
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

    const handleSubmit = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();

        if(handleDataValidation() === true) {
            submitOperatingHours({
                operatingHours: {
                    from: newOperatingHours.from,
                    to: newOperatingHours.to
                }
            })    
        }
    }

    const editPromise = usePromiseTracker({ area: "editTeam" }).promiseInProgress;

    return (
        <React.Fragment>
            <div className="modal-backdrop show">
                <div className="modal-wrapper-container">
                    <div className="standard-modal medium-width">
                        <div className="standard-modal-title">
                            <h3>Edit operating hours</h3>

                            <button
                                className="close-modal-button"
                                onClick={closeModal}
                                disabled={editPromise}
                            />
                        </div>

                        <div className="standard-modal-body">
                            <table className="structural-table" style={{borderSpacing: 10}}>
                                <tbody>
                                    <tr>
                                        <td style={{textAlign: 'center', width: '50%'}}>From</td>
                                        <td style={{textAlign: 'center', width: '50%'}}>To</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div className="time-select-wrapper">
                                                {/* Hours */}
                                                <Select
                                                    className={`standard-select mini ${errors["operatingHours.from"]=== true ? 'error' : ''}`}
                                                    style={{ width: 60 }}
                                                    options={hourOptions.map(hour => {
                                                        return { value: hour }
                                                    })}
                                                    labelField={"value"}
                                                    values={[{ value: newOperatingHours.from.split(":")[0] }]}
                                                    placeholder="-"
                                                    multi={false}
                                                    backspaceDelete={false}
                                                    searchable={false}
                                                    onChange={(e) => handleChangeTimings(e, 'from:hour')}
                                                    disabled={editPromise}
                                                />
                                                :
                                                {/* Minutes */}
                                                <Select
                                                    className={`standard-select mini ${errors["operatingHours.from"] === true ? 'error' : ''}`}
                                                    style={{ width: 60 }}
                                                    options={minuteOptions.map(minute => {
                                                        return { value: minute }
                                                    })}
                                                    labelField={"value"}
                                                    values={[{ value: newOperatingHours.from.split(":")[1] }]}
                                                    placeholder="-"
                                                    multi={false}
                                                    backspaceDelete={false}
                                                    searchable={false}
                                                    onChange={(e) => handleChangeTimings(e, 'from:minute')}
                                                    disabled={editPromise}
                                                />
                                            </div>
                                        </td>

                                        <td>
                                            <div className="time-select-wrapper">
                                                {/* Hours */}
                                                <Select
                                                    className={`standard-select mini ${errors["operatingHours.to"]=== true ? 'error' : ''}`}
                                                    style={{ width: 60 }}
                                                    options={hourOptions.map(hour => {
                                                        return { value: hour }
                                                    })}
                                                    labelField={"value"}
                                                    values={[{ value: newOperatingHours.to.split(":")[0] }]}
                                                    placeholder="-"
                                                    multi={false}
                                                    backspaceDelete={false}
                                                    searchable={false}
                                                    onChange={(e) => handleChangeTimings(e, 'to:hour')}
                                                    disabled={editPromise}
                                                />
                                                :
                                                {/* Minutes */}
                                                <Select
                                                    className={`standard-select mini ${errors["operatingHours.to"] === true ? 'error' : ''}`}
                                                    style={{ width: 60 }}
                                                    options={minuteOptions.map(minute => {
                                                        return { value: minute }
                                                    })}
                                                    labelField={"value"}
                                                    values={[{ value: newOperatingHours.to.split(":")[1] }]}
                                                    placeholder="-"
                                                    multi={false}
                                                    backspaceDelete={false}
                                                    searchable={false}
                                                    onChange={(e) => handleChangeTimings(e, 'to:minute')}
                                                    disabled={editPromise}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {
                                errors["operatingHours.from"] || errors["operatingHours.to"] ? (
                                    <ErrorMessage
                                        message="Please ensure that opening hours are formatted correctly"
                                    /> 
                                ) : null
                            }
                        </div>

                        <div className="standard-modal-footer">
                            <button
                                className="standard-button green"
                                onClick={handleSubmit}
                                disabled={editPromise}
                            >Save team</button>
                        </div>

                        {
                            editPromise || error ? (
                                <div className="standard-modal-additional-info">
                                    <InlinePromiseTracker
                                        searchArea="editTeam"
                                    />

                                    {
                                        error ? (
                                            <ErrorMessage
                                                message="There was an error editing this team, please try again"
                                            />
                                        ) : null
                                    }
                                </div>
                            ) : null
                        }
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default EditOperatingHours