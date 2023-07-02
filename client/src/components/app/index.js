import React, { useEffect } from 'react';
import './app.css'
import { useDispatch, useSelector } from 'react-redux';
import constants from '../../constants';
import { addAgent, clearBannerMessage, clearPopUpTemplate, updateBlogAgentData } from '../../store';
import { setColorScheme } from '../../utils/styles';
import NavController from '../navController';
import BannerMessage from '../bannerMessage';
import Home from '../home';
import Settings from '../settings';
import Tutorial from '../tutorial';
import AddAgent from '../addAgent';
import io from "socket.io-client";
let socket;



const templateMap = {
    blogger: Home,
    settings: Settings,
    tutorial: Tutorial,
    addAgent: AddAgent
}

const App = () => {
    const dispatch = useDispatch();
    const { bannerMessage, currentView, colorScheme }= useSelector(state => state.main);

    useEffect(() => {
        setColorScheme(colorScheme);
    }, [colorScheme])

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
            <NavController />
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