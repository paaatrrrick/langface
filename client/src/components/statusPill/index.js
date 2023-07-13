import React from "react";
import "./statusPill.css";
import Loader from "../loader";
import { setHtmlModal } from '../../store';
import { useSelector, useDispatch } from "react-redux";



const StatusPill = ({ version, title, config, img, url, html, onClick  }) => {
    const dispatch = useDispatch();
    console.log("StatusPill", version, title, config, img, url, html, onClick)
    if (!title && !config) return null;
    return (
        <div className={`status-pill ${version}`}>
            <div className="row align-center justify start">
                {img && <img src={img} />}
                <h3>{title}</h3>
                {version === "updating" && <Loader />}
            </div>
            <p>{config}</p>
            <div className="row">
                {url && <a href={url} target="_blank">View Post</a>}
                {html && <a onClick={() => {dispatch(setHtmlModal(html))}} >View HTML</a>}
            </div>
        </div>
    )
};
export default StatusPill;