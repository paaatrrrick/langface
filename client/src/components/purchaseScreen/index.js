import React from "react";
import "./purchaseScreen.css";
import {actions} from "../../store";
import {createCheckoutSession} from '../../utils/getJwt';
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { useDispatch, useSelector } from 'react-redux';
import { setBannerMessage } from "../../store";
import constants from "../../constants";

const firebaseConfig = {
    apiKey: "AIzaSyBdOHXmq235jFOtiAg7KtnXE6zriN8r6xU",
    authDomain: "bloggergpt-154c3.firebaseapp.com",
    projectId: "bloggergpt-154c3",
    storageBucket: "bloggergpt-154c3.appspot.com",
    messagingSenderId: "556522585513",
    appId: "1:556522585513:web:8a525a15f80d0a680898b8",
    measurementId: "G-FW09N6MY24"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();


const PurchaseScreen = ({ tryDemo, openDemo, launch }) => {
    const { isLoggedIn } = useSelector((state) => state.main.isLoggedIn);
    const dispatch = useDispatch();

    const handleGoogle = async () => {
        var result = null;
        try {
            result = await signInWithPopup(auth, provider);
        } catch (err) {
            console.log(err);
            dispatch(setBannerMessage({type: "error", message: "Error logging in with google"}));
            return false;
        }
        const res = await fetch(`${constants.url}/auth/google`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ idToken: result.user.uid, email: result.user.email, photoURL: result.user.photoURL, name: result.user.displayName }),
        });
        const data = await res.json();
        if (!res.ok) {
            dispatch(setBannerMessage({type: "error", message: "Error logging in with google"}));
            return false;
        }
        window.localStorage.setItem("langface-auth", data.token);
        launch();
        return true;
    };
    const payment = async () => {
        if (!isLoggedIn) {
            const google = await handleGoogle();
            if (!google) return;
        }
        const res = await createCheckoutSession();
        if (!res) {
            dispatch(actions.setBannerMessage({message: "Payment failed. Reach out in the discord if you have any questions", type: "error"}));
        } else {
            dispatch(actions.setBannerMessage({message: "Payment succeeded. ", type: "success", timeout: 25000}));
            dispatch(actions.addBlogAgent(res))
            dispatch(actions.setCurrentView("home"));
        }
    }

    return (<div className="PurchaseScreen">
        <div className="w-100 column align-center justify-center shrinkwidth">
            <h1 className="text-4xl mb-2 font-semibold">Supercharge your web traffic</h1>
            <h6 style={
                {
                    marginTop: '10px',
                    fontSize: '14px'
                }
            }>Hire an AI agent that works autonomously to grow your blog</h6>
        </div>
        {tryDemo && <button className='launch-purpleButton' onClick={openDemo}>Try the out the demo</button>}
        <div className="row w-100 align-center justify-center"
            style={
                {marginTop: '60px'}
        }>
            <div className="PurchaseScreen-mostPopular">
                Recommended
            </div>
        </div>
        <div className="PurchaseScreen-card-holder">
            <div className="PurchaseScreen-card">
                <div className="column w-100 align-start justify-start">
                    <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Hobbyist</h3>
                    <p style={
                            {fontSize: '14px'}
                        }
                        className="PurchaseScreen-list-black">Quickly generate articles</p>
                    <div className="PurchaseScreen-list">
                        <div className="PurchaseScreen-list-item">
                            <p><span className="text-brandColor text-xl">&#10003;</span> 3 Articles / Day</p>
                            <p><span className="text-brandColor text-xl">&#10003;</span> Keyword generation </p>
                            <p><span className="text-brandColor text-xl">&#10003;</span> Images</p>
                            <p><span className="text-brandColor text-xl">&#10003;</span> Post directly to Wordpress</p>
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
                            <p><span className="text-brandColor text-xl">&#10003;</span> 450 Articles / Month</p>
                            <p><span className="text-brandColor text-xl">&#10003;</span> Internal linking </p>
                            <p><span className="text-brandColor text-xl">&#10003;</span> Autonomous daily execution </p>
                            <p><span className="text-brandColor text-xl">&#10003;</span> Everything in Hobbyist</p>
                            <p><span className="text-brandColor text-xl">&#10003;</span> Coming soon: keyword research</p>
                            {/* <p><span className="text-brandColor text-xl">&#10003;</span> Coming soon: continuous, 24/7, execution</p> */}
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
                            <p><span className="text-brandColor text-xl">&#10003;</span> Pay on per Article basis</p>
                            <p><span className="text-brandColor text-xl">&#10003;</span> Tailored workflow for your business</p>
                            <p><span className="text-brandColor text-xl">&#10003;</span> 1-1 customer support</p>
                            <p><span className="text-brandColor text-xl">&#10003;</span> Everything in Professional</p>
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
                                    const recipient = "patrick@langface.ai"
                                    const subject = encodeURIComponent("Hello 👋");
                                    const body = encodeURIComponent(
                                      "Hey Patrick,\n\nI'd love to hear more about SEO with langface.ai. What's your availability this week?"
                                    );
                                    const mailtoLink = `mailto:${recipient}?subject=${subject}&body=${body}`;
                                    window.open(mailtoLink, "_blank");
                                }
                        }>Contact</button>
                    </div>
                </div>
            </div>
        </div>
    </div>);
};

export default PurchaseScreen;
