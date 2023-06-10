import React from "react";
import { useState, useEffect } from "react";
import { setPopUpMessage, setVersion } from "../../../store";
import { useDispatch, useSelector } from "react-redux";

const Settings = ({ close }) => {
  const dispatch = useDispatch();
  let version = useSelector((state) => state.main.version);
  const [openAIKey, setOpenAIKey] = useState("");
  useEffect(() => {
    if (localStorage.getItem("openAIKey")) {
      setOpenAIKey(localStorage.getItem("openAIKey"));
    }
  }, []);
  const addOpenAIKeyToLocalStorage = () => {
    console.log(openAIKey);
    localStorage.setItem("openAIKey", openAIKey);
    dispatch(
      setPopUpMessage({
        message: "OpenAI Key successfully Saved",
        type: "success",
        timeout: 3000,
      })
    );
  };
  return (
    <div className="guidePopUp settingsType">
      <h4>Settings</h4>
      <p>OpenAI Key</p>
      <div className="addOpenAIKey">
        <input
          type="password"
          placeholder="ex: sh-f82fj2js03rnfff0340f93j"
          onChange={(e) => {
            setOpenAIKey(e.target.value);
          }}
          value={openAIKey}
        />
        <button onClick={addOpenAIKeyToLocalStorage}>Save</button>
      </div>
      <div className="toggleContent">
        <div className="toggleContentRow">
          <p>Use Wordpress</p>
          <div>
            <input
              type="checkbox"
              id="switch"
              checked={version === "wordpress"}
              onChange={() => {
                dispatch(setVersion("wordpress"));
              }}
            />
            <label for="switch" className="setting-label">
              Toggle
            </label>
          </div>
        </div>
        <div className="toggleContentRow">
          <p>Use Blogger</p>
          <div>
            <input
              type="checkbox"
              id="switch"
              checked={version !== "wordpress"}
              onChange={() => {
                dispatch(setVersion("blogger"));
              }}
            />
            <label for="switch" className="setting-label">
              Toggle
            </label>
          </div>
        </div>
      </div>
      <div className="addOpenAIKe"></div>
      <button onClick={close}>x</button>
    </div>
  );
};

export default Settings;
