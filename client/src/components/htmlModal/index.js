import "./htmlModal.css";
import parse from 'html-react-parser';
import { useEffect, useState } from "react";

const HtmlModal = ({html, close}) => {
    const [raw, setRaw] = useState(false);
    return (
    <div className="HtmlModal-overlay">
        
        <div className="HtmlModal">
        <button className="close-button" onClick={close}>&times;</button>
            <div className="HtmlModal-toprow">
                <div className="HtmlModal-slider">
                    <button className={`HtmlModal-html-button ${!raw ? 'HtmlModal-html-button-active' : ''}`}
                        onClick={() => setRaw(!raw)}
                    >
                        Html
                    </button>
                    <button className={`HtmlModal-html-button ${raw ? 'HtmlModal-html-button-active' : ''}`}
                        onClick={() => setRaw(!raw)}
                    >
                        Raw
                    </button>
                </div>

            </div>
            <div className="HtmlModal-content">
            {!raw ? parse(html) : <p>{html}</p>}
            </div>
        </div>
    </div>
    )
}

export default HtmlModal;