import React from "react";
import { useSelector } from "react-redux";
const Tutorial = ({ close }) => {
  let version = useSelector((state) => state.main.version);
  return (
    <div className="guidePopUp">
      <h4>How to Get Started</h4>
      {version === "wordpress" ? (
        <>
          <p>
            1: Create an account on{" "}
            <a href="https://wordpress.com/" target="_blank">
              Wordpress
            </a>
          </p>
          <p>2: Create a new blog and style it the way you'd like</p>
          <p>3: Click Login on this website then select your blog</p>
        </>
      ) : (
        <>
          <p>
            1: Create an account on{" "}
            <a href="https://www.blogger.com/" target="_blank">
              blogger.com
            </a>
          </p>
          <p>2: Create a new blog and style it the way you'd like</p>
          <p>
            3: Your blogger ID is the first large number in the URL. For
            example, if your URL is blogger.com/blog/posts/23908234, 23908234 is
            your blogger ID
          </p>
        </>
      )}
      <p>
        4: Enter a description of the types of posts and their stlyes you want.
        You can include urls to images or links to other websites
      </p>
      <button onClick={close}>x</button>
    </div>
  );
};

export default Tutorial;
