import React from 'react';
import './navController.css'
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentView } from '../../store';
import HomeSvg from '../../assets/home-outline.svg';
import SettingsSvg from '../../assets/settings-outline.svg';
import RocketSvg from '../../assets/rocket-outline.svg';
import DiscordSvg from '../../assets/logo-discord.svg';
import BookSvg from '../../assets/book-outline.svg';
import EarthSvg from '../../assets/earth-outline.svg';

const NavController = () => {
    const dispatch = useDispatch();
    const { currentView, blogAgents } = useSelector(state => state.main);
    const blogKeys = Object.keys(blogAgents);
    return (
        <div className="navController">
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
                <div className={`navController-pill ${currentView === "addAgent" ? "selected" : ""}`}
                    onClick={() => dispatch(setCurrentView("addAgent"))}>
                    <img src={EarthSvg} />
                    <h6>Add Agent +</h6>
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
                </div>
                <hr/>
                <div className="navController-pageSelectors">
                <a 
                className={`navController-pill`}
                href="https://discord.gg/HCkHcrh3U" target='_blank'>
                    <img src={DiscordSvg} />
                    <h6>Discord</h6>
                </a>

                <a 
                className={`navController-pill`}
                href="https://blog.langface.ai" target='_blank'>
                    <img src={BookSvg} />
                    <h6>Our Blog</h6>
                </a>
            </div>
        </div>
    )
}
export default NavController;
