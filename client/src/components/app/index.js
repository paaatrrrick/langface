import React, { useEffect } from 'react';
import './app.css'
import { useDispatch, useSelector } from 'react-redux';
import { clearBannerMessage, clearPopUpTemplate } from '../../store';
import NavController from '../navController';
import BannerMessage from '../bannerMessage';
import Home from '../home';
import Settings from '../settings';
import Tutorial from '../tutorial';


const setColorScheme = (colorScheme) => {
    if (colorScheme === "light") {
        document.documentElement.style.setProperty('--brandOffColor', '#e0e1f7');
        document.documentElement.style.setProperty('--mainDark', '#212121');
        document.documentElement.style.setProperty('--lightDark', '#6c6685');
        document.documentElement.style.setProperty('--darkerBackground', '#f7f7f8');
        document.documentElement.style.setProperty('--lighterBackground', '#fff');
        document.documentElement.style.setProperty('--blackFiler', 'invert(0%) sepia(1%) saturate(7438%) hue-rotate(123deg) brightness(107%) contrast(100%)');
      } else {
        document.documentElement.style.setProperty('--brandOffColor', '#fff');
        document.documentElement.style.setProperty('--mainDark', '#fff');
        document.documentElement.style.setProperty('--lightDark', '#f7f7f8');
        document.documentElement.style.setProperty('--darkerBackground', '#0e0e0e');
        document.documentElement.style.setProperty('--lighterBackground', '#212121');
        document.documentElement.style.setProperty('--blackFiler', 'invert(100%) sepia(100%) saturate(0%) hue-rotate(83deg) brightness(108%) contrast(101%)');
      }
}

const templateMap = {
    blogger: Home,
    settings: Settings,
    tutorial: Tutorial
}

const App = () => {
    const dispatch = useDispatch();
    const { bannerMessage, currentView, colorScheme }= useSelector(state => state.main);

    useEffect(() => {
        console.log('init')
        setColorScheme(colorScheme);
    }, [colorScheme])

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