import React, { useRef, useState, useEffect } from 'react';
import './navController.css'
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentView, setActiveBlogAgent } from '../../store';
import HomeSvg from '../../assets/home-outline.svg';
import SettingsSvg from '../../assets/settings-outline.svg';
import RocketSvg from '../../assets/rocket-outline.svg';
import DiscordSvg from '../../assets/logo-discord.svg';
import BookSvg from '../../assets/book-outline.svg';
import Auth from "../auth"
import RobotSvg from '../../assets/robot-outline.svg'
import { trimStringToChars } from "../../utils/helpers";
import constants from '../../constants';

const NavController = ({launch}) => {
    const dispatch = useDispatch();
    const { currentView, blogAgents, isLoggedIn, activeBlogAgent } = useSelector(state => state.main);
    const blogKeys = Object.keys(blogAgents);

    var dropDownOptions = [];
    var newAgentCount = 0;
    const agentsKeys = Object.keys(blogAgents);
    for (let i = 0; i < agentsKeys.length; i++) {
      var text = blogAgents[agentsKeys[i]].subject;
      if (agentsKeys[i] === "default"){
        text = "Demo Agent"
      }
      if (!text) {
        newAgentCount++;
        text = `New Agent ${newAgentCount}`;
      }
      dropDownOptions.push({id: agentsKeys[i], text: trimStringToChars(text, 25)});
    }

    const payment = () => {
        dispatch(setCurrentView("purchase"));
    }

    return (
        <div className="navController">
            <div className='column align-start' style={{width: '100%'}}>
                <div className='row align-end'>
                    <h3 className="italic" style={{marginLeft: '15px'}}>BloggerGPT</h3>
                    <p style={{marginLeft: '5px'}}>beta</p>
                </div>
                <div className="navController-pageSelectors">
                    <div className={`navController-pill ${currentView === "home" ? "selected" : ""}`}
                        onClick={() => dispatch(setCurrentView("home"))}>
                        <img src={HomeSvg} />
                        <h6>Home</h6>
                    </div>
                    <div 
                    className={`navController-pill ${currentView === "settings" ? "selected" : ""}`}
                    onClick={() => dispatch(setCurrentView("settings"))}
                    >
                        <img src={SettingsSvg} />
                        <h6>Settings</h6>
                    </div>
                    <div 
                        className={`navController-pill ${currentView === "tutorial" ? "selected" : ""}`}
                        onClick={() => dispatch(setCurrentView("tutorial"))}
                    >
                        <img src={RocketSvg} />
                        <h6>Tutorial</h6>
                    </div>
                    {isLoggedIn && <div className={`navController-pill ${currentView === "purchase" ? "selected" : ""}`} onClick={payment}>
                            <img src={RobotSvg} />
                            <h6>Add Agent</h6>
                    </div>}

                    {!isLoggedIn && <Auth launch={launch} mask="true" payment={payment}/> }
                    </div>
                <div className="navController-pageSelectors">
                    
                    {isLoggedIn && (<>
                        <p className="italic" style={{marginLeft: '10px', marginBottom: '5px'}}>Your Agents</p>
                        <div className="navController-agentSel-col">
                        {
                            dropDownOptions.map((option, index) => {
                                return (
                                    <div
                                        key={index}
                                        className={`navController-pill ${activeBlogAgent === option.id ? "selected" : ""}`}
                                        onClick={() => dispatch(setActiveBlogAgent(option.id))}
                                    >
                                    <h6>{option.text}</h6>
                                </div>
                                )
                            })
                        }
                        </div>
                    </>)}
                    {/* {isLoggedIn && 
                        <a className={`navController-pill`} href="https://billing.stripe.com/p/login/28obKwfrLb5L6WIaEE" target="_blank">
                            <img src={RobotSvg} />
                            <h6>Fire Agent</h6>
                        </a>
                    } */}
                </div>
            </div>
                <div className="navController-pageSelectors">
                    <a 
                        className={`navController-pill`}
                        href={constants.discordUrl} target='_blank'>
                            <img src={DiscordSvg} />
                            <h6>Discord</h6>
                    </a>
                    <a 
                        className={`navController-pill`}
                        href="https://blog.langface.ai" target='_blank'>
                            <img src={BookSvg} />
                            <h6>Our Blog</h6>
                    </a>

                <Auth launch={launch}/>
            </div>
        </div>
    )
}
export default NavController;
