import React, { useState, useEffect, useRef } from "react";
import "./home.css";
import { useSelector, useDispatch } from "react-redux";
import constants, { defualtPills, sampleBlog } from "../../constants";
import { getJwt, wordpressGetJwt, getUserAuthToken, isAuthenticatedResponse } from "../../utils/getJwt";
import { scrollToBottom } from "../../utils/styles";
import { trimStringToChars } from "../../utils/helpers";
import { setBannerMessage, initializeBlogAgent, setVersion, signOut, setHtmlModal } from "../../store";
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
    const dispatch = useDispatch();
    const activeBlogAgent = useSelector((state) => state.main.activeBlogAgent);
    const blogAgents = useSelector((state) => state.main.blogAgents);
    const currentBlog = blogAgents[activeBlogAgent];
    const [version, setActiveVersion] = useState("html");
    const [loops, setLoops] = useState("");
    const [daysLeft, setDaysToRun] = useState("");
    const [jwt, setJwt] = useState("");
    const [blogID, setBlogID] = useState("");
    const [subject, setSubject] = useState("");
    const [config, setContent] = useState("");
    const [data, setData] = useState([]);
    const [hasStarted, setHasStarted] = useState(false);
    const [postsLeftToday, setUsedBlogPosts] = useState(0);
    const [maxNumberOfPosts, setMaxBlogPosts] = useState(constants.maxPosts);
    const messagesEndRef = useRef(null);
    const demo = currentBlog.demo;

    useEffect(() => {
      setActiveVersion(currentBlog.version || "html");
      setLoops(currentBlog.loops || 1);
      setDaysToRun(currentBlog.daysLeft || 1);
      setJwt(currentBlog.jwt || "");
      setBlogID(currentBlog.blogID || "");
      setSubject(currentBlog.subject || "");
      setContent(currentBlog.config || "");
      setData(currentBlog.data || []);
      setHasStarted(currentBlog.hasStarted || false);
      setUsedBlogPosts(currentBlog.postsLeftToday || 0);
      setMaxBlogPosts((currentBlog.maxNumberOfPosts) ? currentBlog.maxNumberOfPosts : constants.maxPosts);
    }, [activeBlogAgent, currentBlog.data]);

    useEffect(() => {
      scrollToBottom(messagesEndRef.current);
    }, [data]);

    const fetchWordpress = async (code) => {
      try {
        const res = await fetch(`${constants.url}/wordpress`, {
          method: "POST",
          headers: { "Content-Type": "application/json",},
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setJwt(data.access_token);
        setBlogID(data.blog_id);
      } catch (e) {
        dispatch(setBannerMessage({message: "Error logging in to Wordpress", type: "error", timeout: 10000}));
      }
    };

    const samplePrompt = async () => {
      setLoops(sampleBlog.loops)
      setSubject(sampleBlog.subject);
      setContent(sampleBlog.config);
      versionToggler('html');
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
      const openaiKey = window.localStorage.getItem("openaiKey");
      const userAuthToken = getUserAuthToken();
      const newData = {jwt, loops, blogID, config, openaiKey, version, subject, daysLeft, userAuthToken, demo, blogMongoID: activeBlogAgent };
      const res = await fetch(`${constants.url}/launchAgent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access'langface-auth-token": getUserAuthToken()
        },
        body: JSON.stringify(newData),
      });
      if(!isAuthenticatedResponse(res, () => {dispatch(signOut())})) return;
      const data = await res.json();
      //check if there is an error in the response. If so, dispatch an error message
      if (res.status !== 200) {
        dispatch(setBannerMessage({message: data.error, type: "error",timeout: 15000}));
      } else {
        joinRoom(data._id);
        dispatch(initializeBlogAgent({...data, ...newData}));
      }
    };

    const versionToggler = (version) => {
      setActiveVersion(version);
      dispatch(setVersion({activeBlogAgent, version}))
      setJwt("");
      setBlogID("");
    };

    const loopSetter = (e) => {
      var tempLoops = e.target.value;
      if (tempLoops * daysLeft > maxNumberOfPosts) {
        dispatch(setBannerMessage({message: `You can only make ${maxNumberOfPosts} total posts with your current plan.`, type: "error", timeout: 10000}));
      } else {
        setLoops(tempLoops);
      }
    };
    
    const daysSetter = (e) => {
      var tempDays = e.target.value;
      if (tempDays * loops > maxNumberOfPosts) {
        dispatch(setBannerMessage({message: `You can only make ${maxNumberOfPosts} total posts with your current plan.`, type: "error", timeout: 10000}));
      } else {
        setDaysToRun(tempDays);
      }
    };

    const canStart = ((version === "html") || (blogID && jwt)) !== "" && subject && loops;
    const versionSelectorOptions = [{id: "html", text: "Raw Text"}, {id: "wordpress", text: "Post to Wordpress"}, {id: "blogger", text: "Post to Blogger.com"}];
    const isDataSmall = hasStarted || (!demo && currentBlog.daysLeft > 0);
  return (
    <div className="Home">
      <div className="row align-center justify-start wrap">
        
        <h1 style={{marginRight: "15px"}}>BloggerGPT</h1>
        {(demo) 
        ? 
        <button className="runButton2" style={{margin: "0px"}} onClick={samplePrompt}>Run Demo</button>
         : 
         <button className="runButton2 nohover" style={{margin: "0px"}}>Professional</button>
         }
      </div>
        <h6>Hire an AI agent that works autonomously to grow your blog</h6>
        <div className={`home-results-container ${isDataSmall && 'growLarge'}`}>
        <div className="home-input-top-row">
          <p>{trimStringToChars(currentBlog.subject, 45)}</p>
          <div className="row">
            {(!demo && currentBlog.daysLeft > 0) && <p style={{marginRight: "25px"}}>Days Left: {currentBlog.daysLeft}</p>}
            <p>{demo ? 'Daily' : 'Monthly'} Articles Used: {maxNumberOfPosts - postsLeftToday} / {maxNumberOfPosts}</p>
          </div>
        </div>
        <div className={`home-data-body`} ref={messagesEndRef}>
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
              html={pill.html}
              onClick={
                (pill.html === "html") ? () => {dispatch(setHtmlModal(pill.html))} : false
              }
            />
          ))}
        </div>
        </div>
        {!isDataSmall && 
        <div className="home-input-container">
          <div className="home-firstInputRow">
            <div className="home-sectioned-input">
              <div className="left">
                <img src={SparklesSvg} alt="sparkles" />
                <h4>Niche</h4>
              </div>
              <input 
              onChange={(e) => setSubject(e.target.value)}
              value={subject}
              className="input" type="text" placeholder="Rock climbing for beginners"/>
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
              className="input" placeholder="Optinally, is there anything in particular you want the posts to have? For example, if you'd like to market a product, include it here: Sal's climbing, affordable rock climbing equipment at www.salsclimbing.com "/>
          </div>
        </div>}
        {!isDataSmall && 
        <div className="home-tinyInputs">
          <div className="row align-center justify-start wrap">
          <div className="mock-container">
            <Dropdown options={versionSelectorOptions} selected={version} onSelectedChange={versionToggler}/>
          </div>
          <div className="article-count">
            <label for="postsToday">
              {(!demo) ? "Posts Per Day:" : "Post Count:"}
            </label>
              <input
                id="postsToday"
                type="number" 
                value={loops} 
                min={1}
                max={postsLeftToday}
                onChange={loopSetter}
              />
          </div>
          {(!demo) &&
            <div className="article-count">
            <label for="postsToday">
            Days to Run
            </label>
              <input
                id="postsToday"
                type="number" 
                value={daysLeft} 
                min={1}
                max={14}
                onChange={daysSetter}
              />
          </div>}
          {(version === "blogger") &&
                <input
                className="article-count"
                style={{marginLeft: "0px"}}
                type="text"
                value={blogID}
                onChange={(e) => setBlogID(e.target.value)}
                placeholder="blogger.com ID"
              />
            }
            {(version !== "html") &&
              <button
                onClick={handleJWT}
                className={`${jwt !== "" && "logged-in"} login-button`}
                disabled={jwt !== ""}
              >
                {(jwt !== "") ? "Logged In" : `${(version === "blogger") ? "Blogger" : "Wordpress"} Login`}
              </button>
            }
          </div>
              <button  onClick={handleSubmit} disabled={!(!hasStarted && canStart)} className="runButton">
                  <img src={CaretForward} alt="run button" />
                  <h4>Start Agent</h4>
              </button>
      </div>}
    </div>
  );
};

export default Home;
