if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
const express = require("express");
const FormData = require("form-data");
const User = require("../mongo/user");
const Blog = require("../mongo/blog");
const {OAuth2Client} = require('google-auth-library');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');


const basicRoutes = express.Router();



const randomStringToHash24Bits = (inputString) => {
    return crypto.createHash('sha256').update(inputString).digest('hex').substring(0, 24);
}

const isLoggedInMiddleware = async (req, res, next) => {
    console.log('at the middleware');
    const token = req.cookies["langface-token"];
    if (!token) {
        res.status(401).json({error: "Not logged in"});
        return;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
        const user = await User.login(decoded._id);
        if (!user) {
            res.clearCookie("langface-token");
            res.status(401).json({error: "Not logged in"});
            return;
        }
        req.user = user;
        next();
    } catch (err) {
        console.log(err);
        res.clearCookie("langface-token");
        res.status(401).json({error: "Not logged in"});
    }
}

// test whether backend is responding
basicRoutes.get("/data", (req, res) => {
    res.send("data");
});


basicRoutes.post('/auth/google', async (req, res) => {
    console.log('we have been hit');
    const { idToken, email, photoURL, name } = req.body;
    console.log(req.body);
    const uid = randomStringToHash24Bits(idToken);
    console.log(uid);
    const user = await User.login(uid, { email, photoURL, name })
    console.log(user);
    const token = jwt.sign({ _id: uid, }, process.env.JWT_PRIVATE_KEY, { expiresIn: "1000d" });
    console.log(token);
    res.cookie("langface-token", token)
    res.json({ message: 'Login successful' });
});

basicRoutes.get("/user", isLoggedInMiddleware, async (req, res) => {
    const blogIDs = req.user.blogs;
    const blogs = []
    for (let id of blogIDs) {
        const blog = await Blog.getByMongoID(id);
        if (blog){
            blogs.push(blog);
        }
    }
    res.json({blogs: blogs});
});
  
// basicRoutes.post("/google", async (req, res) => {
//     console.log('bod');
//     console.log(req.body);
//     const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
//     async function verify() {
//         const ticket = await client.verifyIdToken({
//             idToken: req.body.credentialResponse.credential,
//             audience: process.env.GOOGLE_CLIENT_ID,  
//             // Specify the CLIENT_ID of the app that accesses the backend
//             // Or, if multiple clients access the backend:
//             //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
//         });
//         const payload = ticket.getPayload();
//         console.log(payload);
//         const userid = payload['sub'];
//         if (!userid){
//         throw new Error("Could not verify Google token");
//         }
//         User.createNewUser(userid);
//         res.cookie('user-cookie', req.body.credentialResponse.credential);
//         res.json({status: 'ok'});
//     }verify().catch(() => {
//         console.log('error');
//         res.send("error").status(400)
//     });
// })

// get full WP API token using temporary code
basicRoutes.post("/wordpress", async (req, res) => {
    const { code } = req.body;
    var formdata = new FormData();
    formdata.append("client_id", process.env.WORDPRESS_CLIENT_ID);
    formdata.append("redirect_uri", process.env.WORDPRESS_REDIRECT_URI);
    formdata.append("client_secret", process.env.WORDPRESS_CLIENT_SECRET);
    formdata.append("code", code);
    formdata.append("grant_type", "authorization_code");
    var requestOptions = {
        method: "POST",
        body: formdata,
        redirect: "follow",
    };
    const result = await fetch(
        "https://public-api.wordpress.com/oauth2/token",
        requestOptions
    );
    if (!result.ok) {
        const error = await result.json();
        res.send(error).status(400);
    } else {
        const data = await result.json();
        console.log(data);
        res.send(data);
    }
});

module.exports = basicRoutes;