import React from 'react';
import { useState, useEffect } from 'react';
import './html.css';
import redwood from '../../../assets/redwood.jpg';
import coffee from '../../../assets/coffee.jpg';

const data = [
    {
        IMG: redwood,
        H1: "Embracing the Giants: A Memorable Camping Trip in the Redwood Forest",
        P1: "A camping trip in the Redwood Forest is a breathtaking encounter with the world's tallest trees. It's a serene yet awe-inspiring environment, perfect for every camper seeking tranquility and adventure. The keys to a successful journey here involve thoughtful preparation and environmental respect....",
        H2: "",
        P2: "",
    },
    {
        IMG: coffee,
        H1: "From Bean to Brew: Delving into the World of Coffee",
        P1: "There's an art to understanding coffee, a beloved beverage celebrated worldwide. Its rich history, fascinating cultivation process, diverse types, and brewing techniques make coffee more than just a morning pick-me-up. The first step to truly appreciating this liquid gold begins with understanding the journey of the coffee bean....",
        H2: "",
        P2: "",
    },
]

const HTML = () => {
    const [dataIndex, setDataIndex] = useState(0);
    const [display, setDisplay] = useState({
        h1: "",
        p1: "",
        img: "",
        h2: "",
        p2: "",
    });
    const { H1, P1, IMG, H2, P2 } = data[dataIndex];



    //this function should add the next letter to the display text. Start with h1, then p1, then img, then h2, then p2. For the img, it should be a 1 second delay before the next text is displayed.
    const displayText = (timeout) => {
        if (IMG.length > display.img.length) {
            setDisplay({ ...display, img: IMG})
        } else if (H1.length > display.h1.length) {
            setDisplay({ ...display, h1: H1.slice(0, display.h1.length + 1) })
        } else if (P1.length > display.p1.length) {
            setDisplay({ ...display, p1: P1.slice(0, display.p1.length + 1) })
        } else if (H2.length > display.h2.length) {
            setDisplay({ ...display, h2: H2.slice(0, display.h2.length + 1) })
        } else if (P2.length > display.p2.length) {
            setDisplay({ ...display, p2: P2.slice(0, display.p2.length + 1) })
        } else {
            if (timeout) {
                return timeout - 1;
            } 
            setDisplay({ h1: "", p1: "", img: "", h2: "", p2: "" });
            if (dataIndex >= data.length - 1){
                setDataIndex(0);
            } else {
                setDataIndex(dataIndex + 1);
            }
        }
        return 200;
    }

    useEffect(() => {
        var timeout = 200;
        const interval = setInterval(() => {
            timeout = displayText(timeout);
        }, 16);
        return () => clearInterval(interval);
    }, [display]);

    const { h1, p1, img, h2, p2 } = display;
    const imsrc = !dataIndex ? redwood : coffee;
    return (
        <div className='launch-HTML'>
            <div className="html-imgWrapeer">
                <img src={imsrc} />
            </div>
            {h1 && <h3>{h1}</h3>}
            {p1 && <p>{p1}</p>}

            {h2 && <h4>{h2}</h4>}
            {p2 && <p>{p2}</p>}
            
        </div>
    )
}

export default HTML;