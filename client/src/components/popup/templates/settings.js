import React from "react";
import { useState, useEffect } from "react";
import { setPopUpMessage } from "../../../store";
import { useDispatch } from "react-redux";

const Settings = ({ close }) => {
    const dispatch = useDispatch();
    const [openAIKey, setOpenAIKey] = useState('');
    useEffect(() => {
        if (localStorage.getItem('openAIKey')) {
            setOpenAIKey(localStorage.getItem('openAIKey'));
        }
    }, [])
    const addOpenAIKeyToLocalStorage = () => {
        console.log(openAIKey);
        localStorage.setItem('openAIKey', openAIKey);
        dispatch(setPopUpMessage({ message: 'OpenAI Key successfully Saved', type: 'success', timeout: 3000 }))
    }
    return (
        <div className="guidePopUp settingsType">
            <h4>Settings</h4>
            <p>OpenAI Key</p>
            <div className="addOpenAIKey">
                <input
                    type="password"
                    placeholder="ex: sh-f82fj2js03rnfff0340f93j"
                    onChange={(e) => { setOpenAIKey(e.target.value) }}
                    value={openAIKey}
                />
                <button onClick={addOpenAIKeyToLocalStorage}>Save</button>
            </div>
            <button onClick={close}>x</button>
        </div>
    )
}

export default Settings;
