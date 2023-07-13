import React from "react";
import "./bannerMessage.css";
import { useEffect } from "react";

const classNameMap = {
    "error": "banner-message error-message",
    "success": "banner-message success-message",
}

const BannerMessage = ({ messageObject, close }) => {
    const { message, timeout, type } = messageObject;

    useEffect(() => {
        if (timeout) {
            setTimeout(() => {
                close();
            }, timeout);
        }
    }, []);

    const classes = classNameMap[type] || "banner-message error-message";
    return (
        <div className={`${classes}`}>
            <p>{message}</p>
            <button onClick={close}>&times;</button>
        </div >
    );
}
export default BannerMessage;