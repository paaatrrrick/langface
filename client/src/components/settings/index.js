import React from "react";
import { useState, useEffect } from "react";
import { setBannerMessage, setColorScheme } from '../../store';
import Specifications from "../specifications";
import { useDispatch, useSelector } from "react-redux";
import "./settings.css";

const Settings = () => {
  const dispatch = useDispatch();
  let { version, colorScheme }  = useSelector((state) => state.main);
  const [openaiKey, setOpenAIKey] = useState("");
  useEffect(() => {
    if (window.localStorage.getItem("openaiKey")) {
      setOpenAIKey(localStorage.getItem("openaiKey"));
    }
  }, []);
  const addOpenAIKeyToLocalStorage = () => {
    window.localStorage.setItem("openaiKey", openaiKey);
    dispatch(
      setBannerMessage({
        message: "OpenAI Key successfully Saved",
        type: "success",
        timeout: 3000,
      })
    );
  };

  const toggleColorScheme = () => {
    if (colorScheme === "light") {
      dispatch(setColorScheme("dark"));
    } else {
      dispatch(setColorScheme("light"));
    }
  };

  return (
    <div className="Settings">
      <h1>Settings</h1>
      <div className="w-100 row align-center justify-center">
        <div className="Settings-spec-container"> <Specifications /> </div>
      </div>
      {/* <h2>General Settings</h2>
      <div className="row align-center" style={{marginTop: "30px", marginBottom: "30px"}}>
        <p
        style={{marginRight: "10px"}}
        >OpenAI Key (optional):</p>
        <div className="addOpenAIKey">
            <input
            type="password"
            placeholder="ex: sh-f82fj2js03rnfff0340f93j"
            onChange={(e) => {
                setOpenAIKey(e.target.value);
            }}
            value={openaiKey}
            />
            <button onClick={addOpenAIKeyToLocalStorage}>Save Key</button>
        </div>
      </div> */}
      {/* <div className="toggleContent">
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
        </div> */}
      {/* </div> */}
      {/* <div className="toggleContent">
        <div className="row align-center">
        <div className="toggleContentRow">
          <p>Using Dark Color Scheme</p>
          <div className="row align-center justify-center">
            <input
              type="checkbox"
              id="switchCS"
              checked={colorScheme === "dark"}
              onChange={toggleColorScheme}
            />
            <label htmlFor="switchCS" className="setting-label">
              Toggle
            </label>
          </div>
        </div>
        </div>
      </div> */}
    </div>
  );
};

export default Settings;
