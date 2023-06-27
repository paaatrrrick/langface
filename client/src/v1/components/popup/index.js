import React from "react";
import "./popup.css";
import Tutorial from "./templates/tutorial";
import Settings from "./templates/settings";

const PopUp = ({ close, template }) => {
    const templateMap = {
        'tutorial': Tutorial,
        'settings': Settings
    }
    const Component = templateMap[template] || Tutorial;
    return <Component close={close} />
}
export default PopUp;