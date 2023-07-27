import React, { useState, useEffect, useRef } from "react";
import "./home.css";
import { useSelector, useDispatch } from "react-redux";
import constants, { defualtPills, sampleBlog } from "../../constants";
import { getJwt, wordpressGetJwt, getUserAuthToken, isAuthenticatedResponse } from "../../utils/getJwt";
import { scrollToBottom } from "../../utils/styles";
import { trimStringToChars } from "../../utils/helpers";
import { setBannerMessage, initializeBlogAgent, setVersion, signOut, setHtmlModal, actions } from "../../store";
import StatusPill from "../statusPill";
import Dropdown from "../uxcore/dropdown";
import CaretForward from "../../assets/caret-forward-outline.svg";
import CheckMark from "../../assets/checkmark-circle.svg";
import Close from "../../assets/close-circle-sharp.svg";
import SettingsSvg from '../../assets/settings-outline.svg';


const typeToImageMap = {
  error: Close,
  success: CheckMark,
  tree: CheckMark,
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
      setData(currentBlog.data || []);
      setHasStarted(currentBlog.hasStarted || false);
      setUsedBlogPosts(currentBlog.postsLeftToday || 0);
      setMaxBlogPosts((currentBlog.maxNumberOfPosts) ? currentBlog.maxNumberOfPosts : constants.maxPosts);
    }, [activeBlogAgent, currentBlog.data, currentBlog.hasStarted]);

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
      const userAuthToken = getUserAuthToken();
      const { businessData }  = currentBlog;
      const newData = {jwt, loops, blogID, version, daysLeft, userAuthToken, businessData, demo, blogMongoID: activeBlogAgent };
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

    const configure = async () => {
      dispatch(actions.updateBlogAgent({id: activeBlogAgent, hasStarted: false, daysLeft: 0}));
      const res = await fetch(`${constants.url}/configureBlog`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access'langface-auth-token": getUserAuthToken()
        },
        body: JSON.stringify({ id: activeBlogAgent }),
      })
      const data = await res.json();
    };

    const runNextDay = async () => {
      dispatch(actions.updateBlogAgent({id: activeBlogAgent, hasStarted: false, daysLeft: ((currentBlog.daysLeft || 1) - 1)}));
      console.log("running next day");
      console.log(`${constants.url}/runNextDay`)
      const res = await fetch(`${constants.url}/runNextDay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access'langface-auth-token": getUserAuthToken()
        },
        body: JSON.stringify({ id: activeBlogAgent }),
      });
      const data = await res.json();
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

    const canStart = ((version === "html") || (blogID && jwt)) !== "" && loops;
    const versionSelectorOptions = [{id: "html", text: "Raw Text"}, {id: "wordpress", text: "Post to Wordpress"}, {id: "blogger", text: "Post to Blogger.com"}];
    const isDataSmall = hasStarted || (!demo && currentBlog.daysLeft > 0); 
    const waitingForNextDay = !hasStarted && !demo && currentBlog.daysLeft > 0;
    
  return (
    <div className="Home">
      <div className="row align-center justify-start wrap">
        
        <h1 style={{marginRight: "15px"}}>BloggerGPT</h1>
        {(demo) ? 
        <div className="runButton2 nohover" style={{margin: "0px"}} >Demo</div> : 
         <div className="runButton2 nohover" style={{margin: "0px"}}>Professional</div>}
      </div>
      <h6>Hire an AI agent that works autonomously to grow your blog</h6>
      <div className={`home-results-container ${isDataSmall && 'growLarge'}`}>
        <div className="home-input-top-row">
          <p>{trimStringToChars(currentBlog?.businessData?.name || '', 45)}</p>
          <div className="row">
            {(!demo && currentBlog.daysLeft > 0) && <p style={{marginRight: "25px"}}>Loops Left: {currentBlog.daysLeft}</p>}
            <p>{demo ? 'Articles Written: ' : 'Monthly Articles Used: '}{maxNumberOfPosts - postsLeftToday} / {maxNumberOfPosts}</p>
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
          {(hasStarted && data.length === 0) && <StatusPill version="updating" title="Initializing the AI agent..." /> }
          {data.map((pill, index) => (
            <StatusPill
              key={index}
              version={pill.type}
              title={pill.title}
              img={typeToImageMap[pill.type] || false}
              config={pill.config}
              url={pill.url}
              html={pill.html}
              tree={pill.tree}
              onClick={
                (pill.html === "html") ? () => {dispatch(setHtmlModal(pill.html))} : false
              }
            />
          ))}
        </div>
        </div>
        {waitingForNextDay &&
         <div className="w-100 row align-center justify-center">
            <div className="row">
              <button style={{marginRight:"15px"}} onClick={configure} className="runButton">
                  <img src={SettingsSvg} alt="configure button" style={{marginLeft: "10px"}}/>
                  <h4>Configure</h4>
              </button>
              <button style={{marginLeft:"15px"}} onClick={runNextDay} className="runButton">
                  <img src={CaretForward} alt="run next day button" />
                  <h4>Run Next Loop</h4>
              </button>
            </div>
          </div>
        }
        {!isDataSmall && 
        <div className="home-tinyInputs">
          <div className="row align-center justify-start wrap">
          <div className="mock-container">
            <Dropdown options={versionSelectorOptions} selected={version} onSelectedChange={versionToggler}/>
          </div>
          {!demo && <div className="article-count">
           <label for="postsToday">
              Posts Per Loop
            </label>
              <input
                id="postsToday"
                type="number" 
                value={loops} 
                min={1}
                onChange={loopSetter}
              />
          </div> }
          {(!demo) &&
            <div className="article-count">
            <label for="postsToday">
            How Manys Loops?
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
