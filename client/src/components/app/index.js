import React, {useEffect, useState} from 'react';
import './app.css';
import HtmlModal from "../htmlModal";
import NightToggle from '../uxcore/nightToggle';
import {useDispatch, useSelector} from 'react-redux';
import { isAuthenticatedResponse} from '../../utils/getJwt';
import constants from '../../constants';
import {clearBannerMessage,updateBlogAgentData, setBannerMessage, login, setBlogIds, signOut, setHtmlModal, actions } from '../../store';
import {setColorScheme} from '../../utils/styles';
import {getUserAuthToken} from '../../utils/getJwt';
import NavController from '../navController';
import BannerMessage from '../bannerMessage';
import Home from '../home';
import Settings from '../settings';
import Tutorial from '../tutorial';
import Launch from '../launch';
import PurchaseScreen from '../purchaseScreen';
import io from "socket.io-client";
import MenuButton from '../app/components/menuButton';
import Specifications from '../specifications';
let socket;


const templateMap = {
    blogger: Home,
    settings: Settings,
    tutorial: Tutorial,
    purchase: PurchaseScreen
}

const App = () => {
    const dispatch = useDispatch();
    const {
        bannerMessage,
        currentView,
        colorScheme,
        tabId,
        htmlModal,
        showSideBar,
        activeBlogAgent,
        blogAgents
    } = useSelector(state => state.main);
    const currentBlog = blogAgents[activeBlogAgent];

    useEffect(() => {
        setColorScheme(colorScheme);
    }, [colorScheme])

    const launch = async () => {
        var userToken = getUserAuthToken();
        if (! userToken) 
            return;
        
        const res = await fetch(`${
            constants.url
        }/user`, {
            method: 'GET',
            headers: {
                "x-access'langface-auth-token": getUserAuthToken()
            }
        });

        if (!isAuthenticatedResponse(res, () => {
            setBannerMessage({type: 'error', message: 'Error: Could not authenticate user', timeout: 5000});
            dispatch(signOut());
        })) {
            return
        };

        if (! res.ok) {
            dispatch(setBannerMessage({type: 'error', message: 'Error: Could not authenticate user', timeout: 5000}));
            dispatch(signOut());
            return;
        }
        const data = await res.json();
        dispatch(login({blogs: data.blogs, user: data.user}));
        const blogIds = data.blogs.map(blog => blog._id);
        joinRoom(blogIds);
    }

    const joinRoom = async (blogIds) => { // check if type string, cast to array if so
        if (typeof blogIds === 'string') 
            blogIds = [blogIds];
        
        dispatch(setBlogIds(blogIds));
        socket.emit("joinRoom", {blogIds, tabId});
    }
    useEffect(() => {
        socket = io(constants.url);
        socket.on("updateData", (incomingData) => {
            console.log('incoming data');
            console.log(incomingData);
            dispatch(updateBlogAgentData(incomingData));
        });
        launch();
        return() => {
            socket.emit("leaveRoom", {tabId})
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        window.rewardful('ready', function () {
            if (window.Rewardful.referral) {
                console.log("referral: " + window.Rewardful.referral);
                window.localStorage.setItem("referral-id", window.Rewardful.referral);
            }
        });
    });


    const Component = templateMap[currentView] || Home;
    return (
        <div className="App">
        {!showSideBar && <MenuButton topCorner whiteImg={(currentView === 'launch') ? true : false}/>}

        <NavController launch={launch} close={showSideBar}/>
        {htmlModal && <HtmlModal html={htmlModal}close={() => {dispatch(setHtmlModal(""))}}/>}

        {currentView === 'launch' ? <Launch/> :
        <>
            <NightToggle/>
            {(currentBlog.settingUp && currentView === "home" && false) &&
                <div className="HtmlModal-overlay"> 
                    <div className="HtmlModalSpecs">
                        <Specifications dontShowTopSave/>
                    </div>
                </div>
            }
            <div className="App-right-section">
                <div className="flex-grow-1"/>
                <div className="body"> {
                    bannerMessage && <BannerMessage messageObject={bannerMessage}
                        close={
                            () => dispatch(clearBannerMessage())
                        }/>
                }
                    <Component joinRoom={joinRoom}/>
                </div>
                <div className="flex-grow-1"/>
            </div>
        </>

            }
    </div>);
}

export default App;
