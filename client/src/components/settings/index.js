import React from "react";
import { useState, useEffect } from "react";
import { setBannerMessage, setVersion } from '../../store';
import { useDispatch, useSelector } from "react-redux";
import "./settings.css";

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
      setBannerMessage({
        message: "OpenAI Key successfully Saved",
        type: "success",
        timeout: 3000,
      })
    );
  };
  const toggleCliked = (e, toggle) => {
    if (
      (toggle === "wordpress" && version === "wordpress") ||
      (toggle === "blogger" && version === "wordpress")
    ) {
      dispatch(setVersion("blogger"));
    }
    if (
      (toggle === "blogger" && version === "blogger") ||
      (toggle === "wordpress" && version === "blogger")
    ) {
      dispatch(setVersion("wordpress"));
    }
  };
  return (
    <div className="Settings">
      <h1>Settings</h1>
      <div className="row align-center" style={{marginTop: "30px", marginBottom: "30px"}}>
        <p
        style={{marginRight: "10px"}}
        >OpenAI Key:</p>
        <div className="addOpenAIKey">
            <input
            type="password"
            placeholder="ex: sh-f82fj2js03rnfff0340f93j"
            onChange={(e) => {
                setOpenAIKey(e.target.value);
            }}
            value={openAIKey}
            />
            <button onClick={addOpenAIKeyToLocalStorage}>Save Key</button>
        </div>
      </div>
      <div className="toggleContent">
        <div className="row align-center">
        <div className="toggleContentRow">
          <p>Switch to using Wordpress</p>
          <div className="row align-center justify-center">
            <input
              type="checkbox"
              id="switchWP"
              checked={version === "wordpress"}
              onChange={(e) => {
                toggleCliked(e, "wordpress");
              }}
            />
            <label htmlFor="switchWP" className="setting-label">
              Toggle
            </label>
          </div>
        </div>
        <div className="toggleContentRow">
          <p>Switch to using Blogger</p>
          <div className="row align-center justify-center">
            <input
              type="checkbox"
              id="switchBG"
              checked={version === "blogger"}
              onChange={(e) => {
                toggleCliked(e, "blogger");
              }}
            />
            <label htmlFor="switchBG" className="setting-label">
              Toggle
            </label>
          </div>
        </div>
        </div>
      </div>
      <div className="addOpenAIKe"></div>
    </div>
  );
};

export default Settings;
