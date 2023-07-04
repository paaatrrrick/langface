import React, { useState, useEffect } from 'react';
import './auth.css'
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// import constants from '../../constants';
import { initializeApp } from "firebase/app";
import { useDispatch, useSelector } from 'react-redux';
import { setBannerMessage, signOut } from "../../store";
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

const Auth = ({ launch }) => {
    const { isLoggedIn, user, } = useSelector((state) => state.main);
    console.log('at auth');
    console.log(isLoggedIn);
    console.log(user);
    const dispatch = useDispatch();

    const handleGoogle = async () => {
        var result = null;
        try {
            result = await signInWithPopup(auth, provider)
        } catch (err) {
            dispatch(setBannerMessage("Error logging in with google"));
            return;
        }
        const res = await fetch(`${constants.url}/auth/google`, {
            credentials: "include",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ idToken: result.user.uid, email: result.user.email, photoURL: result.user.photoURL, name: result.user.displayName }),
        });
        if (!res.ok) {
            dispatch(setBannerMessage("Error logging in with google"));
            return;
        }
        console.log('successfuly logged in');
        const data = await res.json();
        launch();
    };

    const signOutClicked = async () => {
        console.log('clicked sign out');
        // document.cookie = constants.authCookieName + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        dispatch(signOut());
    };

    if (isLoggedIn) {
        return (
            <div className="Auth-loggedIn" onClick={signOutClicked} >
                {(user.photoURL) && <img src={user?.photoURL} alt="profile" />}
                Sign out
            </div>
        );
    }
    return (
        <div className="Auth">
            <button className="login-with-google-btn" onClick={handleGoogle}>
                Login with Google
            </button>

        </div>
    );
}

//{error && <p>{error.message}</p>}
export default Auth;