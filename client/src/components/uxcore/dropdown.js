import React, { useState } from "react";
import "./dropdown.css";
import TriangleSvg from "../../assets/triangle.svg";
const Dropdown = ({ options, selected, onSelectedChange }) => {
    const [open, setOpen] = useState(true);
    const active = options.find((option) => option.id === selected);
    return (
    <div className="Dropdown">
        <div className="Dropdown">
            <div className="Dropdown-row row">
                <p>{active.text}</p>
                <img src={TriangleSvg} className="rotate180"/>
            </div>
        </div>

        {/* {options.map((option, index) => {
                return (
                    <>
                    <div className="Dropdown-row hoverable" onClick={() => {
                        onSelectedChange(options[index].id);
                        setOpen(false);
                    }}>
                        <p>{options[index].text}</p>
                    </div>
                    <hr/>
                    </>
                )
            })} */}
            <div className="Dropdown-row hoverable"
            onClick={() => {
                onSelectedChange("AddNewAgent");
                setOpen(false);
            }}>
                <p>Add New Agent + </p>
            </div>
    </div>
    );
};

export default Dropdown;