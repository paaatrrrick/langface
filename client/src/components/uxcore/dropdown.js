import React, { useState } from "react";
import "./dropdown.css";
import TriangleSvg from "../../assets/triangle.svg";

const trimStringTo15Chars = (str) => {
    if (str.length > 15) {
        return str.substring(0, 13) + "...";
    } else {
        return str;
    }
}


const Dropdown = ({ options, selected, onSelectedChange }) => {
    const [open, setOpen] = useState(false);
    const active = options.find((option) => option.id === selected);
    return (
    <div className="Dropdown">
        <div className="Dropdown-row" onClick={() => setOpen(!open)}>
            <p>{trimStringTo15Chars(active.text)}</p>
            <img src={TriangleSvg} className={!open && `rotate180`}/>
        </div>
        {open && (
            <>
            {options.map((option, index) => {
                return (
                    <>
                        {(option.id !== selected) && (
                            <div className="Dropdown-row"
                             key={index}
                             onClick={() => {
                                onSelectedChange(options[index].id);
                                setOpen(false);
                            }}>
                                <p>{trimStringTo15Chars(options[index].text)}</p>
                            </div>
                        )}
                    </>
                )
            })}
            <div className="Dropdown-row"
            onClick={() => {
                onSelectedChange("AddNewAgent");
                setOpen(false);
            }}>
                <p>Add New Agent + </p>
            </div>
            </>
        )}
    </div>
    );
};

export default Dropdown;