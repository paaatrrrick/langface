import React, { useEffect, userRef } from 'react';
import './launch.css';
import HTML from './components/html';
import AnimatedWrapper from './components/animatedWrapper';
import researchVectore from '../../assets/dataExtraction.svg';
import BlogSvg from '../../assets/blog.svg';
import Tree from 'react-d3-tree';
import PurchaseScreen from '../purchaseScreen';
import {useDispatch} from "react-redux";
import {actions} from "../../store";

const tree = {
    name: 'Best Coffee in France',
    children: [
        {
            name: 'Authentic French Espresso',
            children: [
                {
                    name: '',
                },
                {
                    name: '',
                },
            ]
        },
        {
            name: 'French Press Coffee How-To',
            children: [
                {
                    name: '',
                },
                {
                    name: '',
                },
            ]
        },
    ]
}

const Launch = () => {
    const dispatch = useDispatch();

    const openDemo = () => {
        dispatch(actions.toggleSideBar(true));
        dispatch(actions.setCurrentView("home"));
    }

    return (
        <div className='launch'>
            <div className="introArea">
                <div className="intro-top">
                    <h1>An AI-powered SEO writer that drives <br/> organic traffic to your website</h1>
                    <button className='tryIt' onClick={openDemo}>Try the free demo</button>
                    <div className='htmlWrapper'>
                        <HTML/>
                    </div>
                    <AnimatedWrapper direction='right'><h2>Our AI writes backlinked articles <br/> promoting your company</h2></AnimatedWrapper> 
                </div>
                <div className="intro-top">
                    <div className="custom-shape-divider-bottom-1689906032">
                        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                            <path d="M1200 120L0 16.48 0 0 1200 0 1200 120z" className="shape-fill"></path>
                        </svg>
                    </div>
                </div>
            </div>
            <div className="howItWorks">
                <AnimatedWrapper><h2
                style={{color: "#212121"}}
                >How Langface writes articles that rank on the 1st page</h2></AnimatedWrapper>
                <div className="howItWorksRows">
                    <div className="howIt-left">
                    <AnimatedWrapper direction='left'>
                        <h4>Niche Reseach</h4>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nobis aliquid veniam magni similique eligendi non hic ab, blanditiis id animi, quisquam fugiat molestias unde, veritatis reiciendis laboriosam cupiditate dolores nesciunt.</p>
                    </AnimatedWrapper>
                    </div>
                    <AnimatedWrapper direction='right'>
                    <img src={researchVectore} alt="AI rearch" />
                    </AnimatedWrapper>
                </div>
                <div className="howItWorksRows"
                style={{height: '500px'}}
                >
                    <AnimatedWrapper direction='left' className='launch-tree'>
                        <Tree 
                            data={tree} 
                            orientation="vertical"
                            zoom={1}
                            translate={{ x: 300, y: 80 }}
                            rootNodeClassName="node__root"
                            branchNodeClassName="node__branch"
                            leafNodeClassName="node__leaf"
                            zoomable={false}
                            draggable={false}
                            separation={{ siblings: 0.75, nonSiblings: 1.15 }}
                        />
                    </AnimatedWrapper>
                    <div className="howIt-left">
                    <AnimatedWrapper direction='right'>
                        <h4>Sitemap Generation</h4>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nobis aliquid veniam magni similique eligendi non hic ab, blanditiis id animi, quisquam fugiat molestias unde, veritatis reiciendis laboriosam cupiditate dolores nesciunt.</p>
                    </AnimatedWrapper>
                    </div>
                </div>
                <div className="howItWorksRows">
                    <div className="howIt-left">
                    <AnimatedWrapper direction='left'>
                        <h4>Post creation</h4>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nobis aliquid veniam magni similique eligendi non hic ab, blanditiis id animi, quisquam fugiat molestias unde, veritatis reiciendis laboriosam cupiditate dolores nesciunt.</p>
                    </AnimatedWrapper>
                    </div>
                    <AnimatedWrapper direction='right'>
                    <img src={BlogSvg} alt="AI rearch" />
                    </AnimatedWrapper>
                </div>
                <div class="custom-shape-divider-bottom-16899060321">
                        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                            <path d="M1200 120L0 16.48 0 0 1200 0 1200 120z" class="shape-fill"></path>
                        </svg>
                    </div>
            </div>
            <div className="launch-payments"
            >
                <PurchaseScreen tryDemo openDemo={openDemo}/>
            <div class="custom-shape-divider-bottom-1689915193">
                <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" class="shape-fill"></path>
            </svg>
            </div>
            <div className="launch-demo">
                </div>
            </div>
        </div>
    )
}

export default Launch;