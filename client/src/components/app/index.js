import React from 'react';
import './app.css'
import Home from '../home';
import BannerMessage from '../bannerMessage';
import { useDispatch, useSelector } from 'react-redux';
import { clearPopUpMessage } from '../../store';


const App = () => {
    const dispatch = useDispatch();
    const message = useSelector(state => state.main.popUpMessage);
    return (
        <div className="App">
            {message && <BannerMessage messageObject={message} close={() => dispatch(clearPopUpMessage())} />}
            <Home />
        </div>
    );
}

export default App;