import React from 'react';
import {useDispatch, } from 'react-redux';
import { actions } from '../../../store';
import MenuOutLine from "../../../assets/menu-outline.svg";
import './menuButton.css';


const MenuButton = (props) => {
    const {topCorner, whiteImg} = props;
    const dispatch = useDispatch();
    // const style 
    return (
        <button 
        onClick={() => {dispatch(actions.toggleSideBar())}}
        className={`menuButton ${topCorner && 'topCorner'} ${whiteImg && 'whiteImg'} z-50`}>
            <img 
            style={whiteImg ? {filter:'invert(100%)' } : {}}
            src={MenuOutLine} alt='menu outline'/>
        </button>
    );
}

export default MenuButton;