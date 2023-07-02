import React from "react";
import "./tutorial.css";
import Wordpress from "./templates/wordpressTutorial";
import Blogger from "./templates/bloggerTutorial";
import { useSelector } from "react-redux";

const Template = () => {
    const templateMap = {
        'blogger': Blogger,
        'wordpresss': Wordpress
    }
    const version = useSelector(state => state.main.version);
    const Component = templateMap[version] || Wordpress;
    return <Component/>
}
export default Template;