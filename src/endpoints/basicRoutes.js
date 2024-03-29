if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
const express = require("express");
const FormData = require("form-data");
const fetch = require("node-fetch");
const User = require("../mongo/user");
const AgentDB = require("../mongo/agent");
const DemoAgent = require("../mongo/demoAgent");
const { Agent } = require("../classes/Agent");
const { isLoggedInMiddleware, asyncMiddleware } = require("./middleware");
const initSendData = require("../utils/sendData");
const { randomStringToHash24Bits } = require("../utils/helpers");
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const bodyParser = require('body-parser');

const basicRoutes = express.Router();

// test whether backend is responding
basicRoutes.get("/data", asyncMiddleware((req, res) => {
    res.send("data");
}));

basicRoutes.post('/auth/google', asyncMiddleware(async (req, res) => {
    const { idToken, email, photoURL, name } = req.body;
    const uid = randomStringToHash24Bits(idToken);
    await User.loginOrSignUp(uid, { email, photoURL, name })
    const token = jwt.sign({ _id: uid, }, process.env.JWT_PRIVATE_KEY, { expiresIn: "1000d" });
    res.json({token});
})); 

basicRoutes.get("/user", isLoggedInMiddleware, asyncMiddleware(async (req, res) => {
    const blogIDs = req.user.blogs;
    const blogs = []
    for (let id of blogIDs) {
        const blog = await AgentDB.getBlog(id);
        if (blog){
            blog._id = blog._id.toString();
            blogs.push(blog);
        }
    }
    res.json({blogs: blogs, user: {photoURL: req.user.photoURL}});
}));

basicRoutes.post("/launchAgent", asyncMiddleware(async (req, res) => {
    // get agent data
    var {blogID, businessData, version, loops, daysLeft, userAuthToken, demo, blogMongoID, draft = false, includeAIImages} = req.body;
    const blogJwt = req.body.jwt;
    if (version !== "blogger" && version !== "wordpress") {
      version = "html";
    }
    var userID;
    var blog;
    var totalPostsToMake;
    // update agent data if it exists
    if (!demo) {
        const user = await User.getUserByID(jwt.verify(userAuthToken, process.env.JWT_PRIVATE_KEY));
        userID = user._id.toString();
        blog = await AgentDB.updateBlog(blogMongoID, {blogID, version, userID, blogJwt, businessData, loops, daysLeft, includeAIImages});
        totalPostsToMake = blog.totalPostsToMake;
        if (blog.hasStarted) return res.status(400).json({error: "Blog has already started"});
        await User.addBlog(userID, blogMongoID);
        blog = await AgentDB.deleteAllMessages(blogMongoID);
    } else {
        const ip = req.ip || req.connection.remoteAddress;
        totalPostsToMake = loops;
        blog = await DemoAgent.createBlog({ip});
        blogMongoID = blog?._id?.toString();
    }
    // use new agent data to run
    const sendData = initSendData(blogMongoID, demo);
    const agent = new Agent(sendData, blogJwt, blogID, businessData, version, loops, daysLeft, blogMongoID, demo, userID, draft, blog.nextPostIndex, blog.BFSOrderedArrayOfPostMongoID, includeAIImages, totalPostsToMake);
    agent.run();
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

// basicRoutes.post("/dailyrun", asyncMiddleware(async (req, res) => {
//     if (req.body.password === process.env.dailyRunPassword) {
//         const activeBlogs = await AgentDB.getActive();
//         for (let blog of activeBlogs) {
//             const {blogID, businessData, version, loops, daysLeft, _id, userID, nextPostIndex, BFSOrderedArrayOfPostMongoID,  } = blog;
//             const blogMongoID = _id.toString();
//             const blogJwt = blog.jwt;
//             const sendData = initSendData(blogMongoID);
//             const agent = new Agent(sendData, blogJwt, blogID, businessData, version, loops, daysLeft, blogMongoID, false, userID, false, nextPostIndex, BFSOrderedArrayOfPostMongoID);
//             agent.run();
//         }
//     }
//     return res.send("done");
// }));

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
      allow_promotion_codes: true,
      metadata: {userId},
      client_reference_id: req.headers['referral-id'] || "checkout-#{SecureRandom.uuid}"
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
        console.log(err);
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event.type === 'checkout.session.completed') {
        console.log("PURCHASE!!!!!");
        const userId = event.data?.object?.metadata?.userId;
        console.log(userId);
        const validatedUserID = await User.getUserByID(userId);
        if (!validatedUserID) {
            console.log('shucks we need to refund: ' + event.data.object.id);
            return 
        }
        const blog = await AgentDB.createEmptyBlog(userId, event.data.object.id);
        await User.addBlog(userId, blog._id.toString());
    }

    response.status(200).json({received: true});
}));

//basic route to check if there is a new blog on user which has not been started
basicRoutes.get('/checkForNewBlog', isLoggedInMiddleware, asyncMiddleware(async(req, res) => {
    const user = await User.getUserByID(req.user._id);
    for (const blogID of user.blogs) {
        const blogObj = await AgentDB.getBlog(blogID);
        if (blogObj.newlyCreated) {
            await AgentDB.removeNewlyCreated(blogID);
            return res.json(blogObj);
        }
    }
    return res.json({});
}));

basicRoutes.post('/configureBlog', isLoggedInMiddleware, asyncMiddleware(async(req, res) => {
    const { id } = req.body;
    const post = await AgentDB.changeBlog(id, {hasStarted: false, newlyCreated: false, BFSOrderedArrayOfPostMongoID: [], daysLeft: 0});
    return res.json(post);
}));

basicRoutes.post('/runNextDay', isLoggedInMiddleware, asyncMiddleware(async(req, res) => {
    const { id } = req.body;
    const blog = await AgentDB.getBlog(id);
    const {blogID, businessData, version, loops, daysLeft, _id, userID, nextPostIndex, BFSOrderedArrayOfPostMongoID, totalPostsToMake, includeAIImages } = blog;
    const blogMongoID = _id.toString();
    const blogJwt = blog.jwt;
    const sendData = initSendData(blogMongoID);
    const agent = new Agent(sendData, blogJwt, blogID, businessData, version, loops, daysLeft, blogMongoID, false, userID, false, nextPostIndex, BFSOrderedArrayOfPostMongoID, includeAIImages, totalPostsToMake);
    agent.run();
    return res.json(blog);
}));

basicRoutes.post('/updateBusinessData', isLoggedInMiddleware, asyncMiddleware(async(req, res) => {
    const { blogID, businessData } = req.body; 
    const blog = await AgentDB.updateBusinessData(blogID, businessData);
    return res.status(200).json(blog);
}));

basicRoutes.use((err, req, res, next) => {
    console.log(err); // Log the stack trace of the error
    res.status(500).json({ error: `Oops, we had an error ${err.message}` });
});

module.exports = basicRoutes;