import React, { useState, useEffect } from 'react';
import './auth.css'
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

const Auth = () => {
    const version = useSelector((state) => state.main.version);
    const dispatch = useDispatch();

    const handleGoogle = async () => {
        console.log('clicked');
        const result = await signInWithPopup(auth, provider)
        console.log(result);
        const res = await fetch(`${constants.url}/auth/google`, {
            method: 'POST',
            body: JSON.stringify({ idToken: result.user.uid, email: result.user.email, photoURL: result.user.photoURL, name: result.user.displayName }),
            headers: { 'Content-Type': 'application/json' }
        })
        const data = await res.json();
        console.log(data);
        console.log(document.cookie);
    };
    //log all cookies in the document        

    return (
        <div className="Auth">
                <button className="login-with-google-btn" onClick={handleGoogle}>
                    Login with Google
                </button>
            <div className="custom-shape-divider-bottom-1674142871">
                <svg id='authSvg' data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="shape-fill"></path>
                    <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="shape-fill"></path>
                    <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="shape-fill"></path>
                </svg>
            </div>
        </div>
    );
}

//{error && <p>{error.message}</p>}
export default Auth;