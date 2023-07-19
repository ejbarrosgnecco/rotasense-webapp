import React, { useEffect, useRef, useState } from "react";
import Select from "react-dropdown-select";

import "./viewSchedulePart-styles.scss";

const ViewSchedulePart: React.FC<{
    schedulePart: { action: string, startTime: string, slots: number, coordinates: { x: number, y: number } },
    scheduleId: string,
    hideSchedulePart: () => void,
    availableActions: string[],
    availableHours: string[]
}> = ({ scheduleId, schedulePart, hideSchedulePart, availableActions, availableHours }): JSX.Element => {
    const modalRef = useRef(null);

    const [actionTimings, setActionTimings] = useState<{ startTime: string, endTime: string}>({
        startTime: schedulePart.startTime,
        endTime: new Date(new Date(`2023-02-02T${schedulePart.startTime}:00.000`).setMinutes(new Date(`2023-02-02T${schedulePart.startTime}:00.000`).getMinutes() + (schedulePart.slots * 15))).toTimeString().substring(0, 5)
    })

    const [editMode, setEditMode] = useState<boolean>(false);
    const [editValues, setEditValues] = useState({
        startTime: "",
        endTime: "",
        action: ""
    })

    const [availableMinutes, setAvailableMinutes] = useState<string[]>(["00", "15", "30", "45"]);

    const handleClickOutside = (e: any) => {
        const parent = document.getElementById("localised-modal");

        if(e.target !== parent && !parent?.contains(e.target)) {
            document.removeEventListener("mousedown", handleClickOutside)
            hideSchedulePart();
        }
    }

    const handleResetEditMode = (e: React.FormEvent<HTMLButtonElement>): void => {
        setEditValues({
            startTime: "",
            endTime: "",
            action: ""
        })

        setEditMode(false);
    }

    const handleStartEditMode = (e: React.FormEvent<HTMLButtonElement>): void => {
      setEditValues({
        startTime: actionTimings.startTime,
        endTime: actionTimings.endTime,
        action: schedulePart.action
      })

      setEditMode(true)
    }

    const handleEditTimes = (e: { value: string }[], key: string): void => {
        const value = e[0].value;

        const keyName = key.split(":")[0];
        const keyPart = key.split(":")[1];

        const parts = ["hour", "minute"];

        let prevValue = (editValues as any)[keyName].split(":");
        prevValue[parts.indexOf(keyPart)] = value;
        prevValue = prevValue.join(":")

        setEditValues({
            ...editValues,
            [keyName]: prevValue
        })
    }

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className="localised-modal" id="localised-modal" ref={modalRef} style={{ left: schedulePart.coordinates.x, top: schedulePart.coordinates.y}}>
            <div className="localised-modal-header">
                {
                    editMode ? (
                        <p style={{color: "#F58634"}}>Editing...</p>
                    ) : <br/>
                }

                <button
                    className="close-modal-button"
                    onClick={hideSchedulePart}
                />
            </div>

            <div className="localised-modal-body">
                <div className={`schedule-part-edit-columns ${editMode ? 'edit' : ""}`}>
                    <div>
                        {
                            editMode ? (
                                <Select
                                    className="standard-select mini"
                                    options={availableActions.map(action => {
                                        return { value: action }
                                    })}
                                    labelField="value"
                                    values={[{ value: editValues.action }]}
                                    placeholder="Select an action"
                                    multi={false}
                                    backspaceDelete={false}
                                    searchable={false}
                                    additionalProps={{
                                        id: "local-modal-edit",
                                        itemID: "local-modal-edit"
                                    }}
                                    onChange={(e) => {
                                        setEditValues({
                                            ...editValues,
                                            action: e[0].value
                                        })
                                    }}
                                />
                            ) : (
                                <h4>{schedulePart.action}</h4>
                            )
                        }

                        {
                            editMode ? (
                                <React.Fragment>
                                    <table className="structural-table" style={{borderSpacing: 5, marginTop: 10}}>
                                        <tbody>
                                            <tr>
                                                <td style={{textAlign: 'center'}}>From</td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <div className="time-select-wrapper">
                                                        {/* Hours */}
                                                        <Select
                                                            className={`standard-select mini`}
                                                            style={{ width: 60 }}
                                                            options={availableHours.map((hour) => {
                                                                return { value: hour.split(":")[0] }
                                                            })}
                                                            labelField={"value"}
                                                            values={[{ value: editValues.startTime.split(":")[0] }]}
                                                            placeholder="-"
                                                            multi={false}
                                                            backspaceDelete={false}
                                                            searchable={false}
                                                            onChange={(e) => handleEditTimes(e, 'startTime:hour')}
                                                        />
                                                        :
                                                        {/* Minutes */}
                                                        <Select
                                                            className={`standard-select mini`}
                                                            style={{ width: 60 }}
                                                            options={availableMinutes.map(minute => {
                                                                return { value: minute }
                                                            })}
                                                            labelField={"value"}
                                                            values={[{ value: editValues.startTime.split(":")[1] }]}
                                                            placeholder="-"
                                                            multi={false}
                                                            backspaceDelete={false}
                                                            searchable={false}
                                                            onChange={(e) => handleEditTimes(e, 'startTime:minute')}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{textAlign: 'center', paddingTop: 10}}>To</td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <div className="time-select-wrapper">
                                                        {/* Hours */}
                                                        <Select
                                                            className={`standard-select mini`}
                                                            style={{ width: 60 }}
                                                            options={availableHours.map((hour) => {
                                                                return { value: hour.split(":")[0] }
                                                            })}
                                                            labelField={"value"}
                                                            values={[{ value: editValues.endTime.split(":")[0] }]}
                                                            placeholder="-"
                                                            multi={false}
                                                            backspaceDelete={false}
                                                            searchable={false}
                                                            onChange={(e) => handleEditTimes(e, 'endTime:hour')}
                                                        />
                                                        :
                                                        {/* Minutes */}
                                                        <Select
                                                            className={`standard-select mini`}
                                                            style={{ width: 60 }}
                                                            options={availableMinutes.map(minute => {
                                                                return { value: minute }
                                                            })}
                                                            labelField={"value"}
                                                            values={[{ value: editValues.endTime.split(":")[1] }]}
                                                            placeholder="-"
                                                            multi={false}
                                                            backspaceDelete={false}
                                                            searchable={false}
                                                            onChange={(e) => handleEditTimes(e, 'endTime:minute')}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </React.Fragment>
                            ) : (
                                <p style={{margin: "5px 0"}}>{actionTimings.startTime} - {actionTimings.endTime}</p>
                            )
                        }
                    </div>

                    {
                        !editMode ? (
                            <button
                                style={{justifySelf: "flex-end"}}
                                className="edit-button"
                                onClick={handleStartEditMode}
                            >Edit</button>
                        ) : null
                    }
                </div>
            </div>

            {
                editMode ? (
                    <div className="localised-modal-footer">
                        <button 
                            className="plain-text-link"
                            onClick={handleResetEditMode}
                        >Cancel</button>

                        <button
                            className="standard-button mini green"
                        >Save</button>
                    </div>
                ) : null
            }
        </div>
    )
}

export default ViewSchedulePart