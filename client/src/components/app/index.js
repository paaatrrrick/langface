import React, { useEffect } from 'react';
import './app.css'
import { useDispatch, useSelector } from 'react-redux';
import constants from '../../constants';
import { clearBannerMessage, updateBlogAgentData, setBannerMessage, login } from '../../store';
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
        var userCookie = getUserAuthToken();
        if (!userCookie) return;
        const res = await fetch(`${constants.url}/user`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!res.ok) {
            dispatch(setBannerMessage({type: 'error', message: 'Error: Could not authenticate user'}));
            return;
        }
        const data = await res.json();
        dispatch(login({blogs: data.blogs, user: data.user}));
        const blogIds = data.blogs.map(blog => blog._id);
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
          console.log('returning');
          socket.emit("leaveRoom", { tabId })
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