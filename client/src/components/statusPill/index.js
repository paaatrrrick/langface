import React from "react";
import "./statusPill.css";
import Loader from "../loader";

const StatusPill = ({ version, title, content, img, url  }) => {
    if (!title && !content) return null;
    return (
        <div className={`status-pill ${version}`}>
            <div className="row align-center justify start">
                {img && <img src={img} />}
                <h3>{title}</h3>
                {version === "updating" && <Loader />}
            </div>
            <p>{content}</p>
            {url && <a href={url} target="_blank">View Post</a>}
        </div>
    )
};
export default StatusPill;