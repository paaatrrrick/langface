import React, { useRef, useState, useEffect } from 'react';
import './navController.css'
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentView, setBannerMessage,addBlogAgent } from '../../store';
import { createCheckoutSession } from '../../utils/getJwt';
import HomeSvg from '../../assets/home-outline.svg';
import SettingsSvg from '../../assets/settings-outline.svg';
import RocketSvg from '../../assets/rocket-outline.svg';
import DiscordSvg from '../../assets/logo-discord.svg';
import BookSvg from '../../assets/book-outline.svg';
import Auth from "../auth"
import RobotSvg from '../../assets/robot-outline.svg'

const NavController = ({launch}) => {
    const dispatch = useDispatch();
    const { currentView, blogAgents, isLoggedIn } = useSelector(state => state.main);
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

    const payment = async () => {
        const res = await createCheckoutSession();
        if (!res) {
            dispatch(setBannerMessage({message: "Payment failed. Reach out in the discord if you have any questions", type: "error"}));
        } else {
            dispatch(setBannerMessage({message: "Payment succeeded. ", type: "success", timeout: 5000}));
            dispatch(addBlogAgent(res))
        }
    }

    return (
        <div className="navController" ref={parentRef}>
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
                {isLoggedIn ? 
                (<div className={`navController-pill`} onClick={payment}>
                    <img src={RobotSvg} />
                    <h6>Hire Agent</h6>
                </div>) : 
                ( <Auth launch={launch} mask="true"/> )}
                {isLoggedIn && 
                        <a className={`navController-pill`} href="https://billing.stripe.com/p/login/28obKwfrLb5L6WIaEE" target="_blank">
                            <img src={RobotSvg} />
                            <h6>Fire Agent</h6>
                        </a>
                }
                </div>
            </div>

            <Auth launch={launch}/>
        </div>
    )
}
export default NavController;
