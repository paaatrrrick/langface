import React, { useEffect, userRef } from 'react';
import HeroOne from './components/heroOne';
import './launch.css';
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
            name: 'French Press Coffee',
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
            <h3 className='absolute top-3 right-5 text-2xl font-semibold italic text-mainDark z-50'>Langface</h3>
            <HeroOne demoClick={openDemo}/>
            <div className="custom-shape-divider-bottom-1689906032">
                        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                            <path d="M1200 120L0 16.48 0 0 1200 0 1200 120z" className="shape-fill"></path>
                        </svg>
            </div>
            <div className="howItWorks">
                <AnimatedWrapper><h2 style={{color: "#212121"}} className='pt-4'>How Langface writes articles that rank you the 1st page</h2></AnimatedWrapper>
                <div className="howItWorksRows">
                    <div className="howIt-left">
                    <AnimatedWrapper direction='left'>
                        <h4 className='text-3xl font-semibold mb-4'>Niche Research</h4>
                        <p>Unlock the power of your business's specific market through our unique research process. We meticulously dig out valuable long-tail keywords, revealing untapped opportunities and guiding your strategic focus.</p>
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
                        <h4 className='text-3xl font-semibold mb-4'>Sitemap Generation</h4>
                        <p>Experience seamless navigation and better SEO with our intuitive sitemap design. We craft a linked architecture for your blog posts, making your website more user-friendly and information-rich.</p>
                    </AnimatedWrapper>
                    </div>
                </div>
                <div className="howItWorksRows">
                    <div className="howIt-left">
                    <AnimatedWrapper direction='left'>
                        <h4 className='text-3xl font-semibold mb-4'>Post creation</h4>
                        <p>We handle your blog posts with care, incorporating elements like headers, tables, and images for a reader-friendly experience. They're then directly posted to your blog, giving you more time to focus on growing your business. </p></AnimatedWrapper>
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

            <div className="launch-payments">
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