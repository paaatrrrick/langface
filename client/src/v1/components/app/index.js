import React from 'react';
import './app.css'
import Home from '../home';
import PopUp from '../popup';
import BannerMessage from '../bannerMessage';
import { useDispatch, useSelector } from 'react-redux';
import { clearBannerMessage, clearPopUpTemplate } from '../../store';
import Navbar from '../navbar';


const App = () => {
    const dispatch = useDispatch();
    const { bannerMessage, popUpTemplate }= useSelector(state => state.main);
    return (
        <div className="App">
            <Navbar />
            {bannerMessage && <BannerMessage messageObject={bannerMessage} close={() => dispatch(clearBannerMessage())} />}
            {popUpTemplate && (<PopUp close={() => dispatch(clearPopUpTemplate())}template={popUpTemplate}/>)}
            <Home />
        </div>
    );
}

export default App;