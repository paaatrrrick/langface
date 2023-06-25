import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./home.css";
import constants from "../../constants";
import Loader from "../loader";
import { getJwt, wordpressGetJwt } from "../../utils/getJwt";
import { setBannerMessage } from "../../store";
import { useDispatch, useSelector } from "react-redux";
import { rateLimitBlogger, rateLimitWordpress } from "../../utils/rateLimit";
let socket;

const Home = () => {
  const dispatch = useDispatch();
  const version = useSelector((state) => state.main.version);
  const [loops, setLoops] = useState("");
  const [jwt, setJwt] = useState("");
  const [id, setId] = useState("");
  const [blogSubject, setBlogSubject] = useState("");
  const [content, setContent] = useState("");
  const [data, setData] = useState([]);
  const [hasStarted, setHasStarted] = useState(false);
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
    try {
      console.log(code);
      const res = await fetch(`${constants.url}/wordpress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setJwt(data.access_token);
      setId(data.blog_id);
    } catch (e) {
      dispatch(
        setBannerMessage({
          message: "Error logging in to Wordpress",
          type: "error",
          timeout: 10000,
        })
      );
    }
  };

  const handleJWT = async () => {
    const errorDispact = (myStr) => {
      dispatch(
        setBannerMessage({ message: myStr, type: "error", timeout: 3000 })
      );
    };
    if (version === "wordpress") {
      wordpressGetJwt(errorDispact, fetchWordpress);
    } else {
      getJwt(setJwt, errorDispact);
    }
  };

  const handleSubmit = async () => {
    if (hasStarted) return;
    const canContinue = (version === "blogger") ? rateLimitBlogger(loops) : rateLimitWordpress(loops);
    if (typeof canContinue === "string") {
      dispatch(
        setBannerMessage({ message: canContinue, type: "error" })
      );
      return;
    }
    setData([]);
    setHasStarted(true);
    const openAIKey = localStorage.getItem("openAIKey");
    const newData = {jwt, loops, id, content, openAIKey, version, blogSubject};
    socket.on("updateData", (incomingData) => {
      if (incomingData.type === "ending") {
        setHasStarted(false);
        socket.off("updateData");
      }
      setData((prevData) => {
        const tempPrevData = [...prevData];
        if (tempPrevData.length > 0 && tempPrevData[tempPrevData.length - 1].type === "updating") {
          tempPrevData.pop();
        }
        tempPrevData.push(incomingData);
        return tempPrevData;
      });
    });

    socket.emit("addData", newData);
  };

  const canStart = jwt !== "" && id !== "" && blogSubject !== "" && loops !== "";
  return (
    <div className="Home">
      <div className="container">
        {(hasStarted ||  data.length > 0) ? <h2>Progress</h2> : <h2>Post hundreds of articles in the click of a button</h2>}
        {(hasStarted ||  data.length > 0) && 
        <div className="data">
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
              {item.type === "updating" && (
                  <div className="success">
                    <h4>{item.title}</h4>
                    <p>{item.content}</p>
                    <div></div>
                  </div>
                )}
              {item.type === "error" && (
                <div className="error">
                  <p>{item.content}</p>
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
        }
        <div className="inputs">
        <input
              className="fullWidthInput"
              type="text"
              value={blogSubject}
              onChange={(e) => setBlogSubject(e.target.value)}
              placeholder="What is your blog about? Ex: Brazilian Jiu Jitsu, Taking care of Huskies, History of Cheese, etc."
            />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Optionally, what other additional context do you want to provide? This could be the style of each post, additional information on the product, or even affiliate links to include."
          />
          <div className="inputsCont">
            <input
              className="loops"
              type="number"
              value={loops}
              onChange={(e) => setLoops(e.target.value)}
              placeholder="How many posts do you want"
            />

            {version === "blogger" && (
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Enter your blogger.com ID"
              />
            )}
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
