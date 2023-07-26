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

const Specifications = ({dontShowTopSave, closeOnSave}) => {
    const dispatch = useDispatch();
    const [currentSlide, setCurrentSlide] = useState(0);
    const activeBlogAgent = useSelector((state) => state.main.activeBlogAgent);
    const blogAgents = useSelector((state) => state.main.blogAgents);
    const currentBlog = blogAgents[activeBlogAgent];
    const businessData = currentBlog.businessData;
    const [specs, setSpecs] = useState(businessData);
    const [loading, setLoading] = useState(false);
    const fields = Object.keys(specs);

    const updateSpecsOnSlideChange = async (direction, final) => {
        const changes = {};
        for (let field of fields) {
            if (specs[field] !== businessData[field]) {
                changes[field] = specs[field];
            }
        }
        if (Object.keys(changes).length === 0) {
            moveSlide(direction, final);
            return;
        }
        if (currentBlog.demo) {
            dispatch(actions.updatebusinessData(changes));
            moveSlide(direction, final);
            return;
        }
        setLoading(true);
        const res = await fetch(`${constants.url}/updateBusinessData`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', "x-access'langface-auth-token": getUserAuthToken()}, 
            body: JSON.stringify({businessData: specs, blogID: activeBlogAgent})
        });
        if (!res.ok) {
            dispatch(actions.setBannerMessage({type: "error", message: "Oops, we had an error updating your information. Please refresh the page and try again."}));
        } else {
            dispatch(actions.updatebusinessData(specs));
            moveSlide(direction, final);
        }
        setLoading(false);
    }

    console.log(activeBlogAgent);

    const moveSlide = (direction, final) => {
        if (final && closeOnSave) {
            dispatch(actions.updateBlogAgent({id : activeBlogAgent, settingUp: false}));
        } else if (final) {
            dispatch(actions.updateBlogAgent({id : activeBlogAgent, settingUp: false}));
            dispatch(actions.setCurrentView("home"));        
        } else if (direction === "back") {
            setCurrentSlide(currentSlide - 1);
        } else if (direction === "forwards"){
            setCurrentSlide(currentSlide + 1);
        }
    }
    var canGoNext = true;
    if (currentSlide === 0 && (!specs.name || !specs.product)) {
        canGoNext = false;
    }

    const Components = inputsArray[currentSlide];
    return (
        <div className="specifications">
            <h2 className='text-2xl'>Tell us about your business</h2>
            {!loading && <Components specs={specs} setSpecs={setSpecs}/>}
            {loading && <div className="abs-center"><Loader/></div>}
            {(!dontShowTopSave && currentSlide !== (inputsArray.length  - 1)) && <button onClick={updateSpecsOnSlideChange} className='specs-saveBtn' disabled={(loading || !canGoNext)}>Save</button>}
            {(dontShowTopSave && currentSlide !== 0) && 
            <button onClick={() => {updateSpecsOnSlideChange('nil', true)}} 
            className='absolute top-5 right-5 rounded-full bg-light2 w-8 h-8 bg-l-l2 text-center hover:bg-b2 hover:text-brandColor' 
            disabled={(loading || !canGoNext)}>&times;</button>}
            {(currentSlide == (inputsArray.length  - 1)) && <button onClick={() => {updateSpecsOnSlideChange('', true)}}className='app-btn1 spec-move-forward' disabled={(loading || !canGoNext)}>Save</button>}
            {(currentSlide !== 0) && <button className='app-btn1 spec-move-back' disabled={loading} onClick={() => {updateSpecsOnSlideChange("back")}}>Back</button>}
            {(currentSlide !== (inputsArray.length  - 1)) && <button className='app-btn1 spec-move-forward' disabled={(loading || !canGoNext)} onClick={() => {updateSpecsOnSlideChange("forwards")}}>Next</button>}

        </div>
    );
}

export default Specifications;