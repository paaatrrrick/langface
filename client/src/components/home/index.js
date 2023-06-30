import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./home.css";
import { useSelector } from "react-redux";
import constants from "../../constants";
import { getJwt, wordpressGetJwt } from "../../utils/getJwt";
import { setBannerMessage } from "../../store";
import { useDispatch } from "react-redux";
import StatusPill from "../statusPill";
import SparklesSvg from "../../assets/sparkles-outline.svg";
import WrenchSvg from "../../assets/build-outline.svg";
import LibrarySvg from "../../assets/library-outline.svg";
import ImageSvg from "../../assets/image-outline.svg";
import StoreFrontSvg from "../../assets/storefront-outline.svg";
import CaretForward from "../../assets/caret-forward-outline.svg";
import CheckMark from "../../assets/checkmark-circle.svg";
import Close from "../../assets/close-circle-sharp.svg";
let socket;

const typeToImageMap = {
  error: Close,
  success: CheckMark,
};

const Home = () => {
    const version = useSelector((state) => state.main.version);
    const dispatch = useDispatch();
    const [loops, setLoops] = useState("");
    const [jwt, setJwt] = useState("");
    const [id, setId] = useState("");
    const [blogSubject, setBlogSubject] = useState("");
    const [content, setContent] = useState("");
    const [data, setData] = useState([]);
    const [hasStarted, setHasStarted] = useState(false);
    const [usedBlogPosts, setUsedBlogPosts] = useState(0);
    const [maxBlogPosts, setMaxBlogPosts] = useState((version === "blogger") ? 25 : 8);
    const messagesEndRef = useRef(null);

    const defualtPills = [
      {
        version: "initializing",
        title: "Research",
        img: LibrarySvg,
        content: "For each blog post, we search the web to find top performing articles in your niche to use as a model.",
      },
      {
        version: "initializing",
        title: "Image Generation",
        img: ImageSvg,
        content: "AI image generators make unique images to compliment the message of your blog and improve your search ranking.",
      },
      {
        version: "initializing",
        title: "Content Generation",
        img: StoreFrontSvg,
        content: `A Search Engine Optimized blog post is written and posted to your ${version === 'blogger' ? 'Blogger' : "Wordpress"} account with specific long tail keywords, an optimal HTML header structure, and more!`,
      }
    ];
    //if version is blogger, remove the 2 element in the array defualtPills
    if (version === "blogger") {
      defualtPills.splice(1, 1);
    }
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
      const element = messagesEndRef.current;
      const totalHeight = element.scrollHeight;
      const stepTime = Math.abs(Math.floor(8000 / totalHeight));
      let currentPos = element.scrollTop;
      const scrollInterval = setInterval(() => {
        currentPos += 5;
        element.scrollTop = currentPos;
        if (currentPos >= totalHeight){
          clearInterval(scrollInterval);
        }
      }, stepTime);
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
        console.log('trying to login to wordpress error');
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
        if (incomingData.remainingPosts && incomingData.dailyPostCount) {
          setUsedBlogPosts(incomingData.dailyPostCount - incomingData.remainingPosts);
          setMaxBlogPosts(incomingData.dailyPostCount);
        }
      });
      socket.emit("addData", newData);
    };

    const canStart = jwt !== "" && id !== "" && blogSubject !== "" && loops !== "";
  return (
    <div className="Home">
      <div className="row align-center justify-start">
        <h1>BloggerGPT</h1>
        <button 
        onClick={handleSubmit}
        disabled={!(!hasStarted && canStart)}
        className="runButton">
          <img src={CaretForward} alt="run button" />
          <h4>Start Agent</h4>
        </button>
      </div>
        <h6>Post hundreds of Search Engine Optimized blog posts to {(version === "blogger") ? "Blogger" : "Wordpress"} </h6>
        <div className="home-results-container">
        <div className="home-input-top-row">
          Daily Articles Used: {usedBlogPosts} / {maxBlogPosts}
        </div>
        <div className="home-data-body" ref={messagesEndRef}>
          {(!hasStarted && data.length === 0) && 
           defualtPills.map((pill, index) => (
            <StatusPill
              key={index}
              version={pill.version}
              title={pill.title}
              img={pill.img}
              content={pill.content}
            />
          ))}
          {(hasStarted && data.length === 0) &&
            <StatusPill
              version="updating"
              title="Initializing the AI agent..."
            />
          }
          {data.map((pill, index) => (
            <StatusPill
              key={index}
              version={pill.type}
              title={pill.title}
              img={typeToImageMap[pill.type] || false}
              content={pill.content}
              url={pill.url}
            />
          ))}
        </div>
        </div>
        <div className="home-input-container">
          <div className="row" style={{marginBottom: "15px"}}>
            <div className="home-sectioned-input">
              <div className="left">
                <img src={SparklesSvg} alt="sparkles" />
                <h4>Subject</h4>
              </div>
              <input 
              onChange={(e) => setBlogSubject(e.target.value)}
              value={blogSubject}
              className="input" type="text" placeholder="History of Jiu Jitsu"/>
            </div>

            <input 
            value={loops}
            onChange={(e) => setLoops(e.target.value)}
            className="article-count" type="number" placeholder="Number of Posts"/>
            {(version === "blogger") &&
                <input
                className="article-count"
                style={{marginLeft: "0px"}}
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="blogger.com ID"
              />
            }
            <button
              onClick={handleJWT}
              className={`${jwt !== "" && "logged-in"}`}
              disabled={jwt !== ""}
            >
              {(jwt !== "") ? "Logged In" : `${(version === "blogger") ? "Blogger" : "Wordpress"} Login`}
            </button>
          </div>
          <div className="home-sectioned-input" style={{height: '80px'}}>
              <div className="left">
                <img src={WrenchSvg} alt="sparkles" />
                <h4>Config</h4>
              </div>
              <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input" placeholder="Optionally, what other additional context do you want to provide? This could be the style of each post, additional information on the product, or even affiliate links to include."/>
            </div>
        </div>
    </div>
  );
};

export default Home;
