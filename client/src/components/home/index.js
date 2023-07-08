import React, { useState, useEffect, useRef } from "react";
import "./home.css";
import { useSelector } from "react-redux";
import constants, { defualtPills, sampleBlog } from "../../constants";
import { getJwt, wordpressGetJwt, getUserAuthToken } from "../../utils/getJwt";
import { scrollToBottom } from "../../utils/styles";
import { setBannerMessage, newBlogAgent, setActiveBlogAgent, initializeBlogAgent } from "../../store";
import { useDispatch } from "react-redux";
import StatusPill from "../statusPill";
import Dropdown from "../uxcore/dropdown";
import SparklesSvg from "../../assets/sparkles-outline.svg";
import WrenchSvg from "../../assets/build-outline.svg";
import CaretForward from "../../assets/caret-forward-outline.svg";
import CheckMark from "../../assets/checkmark-circle.svg";
import Close from "../../assets/close-circle-sharp.svg";

const typeToImageMap = {
  error: Close,
  success: CheckMark,
};

const Home = ({joinRoom}) => {
    const activeBlogAgent = useSelector((state) => state.main.activeBlogAgent);
    const isLoggedIn = useSelector((state) => state.main.isLoggedIn);
    const blogAgents = useSelector((state) => state.main.blogAgents);
    const currentBlog = blogAgents[activeBlogAgent];
    console.log('rerendering');
    console.log(currentBlog);
    const dispatch = useDispatch();
    const [version, setVersion] = useState(currentBlog.version || "wordpress");
    const [loops, setLoops] = useState(currentBlog.loops || "");
    const [daysLeft, setDaysToRun] = useState(currentBlog.daysLeft || "");
    const [jwt, setJwt] = useState(currentBlog.jwt || "");
    const [id, setId] = useState(currentBlog.id || "");
    const [subject, setSubject] = useState(currentBlog.blogSubject || "");
    const [config, setContent] = useState(currentBlog.config || "");
    const [data, setData] = useState(currentBlog.data || []);
    const [hasStarted, setHasStarted] = useState(currentBlog.hasStarted || false);
    const [postsLeftToday, setUsedBlogPosts] = useState(currentBlog.postsLeftToday || 0);
    const [maxNumberOfPosts, setMaxBlogPosts] = useState((currentBlog.maxNumberOfPosts) ? currentBlog.maxNumberOfPosts : constants.maxPosts);
    const messagesEndRef = useRef(null);
    if (version === "blogger") {
      defualtPills.splice(1, 1);
    }

    useEffect(() => {
      setVersion(currentBlog.version || "wordpress");
      setLoops(currentBlog.loops || "");
      setDaysToRun(currentBlog.daysLeft || "");
      setJwt(currentBlog.jwt || "");
      setId(currentBlog.id || "");
      setSubject(currentBlog.blogSubject || "");
      setContent(currentBlog.config || "");
      setData(currentBlog.data || []);
      setHasStarted(currentBlog.hasStarted || false);
      setUsedBlogPosts(currentBlog.postsLeftToday || 0);
      setMaxBlogPosts((currentBlog.maxNumberOfPosts) ? currentBlog.maxNumberOfPosts : constants.maxPosts);
    }, [activeBlogAgent, currentBlog, currentBlog.data]);

    useEffect(() => {
      scrollToBottom(messagesEndRef.current);
    }, [data]);

    const fetchWordpress = async (code) => {
      try {
        const res = await fetch(`${constants.url}/wordpress`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
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

    const samplePrompt = async () => {
      setLoops(sampleBlog.loops)
      setSubject(sampleBlog.subject);
      setContent(sampleBlog.config);
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
      const openAIKey = localStorage.getItem("openAIKey");
      const userAuthToken = getUserAuthToken();
      const newData = {jwt, loops, blogID: id, config: config, openAIKey, version, subject, daysLeft, userAuthToken, demo: currentBlog.demo};
      const res = await fetch(`${constants.url}/launchAgent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newData),
      });
      const data = await res.json();
      console.log('we are back');
      console.log(data);
      joinRoom(data._id);
      dispatch(initializeBlogAgent({...data, ...newData}));
    };

    const selectChangeDropdown = (target) => {
      if (target === "AddNewAgent") {
        dispatch(newBlogAgent());
      } else if (target !== activeBlogAgent) {
        dispatch(setActiveBlogAgent(target));
      }
    }

    const canStart = jwt !== "" && id !== "" && subject !== "" && loops !== "";
    const dropDownOptions = [];
    const agentsKeys = Object.keys(blogAgents);
    for (let i = 0; i < agentsKeys.length; i++) {
      dropDownOptions.push({
        id: agentsKeys[i],
        text: blogAgents[agentsKeys[i]].blogSubject,
      });
    }

  return (
    <div className="Home">
      {isLoggedIn && <Dropdown options={dropDownOptions} selected={activeBlogAgent} onSelectedChange={selectChangeDropdown}/>} 
      <div className="row align-center justify-start wrap">
        <h1
        style={{marginRight: "15px"}}
        >BloggerGPT</h1>
        {(!hasStarted) && <button className="runButton2" style={{margin: "0px"}} onClick={samplePrompt}>Sample prompt</button>}
      </div>
        <h6>Post hundreds of Search Engine Optimized blog posts to {(version === "blogger") ? "Blogger" : "Wordpress"} </h6>
        <div className="home-results-container">
        <div className="home-input-top-row">
          Daily Articles Used: {maxNumberOfPosts - postsLeftToday} / {maxNumberOfPosts}
        </div>
        <div className="home-data-body" ref={messagesEndRef}>
          {(!hasStarted && data.length === 0) &&
           defualtPills.map((pill, index) => (
            <StatusPill
              key={index}
              version={pill.version}
              title={pill.title}
              img={pill.img}
              config={pill.config}
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
              config={pill.config}
              url={pill.url}
            />
          ))}
        </div>
        </div>
        <div className="home-input-container">
          <div className="home-firstInputRow">
            <div className="home-sectioned-input">
              <div className="left">
                <img src={SparklesSvg} alt="sparkles" />
                <h4>Subject</h4>
              </div>
              <input 
              onChange={(e) => setSubject(e.target.value)}
              value={subject}
              className="input" type="text" placeholder="History of Jiu Jitsu"/>
            </div>

            <div className="home-tinyInputs">
            <input 
              value={loops}
              onChange={(e) => setLoops(e.target.value)}
              className="article-count" type="number" 
              placeholder={(isLoggedIn) ? "Posts / Per Day" : "Number of Posts"}/>
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
            {(isLoggedIn) &&
                <input
                className="article-count"
                style={{marginLeft: "0px"}}
                type="number"
                min="1"
                max="14"
                value={daysLeft}
                onChange={(e) => setDaysToRun(e.target.value)}
                placeholder="Days to Run"
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
          </div>
          <div className="home-sectioned-input" style={{height: '80px'}}>
              <div className="left">
                <img src={WrenchSvg} alt="sparkles" />
                <h4>Config</h4>
              </div>
              <textarea 
              value={config}
              onChange={(e) => setContent(e.target.value)}
              className="input" placeholder="Optionally, what other additional context do you want to provide? This could be the style of each post, additional information on the product, or even affiliate links to include."/>
            </div>
        </div>
        {(!hasStarted) && 
        <button 
          onClick={handleSubmit}
          disabled={!(!hasStarted && canStart)}
          className="runButton">
            <img src={CaretForward} alt="run button" />
            <h4>Start Agent</h4>
        </button>
        }
    </div>
  );
};

export default Home;
