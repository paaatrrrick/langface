import React, { useEffect } from 'react';
import './app.css'
import { useDispatch, useSelector } from 'react-redux';
import constants from '../../constants';
import { addAgent, clearBannerMessage, clearPopUpTemplate, updateBlogAgentData, setBannerMessage } from '../../store';
import { setColorScheme } from '../../utils/styles';
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
    const { bannerMessage, currentView, colorScheme }= useSelector(state => state.main);

    useEffect(() => {
        setColorScheme(colorScheme);
    }, [colorScheme])

    const launch = async () => {
        console.log('at launch')
        var userCookie = document.cookie.split(';').find(cookie => cookie.startsWith(`${constants.authCookieName}=`));
        if (!userCookie) {
            userCookie = document.cookie.split(';').find(cookie => cookie.startsWith(`${constants.authCookieName} user-cookie=`));
        }
        if (userCookie) {
            const res = await fetch(`${constants.url}/user`, {
                method: 'GET',
                credentials: 'include'
            });
            if (!res.ok) {
                dispatch(setBannerMessage({type: 'error', message: 'Error: Could not authenticate user'}));
            } else {
                const data = await res.json();
                dispatch(setBannerMessage({type: 'success', message: 'Logged in'}));
                console.log(data);
            }
        }
    }
    useEffect(() => {
        launch();
    }, []);

    useEffect(() => {
        socket = io(constants.url);
        socket.on("updateData", (incomingData) => {updateBlogAgentData(incomingData);});
        return () => {
          socket.disconnect();
        };
    }, []);

    const Component = templateMap[currentView] || Home;
    return (
        <div className="App">
            <NavController launch={launch} />
            <div className="App-right-section">
                <div className="flex-grow-1"/>
                <div className="body">
                    {bannerMessage && <BannerMessage messageObject={bannerMessage} close={() => dispatch(clearBannerMessage())} />}
                    <Component/>
                </div>
                <div className="flex-grow-1"/>
            </div>
        </div>
    );
}

export default App;