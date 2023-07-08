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
    const optionsWithoutSelected = options.filter((option) => option.id !== selected);
    return (
    <div className="Dropdown">
        <div key={-1} className="Dropdown-row" onClick={() => setOpen(!open)}>
            <p>{trimStringTo15Chars(active.text)}</p>
            <img src={TriangleSvg} className={!open ? `rotate180` : ''}/>
        </div>
        {open && (
            <>
            {optionsWithoutSelected.map((option, index) => {
                return (
                    <div className="Dropdown-row" key={index} onClick={() => {onSelectedChange(option.id); setOpen(false);}}>
                        <p>{option}</p>
                        <p>{index}</p>
                        <p>{trimStringTo15Chars(option.text)}</p>
                    </div>
            )})}
            <div key={-2}
            className="Dropdown-row"
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