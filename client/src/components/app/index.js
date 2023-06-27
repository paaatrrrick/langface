import React from 'react';
import './app.css'
import { useDispatch, useSelector } from 'react-redux';
import { clearBannerMessage, clearPopUpTemplate } from '../../store';
import NavController from '../navController';
import BannerMessage from '../bannerMessage';
import Home from '../home';
import Settings from '../settings';
import Tutorial from '../tutorial';


const templateMap = {
    blogger: Home,
    settings: Settings,
    tutorial: Tutorial
}

const App = () => {
    const dispatch = useDispatch();
    const { bannerMessage, currentView }= useSelector(state => state.main);
    const Component = templateMap[currentView] || Home;
    return (
        <div className="App">
            <NavController />
            <div className="App-right-section">
                <div className="flex-grow-1">

                </div>
                <div className="body">
                    {bannerMessage && <BannerMessage messageObject={bannerMessage} close={() => dispatch(clearBannerMessage())} />}
                    <Component/>
                </div>
                <div className="flex-grow-1">

                </div>
            </div>
        </div>
    );
}

export default App;