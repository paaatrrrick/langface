import React, { useEffect } from 'react';
import './app.css'
import { useDispatch, useSelector } from 'react-redux';
import { createCheckoutSession, isAuthenticatedResponse } from '../../utils/getJwt';
import constants from '../../constants';
import { clearBannerMessage, updateBlogAgentData, setBannerMessage, login, setBlogIds, signOut, addBlogAgent } from '../../store';
import { setColorScheme } from '../../utils/styles';
import { getUserAuthToken } from '../../utils/getJwt';
import NavController from '../navController';
import BannerMessage from '../bannerMessage';
import Home from '../home';
import Settings from '../settings';
import Tutorial from '../tutorial';
import io from "socket.io-client";
let socket;



const templateMap = {
    blogger: Home,
    settings: Settings,
    tutorial: Tutorial,
}

const App = () => {
    const dispatch = useDispatch();
    const { bannerMessage, currentView, colorScheme, tabId }= useSelector(state => state.main);

    useEffect(() => {
        setColorScheme(colorScheme);
    }, [colorScheme])

    const launch = async () => {
        var userToken = getUserAuthToken();
        if (!userToken) return;
        const res = await fetch(`${constants.url}/user`, {
            method: 'GET',
            headers: {
                "x-access'langface-auth-token": getUserAuthToken()
            },
        });

        if(!isAuthenticatedResponse(res, () => {setBannerMessage({type: 'error', message: 'Error: Could not authenticate user', timeout: 5000});dispatch(signOut());})){return};

        if (!res.ok) {
            dispatch(setBannerMessage({type: 'error', message: 'Error: Could not authenticate user', timeout: 5000}));
            dispatch(signOut());
            return;
        }
        const data = await res.json();
        dispatch(login({blogs: data.blogs, user: data.user}));
        const blogIds = data.blogs.map(blog => blog._id);
        joinRoom(blogIds);
    }

    const payment = async () => {
        const res = await createCheckoutSession();
        if (!res) {
            dispatch(setBannerMessage({message: "Payment failed. Reach out in the discord if you have any questions", type: "error"}));
        } else {
            dispatch(setBannerMessage({message: "Payment succeeded. ", type: "success", timeout: 5000}));
            dispatch(addBlogAgent(res))
        }
    }

    const joinRoom = async (blogIds) => {
        //check if type string, cast to array if so 
        if (typeof blogIds === 'string') blogIds = [blogIds];
        dispatch(setBlogIds(blogIds));
        socket.emit("joinRoom", { blogIds, tabId });
    }
    useEffect(() => {
        socket = io(constants.url);
        socket.on("updateData", (incomingData) => {
            console.log('incoming data');
            console.log(incomingData);
            dispatch(updateBlogAgentData(incomingData));
        });
        launch();
        return () => {
          socket.emit("leaveRoom", { tabId })
          socket.disconnect();
        };
    }, []);

    const sendReferral = async (id) => {
        const res = await fetch(`${constants.url}/rewardful`, {
            method: 'POST',
            headers: {
                "x-access'langface-auth-token": getUserAuthToken(),
                "referral-id": id,
            },
        });
    }
    useEffect(() => {
        window.rewardful('ready', function() {
            if(window.Rewardful.referral) {
                console.log("referral: " + window.Rewardful.referral);
                sendReferral(window.Rewardful.referral);
            }
        });
    });      

    const Component = templateMap[currentView] || Home;
    return (
        <div className="App">
            <NavController launch={launch} payment={payment} />
            <div className="App-right-section">
                <div className="flex-grow-1"/>
                <div className="body">
                    {bannerMessage && <BannerMessage messageObject={bannerMessage} close={() => dispatch(clearBannerMessage())} />}
                    <Component joinRoom={joinRoom} payment={payment}/>
                </div>
                <div className="flex-grow-1"/>
            </div>
        </div>
    );
}

export default App;