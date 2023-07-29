import React from 'react';
import './nightToggle.css';
import { useSelector, useDispatch } from 'react-redux';
import { actions } from '../../store';

const NightToggle = ({nightMode, setNightMode}) => {
    const dispatch = useDispatch();
    let { version, colorScheme }  = useSelector((state) => state.main);
    const toggleColorScheme = () => {
        if (colorScheme === "light") {
        dispatch(actions.setColorScheme("dark"));
        } else {
        dispatch(actions.setColorScheme("light"));
        }
    };
    return (
        <div className = 'toggle-switch'>
            <label>
                <input type = 'checkbox' onClick={toggleColorScheme} checked={colorScheme === 'light'}/>
                <span className = 'slider'></span>
            </label>
        </div>
    )
}

export default NightToggle;