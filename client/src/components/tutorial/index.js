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
    const activeBlogAgent = useSelector((state) => state.main.activeBlogAgent);
    const blogAgents = useSelector((state) => state.main.blogAgents);
    const template = blogAgents[activeBlogAgent].version || 'wordpress';
    const Component = templateMap[template] || Wordpress;
    return <Component/>
}
export default Template;