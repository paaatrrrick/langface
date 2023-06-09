import React from "react";
import "./purchaseScreen.css";
import {useDispatch} from "react-redux";
import {actions} from "../../store";
import {createCheckoutSession} from '../../utils/getJwt';
import constants from '../../constants';


const PurchaseScreen = () => {
    const dispatch = useDispatch();
    const payment = async () => {
        const res = await createCheckoutSession();
        if (! res) {
            dispatch(actions.setBannerMessage({message: "Payment failed. Reach out in the discord if you have any questions", type: "error"}));
        } else {
            dispatch(actions.setBannerMessage({message: "Payment succeeded. ", type: "success", timeout: 5000}));
            dispatch(actions.addBlogAgent(res))
            dispatch(actions.setCurrentView("home"));
        }
    }

    return (<div className="PurchaseScreen">
        <div className="w-100 column align-center justify-center">
            <h1>Supercharge your web traffic</h1>
            <h6 style={
                {
                    marginTop: '10px',
                    fontSize: '14px'
                }
            }>Hire an AI Agent that works 24/7, to bring traffic to your site by writing optimized articles.</h6>
        </div>
        <div className="row w-100 align-center justify-center"
            style={
                {marginTop: '60px'}
        }>
            <div className="PurchaseScreen-mostPopular">
                Recommended
            </div>
        </div>
        <div className="row PurchaseScreen-card-holder align-center justify-center">
            <div className="PurchaseScreen-card">
                <div className="column w-100 align-start justify-start">
                    <h3 style={
                        {
                            fontSize: '18px',
                            fontWeight: '700'
                        }
                    }>Hobbiest</h3>
                    <p style={
                            {fontSize: '14px'}
                        }
                        className="PurchaseScreen-list-black">Quickly generate articles</p>
                    <div className="PurchaseScreen-list">
                        <div className="PurchaseScreen-list-item">
                            <p><span className="green">&#10003;</span> 3 Articles / Day</p>
                            <p><span className="green">&#10003;</span> Post directly to Wordpress</p>
                            <p><span className="green">&#10003;</span> AI Photos</p>
                        </div>
                    </div>
                </div>
                <div className="column w-100 align-start justify-start">
                    <h3 style={
                        {
                            fontSize: '18px',
                            fontWeight: '700'
                        }
                    }>Free</h3>
                    <div className="row w-100 align-center justify-center"
                        style={
                            {
                                marginTop: '20px',
                                height: '30px'
                            }
                    }>
                        <h4 style={
                            {
                                fontSize: '14px',
                                fontWeight: '600'
                            }
                        }>Your current agent</h4>
                    </div>
                </div>
            </div>
            <div className="PurchaseScreen-card">
                <div className="column w-100 align-start justify-start">
                    <h3 style={
                        {
                            fontSize: '18px',
                            fontWeight: '700'
                        }
                    }>Professional</h3>
                    <p style={
                            {fontSize: '14px'}
                        }
                        className="PurchaseScreen-list-black">Scale your business's traffic</p>
                    <div className="PurchaseScreen-list">
                        <div className="PurchaseScreen-list-item">
                            <p><span className="green">&#10003;</span> 450 Articles / Month</p>
                            <p><span className="green">&#10003;</span> Run for weeks on end</p>
                            <p><span className="green">&#10003;</span> SEO sitemaps that link posts</p>
                            <p><span className="green">&#10003;</span> Keyword research</p>
                            <p><span className="green">&#10003;</span> Everything in Hobbiest</p>
                        </div>
                    </div>
                </div>
                <div className="column w-100 align-start justify-start">
                    <h3 style={
                            {
                                fontSize: '18px',
                                fontWeight: '700'
                            }
                        }
                        className="row align-center">$30<p style={
                            {marginLeft: '3px'}
                        }>/</p>
                        <p style={
                            {marginLeft: '3px'}
                        }>month</p>
                    </h3>
                    <div className="row w-100 align-center justify-center"
                        style={
                            {
                                marginTop: '20px',
                                height: '30px'
                            }
                    }>
                        <button onClick={payment}>Hire</button>
                    </div>
                </div>
            </div>
            <div className="PurchaseScreen-card">
                <div className="column w-100 align-start justify-start">
                    <h3 style={
                        {
                            fontSize: '18px',
                            fontWeight: '700'
                        }
                    }>Enterprise</h3>
                    <p style={
                            {fontSize: '14px'}
                        }
                        className="PurchaseScreen-list-black">Blanket a whole niche</p>
                    <div className="PurchaseScreen-list">
                        <div className="PurchaseScreen-list-item">
                            <p><span className="green">&#10003;</span> Pay on per Article basis</p>
                            <p><span className="green">&#10003;</span> Tailored workflow for your business</p>
                            <p><span className="green">&#10003;</span> 1-1 customer support</p>
                            <p><span className="green">&#10003;</span> Everything in Professional</p>
                        </div>
                    </div>
                </div>
                <div className="column w-100 align-start justify-start">
                    <h3 style={
                        {
                            fontSize: '18px',
                            fontWeight: '700'
                        }
                    }>Let's Talk</h3>
                    <div className="row w-100 align-center justify-center"
                        style={
                            {
                                marginTop: '20px',
                                height: '30px'
                            }
                    }>
                        <button id='PurchaseScreen-button-contact'
                            onClick={
                                () => {
                                    window.open(constants.discordUrl, '_blank');
                                }
                        }>Contact</button>
                    </div>
                </div>
            </div>
        </div>
    </div>);
};

export default PurchaseScreen;
