import React from "react";

const Tutorial = ({ close }) => {
    return (
        <div className="guidePopUp">
            <h4>How to Get Started</h4>
            <p>1: Create an account on <a href="https://www.blogger.com/" target="_blank">blogger.com</a></p>
            <p>2: Create a new blog and style it the way you'd like</p>
            <p>3: Your blogger ID is the first large number in the URL. For example, if your URL is blogger.com/blog/posts/23908234, 23908234 is your blogger ID</p>
            <button onClick={close}>x</button>
        </div>
    )
}

export default Tutorial;
