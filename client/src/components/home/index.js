import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./home.css";
import constants from "../../constants";
import Loader from "../loader";
import { getJwt, wordpressGetJwt } from "../../utils/getJwt";
import { setPopUpMessage } from "../../store";
import { useDispatch, useSelector } from "react-redux";

import PopUp from "../popup";
let socket;

const Home = () => {
  const dispatch = useDispatch();
  const version = useSelector((state) => state.main.version);
  const [loops, setLoops] = useState("");
  const [jwt, setJwt] = useState("");
  const [id, setId] = useState("");
  const [content, setContent] = useState("");
  const [data, setData] = useState([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [showPopUp, setShowPopUp] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket = io(constants.url);
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [data]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchWordpress = async (code) => {
    console.log("at fetch wordpress");
    console.log(code);
    let url = "https://public-api.wordpress.com/oauth2/token";
    let params = new URLSearchParams({
      client_id: constants.WP_CLIENT_ID,
      redirect_uri: constants.WP_REDIRECT_URI,
      client_secret:
        "nG82OJmS7eyWXEjk590BpuMtrpE8z0gHsjA2Uoc75s9t1Io8JchkhVVZ2oOj5Y6s",
      code,
      grant_type: "authorization_code",
    });
    console.log(params);
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        let access_key = data.access_token;
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const handleJWT = async () => {
    const errorDispact = (myStr) => {
      dispatch(
        setPopUpMessage({ message: myStr, type: "error", timeout: 3000 })
      );
    };
    if (version === "wordpress") {
      console.log("asdf");
      wordpressGetJwt(setJwt, errorDispact, fetchWordpress);
    } else {
      getJwt(setJwt, errorDispact);
    }
  };

  const handleSubmit = async () => {
    if (hasStarted) return;
    setData([]);
    setHasStarted(true);
    const openAIKey = localStorage.getItem("openAIKey");
    const newData = {
      jwt,
      loops,
      id,
      content,
      openAIKey,
      version,
    };
    socket.on("updateData", (incomingData) => {
      console.log(incomingData);
      if (incomingData.type === "ending") {
        setHasStarted(false);
        socket.off("updateData");
      }
      setData((prevData) => [...prevData, incomingData]);
    });
    socket.emit("addData", newData);
  };

  const canStart = jwt !== "" && id !== "" && content !== "" && loops !== "";

  return (
    <div className="Home">
      {showPopUp && (
        <PopUp
          close={() => {
            setShowPopUp("");
          }}
          template={showPopUp}
        />
      )}
      <div className="container">
        <div className="title">
          <h3>bloggerGPT</h3>
          <p>Post hundreds of blog posts with just a click of a button</p>
        </div>
        <div className="data">
          {!hasStarted && data.length === 0 && (
            <div className="emptyData-messages">
              <h5
                onClick={() => {
                  setShowPopUp("tutorial");
                }}
              >
                How to get started?
              </h5>
              <h5
                onClick={() => {
                  setShowPopUp("settings");
                }}
              >
                Settings
              </h5>
            </div>
          )}
          {data.map((item, index) => (
            <div key={index} className="mainDiv">
              {item.type === "success" && (
                <div className="success">
                  <h4>{item.title}</h4>
                  <p>{item.content}</p>
                  <a href={item.url} target="_blank">
                    View Post
                  </a>
                </div>
              )}
              {item.type === "error" && (
                <div className="error">
                  <p>{item.error}</p>
                </div>
              )}
              {item.type === "ending" && (
                <div className="success">
                  <h4>{item.content}</h4>
                </div>
              )}
            </div>
          ))}
          {hasStarted && (
            <div ref={messagesEndRef} className="loader-container">
              <Loader />
            </div>
          )}
        </div>
        <div className="inputs">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What is your blog post about"
          />
          <div className="inputsCont">
            <input
              className="loops"
              type="number"
              value={loops}
              onChange={(e) => setLoops(e.target.value)}
              placeholder="How many posts do you want"
            />
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Enter your blogger.com ID"
            />
            <button
              onClick={handleJWT}
              className={`google ${jwt !== "" && "googleGood"}`}
              disabled={jwt !== ""}
            >
              {jwt ? "Logged In" : "Blog Login"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!(!hasStarted && canStart)}
              className="runButton"
            >
              Run!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
