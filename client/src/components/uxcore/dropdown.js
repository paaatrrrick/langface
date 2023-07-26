import React, { useState } from "react";
import "./dropdown.css";
import TriangleSvg from "../../assets/triangle.svg";
import { trimStringToChars } from "../../utils/helpers";

const Dropdown = ({ options, selected, onSelectedChange }) => {
    const [open, setOpen] = useState(false);
    var nameLessCount = 0
    for (let i = 0; i < options.length; i++) {
        if (options[i].text === '') {
            nameLessCount++;
            options[i].text = `New Agent ${nameLessCount}`;
        }
    }
    const active = options.find((option) => option.id === selected);
    const optionsWithoutSelected = options.filter((option) => option.id !== selected);
    console.log(active);

    if (!open){
        return (
            <div key={-1} className="Dropdown-parent Dropdown-pill Dropdown-row-hover" onClick={() => setOpen(!open)}>
                <p>{trimStringToChars(active.text, 25)}</p>
                <img src={TriangleSvg} className={`rotate180`}/>
            </div>
        )
    }


    return (
    <div className="Dropdown-parent Dropdown">
        <div key={-1} className="Dropdown-row Dropdown-row-hover" onClick={() => setOpen(!open)}>
            <p>{trimStringToChars(active.text, 25)}</p>
            <img src={TriangleSvg}/>
        </div>
        {open && (
            <>
            {optionsWithoutSelected.map((option, index) => {
                return (
                    <div className="Dropdown-row Dropdown-row-hover" key={index} onClick={() => {onSelectedChange(option.id); setOpen(false);}}>
                        <p>{trimStringToChars(option.text, 25)}</p>
                    </div>
            )})}
            </>
        )}
    </div>
    );
};

export default Dropdown;