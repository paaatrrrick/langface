if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
const express = require("express");
const FormData = require("form-data");
const fetch = require("node-fetch");
const User = require("../mongo/user");
const BlogDB = require("../mongo/blog");
const DemoBlog = require("../mongo/demoBlog");
const crypto = require('crypto');
const { Agent } = require("../classes/Agent");
const initSendData = require("../utils/sendData");
const jwt = require('jsonwebtoken');
const stripe = require('stripe')('sk_test_51NRJ0JBA5cR4seZqut5sOds81PKF0TLvnCCcBcuV9AdTwDVxtPaqsdctYdNX9vQalRshkaMlcBMjdMA1IIGXw53m00IpIuF1hP');
const bodyParser = require('body-parser');

const basicRoutes = express.Router();

const asyncMiddleware = fn => 
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const randomStringToHash24Bits = (inputString) => {
    return crypto.createHash('sha256').update(inputString).digest('hex').substring(0, 24);
}

const isLoggedInMiddleware = async (req, res, next) => {
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
        res.clearCookie("langface-token");
        res.status(401).json({error: "Not logged in"});
    }
}

// test whether backend is responding
basicRoutes.get("/data", asyncMiddleware((req, res) => {
    res.send("data");
}));


basicRoutes.post('/auth/google', asyncMiddleware(async (req, res) => {
    console.log('hit auth google');
    console.log(req.body);
    const { idToken, email, photoURL, name } = req.body;
    const uid = randomStringToHash24Bits(idToken);
    console.log(uid);
    const user = await User.loginOrSignUp(uid, { email, photoURL, name })
    const token = jwt.sign({ _id: uid, }, process.env.JWT_PRIVATE_KEY, { expiresIn: "1000d" });
    console.log(token);
    res.cookie("langface-token", token)
    res.json({ message: 'Login successful' });
})); 

basicRoutes.get("/user", isLoggedInMiddleware, asyncMiddleware(async (req, res) => {
    const blogIDs = req.user.blogs;
    const blogs = []
    for (let id of blogIDs) {
        const blog = await BlogDB.getBlog(id);
        if (blog){
            blog._id = blog._id.toString();
            blogs.push(blog);
        }
    }
    res.json({blogs: blogs, user: {photoURL: req.user.photoURL}});
}));

basicRoutes.post("/launchAgent", asyncMiddleware(async (req, res) => {
    var {openaiKey, blogID, subject, config, version, loops, daysLeft, userAuthToken, demo, blogMongoID } = req.body;
    const blogJwt = req.body.jwt;
    if (version !== "blogger") {
      version = "wordpress";
    }
    var userID;
    var blog;
    if (!demo) {
        const user = await User.getUserByID(jwt.verify(userAuthToken, process.env.JWT_PRIVATE_KEY));
        userID = user._id.toString();
        blog = await BlogDB.updateBlog(blogMongoID, {blogID, version, userID, version, openaiKey: openaiKey, blogJwt, subject, config, loops, daysLeft});
        if (blog.hasStarted) return res.status(400).json({error: "Blog has already started"});
        await User.addBlog(userID, blogMongoID);
        await BlogDB.deleteAllBlogPosts(blogMongoID);
    } else {
        blog = await DemoBlog.createBlog({version, blogID});
        blogMongoID = blog?._id?.toString();
    }
    const sendData = initSendData(blogMongoID, demo);
    const agent = new Agent(openaiKey, sendData, blogJwt, blogID, subject, config, version, loops, daysLeft - 1, blogMongoID, demo, userID);
    agent.run();
    blog._id = blogMongoID;
    return res.json(blog);
}));

basicRoutes.post("/wordpress", asyncMiddleware(async (req, res) => {
    const { code } = req.body;
    var formdata = new FormData();
    formdata.append("client_id", process.env.WORDPRESS_CLIENT_ID);
    formdata.append("redirect_uri", process.env.WORDPRESS_REDIRECT_URI);
    formdata.append("client_secret", process.env.WORDPRESS_CLIENT_SECRET);
    formdata.append("code", code);
    formdata.append("grant_type", "authorization_code");
    var requestOptions = { method: "POST", body: formdata, redirect: "follow"};
    const result = await fetch("https://public-api.wordpress.com/oauth2/token", requestOptions);
    if (!result.ok) {
        const error = await result.json();
        res.send(error).status(400);
    } else {
        const data = await result.json();
        res.send(data);
    }
}));

basicRoutes.post("/dailyrun", asyncMiddleware(async (req) => {
    console.log('daily run');
    console.log(req.body);
    if (req.body.password === process.env.dailyRunPassword) {
        const activeBlog = await BlogDB.getActive();
        console.log(activeBlog);
        for (let blog of activeBlog) {
            const {openaiKey, blogID, subject, config, version, loops, daysLeft, _id, userID } = blog;
            const blogMongoID = _id.toString();
            const blogJwt = blog.jwt;
            const sendData = initSendData(blogMongoID);
            const agent = new Agent(openaiKey, sendData, blogJwt, blogID, subject, config, version, loops, daysLeft, blogMongoID, false, userID);
            agent.run();
        }
    }
}));

basicRoutes.post('/create-checkout-session', isLoggedInMiddleware, asyncMiddleware(async (req, res) => {
    const userId = req.user._id.toString();
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: process.env.STRIPE_PRODUCT_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.WORDPRESS_REDIRECT_URI}/?success=true`,
      cancel_url: `${process.env.WORDPRESS_REDIRECT_URI}/?canceled=true`,
      metadata: {userId}
    });
    res.json({url: session.url});
}));

basicRoutes.post('/webhook', bodyParser.raw({type: 'application/json'}), asyncMiddleware(async (request, response) => {
    const payload = request.body;
    const sig = request.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event.type === 'checkout.session.completed') {
        const userId = event.data?.object?.metadata?.userId;
        const validatedUserID = await User.getUserByID(userId);
        if (!validatedUserID) {
            console.log('shucks we need to refund: ' + event.data.object.id);
            return 
        }
        const blog = await BlogDB.createEmptyBlog(userId, event.data.object.id);
        await User.addBlog(userId, blog._id.toString());
    }

    response.status(200).json({received: true});
}));

//basic route to check if there is a new blog on user which has not been started
basicRoutes.get('/checkForNewBlog', isLoggedInMiddleware, asyncMiddleware(async(req, res) => {
    const user = await User.getUserByID(req.user._id);
    for (const blogID of user.blogs) {
        const blogObj = await BlogDB.getBlog(blogID);
        if (blogObj.newlyCreated) {
            await BlogDB.removeNewlyCreated(blogID);
            return res.json(blogObj);
        }
    }
    return res.json({});
}));

basicRoutes.use((err, req, res, next) => {
    console.log(err); // Log the stack trace of the error
    res.status(500).json({ error: `Oops, we had an error ${err.message}` });
});

module.exports = basicRoutes;