import React, { useRef, useState, useEffect } from 'react';
import './navController.css'
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentView, setBannerMessage } from '../../store';
import HomeSvg from '../../assets/home-outline.svg';
import SettingsSvg from '../../assets/settings-outline.svg';
import RocketSvg from '../../assets/rocket-outline.svg';
import DiscordSvg from '../../assets/logo-discord.svg';
import BookSvg from '../../assets/book-outline.svg';
import { GoogleLogin } from '@react-oauth/google';
import constants from "../../constants";
import EarthSvg from '../../assets/earth-outline.svg';

const NavController = ({launch}) => {
    const dispatch = useDispatch();
    const { currentView, blogAgents } = useSelector(state => state.main);
    const [parentRefWidth, setParentRefWidth] = useState(0);
    const parentRef = useRef(null);
    const blogKeys = Object.keys(blogAgents);

    useEffect(() => {
        const handleResize = () => {
            if (parentRef.current) {
                setParentRefWidth(parentRef.current ? parentRef.current.offsetWidth - 16: 208);
            }
          }
        window.addEventListener("resize", handleResize);
        // Call handler right away so state gets updated with initial window size
        handleResize();
        // Remove event listener on cleanup
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleLogin = async (credentialResponse) => {
        const res = await fetch(`${constants.url}/google`, {
            credentials: "include",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ credentialResponse }),
        });
        if (!res.ok) {
            dispatch(setBannerMessage({ message: "Error logging in", type: "error" }));
        } else {
            launch();
        }
    }
    return (
        <div className="navController" ref={parentRef}>
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
                <GoogleLogin
                    onSuccess={credentialResponse => {
                        console.log(credentialResponse);
                        handleLogin(credentialResponse);
                    }}
                    width={`${parentRefWidth}px`}
                    auto_select={true}
                    // ux_mode='popup'
                    size={(parentRefWidth < 200) ? 'small' : 'large'}
                    onError={() => {
                        dispatch(
                            setBannerMessage({ message: "Error Logging in with Google", type: "error", timeout: 10000 })
                        );
                    }}
                />
            </div>
        </div>
    )
}
export default NavController;
