import React from 'react';
import { useState, useEffect } from 'react';
import './html.css';

const data = [
    {
        H1: "Have an in house SEO team for a 100th of the cost",
        P1: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quo nisi aut tempora hic cumque perferendis optio, natus iusto ducimus quisquam, eum repellendus rerum quibusdam magnam fugiat, cupiditate pariatur dolores ex!",
        IMG: "https://res.cloudinary.com/dlk3ezbal/image/upload/v1689782103/lh9ikjmgiflnvtcaer9i.png",
        H2: "How it works",
        P2: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Cum qui labore aliquam, quas praesentium totam quo? Enim, omnis? Aspernatur voluptas consequatur minima nobis numquam veniam tempora ullam odio neque quo?",
    },
    {
        H1: "France's best coffee shop",
        P1: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quo nisi aut tempora hic cumque perferendis optio, natus iusto ducimus quisquam, eum repellendus rerum quibusdam magnam fugiat, cupiditate pariatur dolores ex!",
        IMG: "https://res.cloudinary.com/dlk3ezbal/image/upload/v1689782103/lh9ikjmgiflnvtcaer9i.png",
        H2: "How it works",
        P2: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Cum qui labore aliquam, quas praesentium totam quo? Enim, omnis? Aspernatur voluptas consequatur minima nobis numquam veniam tempora ullam odio neque quo?",
    },
    {
        H1: "Taste the beauty",
        P1: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quo nisi aut tempora hic cumque perferendis optio, natus iusto ducimus quisquam, eum repellendus rerum quibusdam magnam fugiat, cupiditate pariatur dolores ex!",
        IMG: "https://res.cloudinary.com/dlk3ezbal/image/upload/v1689782103/lh9ikjmgiflnvtcaer9i.png",
        H2: "How it works",
        P2: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Cum qui labore aliquam, quas praesentium totam quo? Enim, omnis? Aspernatur voluptas consequatur minima nobis numquam veniam tempora ullam odio neque quo?",
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
        if (H1.length > display.h1.length) {
            setDisplay({ ...display, h1: H1.slice(0, display.h1.length + 1) })
        } else if (P1.length > display.p1.length) {
            setDisplay({ ...display, p1: P1.slice(0, display.p1.length + 1) })
        } else if (IMG.length > display.img.length) {
            setDisplay({ ...display, img: IMG})
        } else if (H2.length > display.h2.length) {
            setDisplay({ ...display, h2: H2.slice(0, display.h2.length + 1) })
        } else if (P2.length > display.p2.length) {
            setDisplay({ ...display, p2: P2.slice(0, display.p2.length + 1) })
        } else {
            if (timeout) {
                return timeout - 1;
            } 
            setDisplay({ h1: "", p1: "", img: "", h2: "", p2: "" });
            if (dataIndex === data.length - 1){
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
            console.log(timeout)
            timeout = displayText(timeout);
        }, 16);
        return () => clearInterval(interval);
    }, [display]);

    const { h1, p1, img, h2, p2 } = display;
    return (
        <div className='launch-HTML'>
            {h1 && <h3>{h1}</h3>}
            {p1 && <p>{p1}</p>}
            {/* {img && 
            <div className="html-imgWrapeer">
                <img src={img} />
            </div>} */}
            {h2 && <h4>{h2}</h4>}
            {p2 && <p>{p2}</p>}
            
        </div>
    )
}

export default HTML;