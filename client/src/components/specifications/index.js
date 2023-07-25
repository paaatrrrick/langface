import React, {useState, useEffect} from 'react';
import './specifications.css';
import { useSelector, useDispatch } from 'react-redux';
import { actions } from '../../store';
import Name from './slides/Name';
import ValueProposition from './slides/ValueProposition';
import Insights from './slides/Insights';
import Links from './slides/Links';
import Loader from "../loader";
import constants from "../../constants";
import { getUserAuthToken } from "../../utils/getJwt";



const inputsArray = [
    Name,
    ValueProposition,
    Insights,
    Links
]

const Specifications = ({dontShowTopSave}) => {
    const dispatch = useDispatch();
    const [currentSlide, setCurrentSlide] = useState(0);
    const activeBlogAgent = useSelector((state) => state.main.activeBlogAgent);
    const blogAgents = useSelector((state) => state.main.blogAgents);
    const currentBlog = blogAgents[activeBlogAgent];
    const businessData = currentBlog.businessData;
    const [specs, setSpecs] = useState(businessData);
    const [loading, setLoading] = useState(false);
    const fields = Object.keys(specs);

    const updateSpecsOnSlideChange = async (direction) => {
        const changes = {};
        for (let field of fields) {
            if (specs[field] !== businessData[field]) {
                changes[field] = specs[field];
            }
        }
        if (Object.keys(changes).length === 0) {
            moveSlide(direction);
            return;
        }
        if (currentBlog.demo) {
            dispatch(actions.updatebusinessData(changes));
            moveSlide(direction);
            return;
        }
        setLoading(true);
        const res = await fetch(`${constants.url}/updateSpecifications`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', "x-access'langface-auth-token": getUserAuthToken()}, 
            body: JSON.stringify({businessData: specs})
        });
        if (!res.ok) {
            dispatch(actions.setBannerMessage({type: "error", message: "Oops, we had an error updating your information. Please refresh the page and try again."}));
        } else {
            dispatch(actions.updatebusinessData(specs));
        }
        setLoading(false);
    }

    const moveSlide = (direction) => {
        if (direction === "back") {
            setCurrentSlide(currentSlide - 1);
        } else if (direction === "forwards"){
            setCurrentSlide(currentSlide + 1);
        }
    }
    console.log(businessData);
    const Components = inputsArray[currentSlide];
    return (
        <div className="specifications">
            <h2>Tell us about your business</h2>
            {loading && <div className="abs-center"><Loader/></div>}
            {(!dontShowTopSave && currentSlide !== (inputsArray.length  - 1)) && <button onClick={updateSpecsOnSlideChange}className='specs-saveBtn'>Save</button>}
            {(currentSlide == (inputsArray.length  - 1)) && <button onClick={updateSpecsOnSlideChange}className='app-btn1 spec-move-forward'>Save</button>}
            <Components specs={specs} setSpecs={setSpecs}/>
            {(currentSlide !== 0) && <button className='app-btn1 spec-move-back' disabled={loading} onClick={() => {updateSpecsOnSlideChange("back")}}>Back</button>}
            {(currentSlide !== (inputsArray.length  - 1)) && <button className='app-btn1 spec-move-forward' disabled={loading} onClick={() => {updateSpecsOnSlideChange("forwards")}}>Next</button>}
        </div>
    );
}

export default Specifications;