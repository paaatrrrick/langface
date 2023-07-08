if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
const express = require("express");
const FormData = require("form-data");
const User = require("../mongo/user");
const fetch = require("node-fetch");
const BlogDB = require("../mongo/blog");
const crypto = require('crypto');
const { Agent } = require("../classes/Agent");
const jwt = require('jsonwebtoken');
const { sendDataToClient, blogIdToSocket } = require("./webSockets");
const stripe = require('stripe')('sk_test_51NRJ0JBA5cR4seZqut5sOds81PKF0TLvnCCcBcuV9AdTwDVxtPaqsdctYdNX9vQalRshkaMlcBMjdMA1IIGXw53m00IpIuF1hP');
const bodyParser = require('body-parser');
const endpointSecret = 'whsec_1d8104297244891d4410191284d52f9f430c66d55a6e7f4a9d065fc0035f1609';


const basicRoutes = express.Router();


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
basicRoutes.get("/data", (req, res) => {
    res.send("data");
});


basicRoutes.post('/auth/google', async (req, res) => {
    const { idToken, email, photoURL, name } = req.body;
    const uid = randomStringToHash24Bits(idToken);
    const user = await User.login(uid, { email, photoURL, name })
    const token = jwt.sign({ _id: uid, }, process.env.JWT_PRIVATE_KEY, { expiresIn: "1000d" });
    res.cookie("langface-token", token)
    res.json({ message: 'Login successful' });
});

basicRoutes.get("/user", isLoggedInMiddleware, async (req, res) => {
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
});

basicRoutes.post("/launchAgent", async (req, res) => {
    console.log(req.body);
    var {openAIKey, blogID, subject, config, version, loops, daysToRun, userAuthToken } = req.body;
    const blogJwt = req.body.jwt;
    if (version !== "blogger") {
      version = "wordpress";
    }
  
    var user = null;
    if (userAuthToken) {
      user = await User.getUserByID(jwt.verify(userAuthToken, process.env.JWT_PRIVATE_KEY));
    }
    const userID = user ? user._id.toString() : null;
  
    //this creates a blog or updates an old blog
    const blog = await BlogDB.createBlog({blogID, version, userID, version, openaiKey: openAIKey, blogJwt, subject, config, loops, daysToRun});
    const blogMongoID = blog?._id?.toString();

    await BlogDB.deleteAllBlogPosts(blogMongoID);

    if (blog.userID && blog.userID !== userID) {
      return res.status(400).json({error: "This blog is already connected to another account. Reach out on discord to change this."});
    } else if (user && blog.userID !== userID && !user.blogs?.includes(blogMongoID)) {
        blog = await BlogDB.setUserId(blogMongoID, userID);
        user = await User.addBlog(userID, blogMongoID);
    }
    const sendData = async (dataForClient) => {
      console.log('sending data 1')
      if (dataForClient.type === "ending") {
        BlogDB.setHasStarted(blogMongoID, false);   
      }
      if (dataForClient.type !== "updating") {
        await BlogDB.addPost(blogMongoID, { url: dataForClient?.url || "", content: dataForClient?.content || "", title: dataForClient?.title || "", type: dataForClient?.type });
      } 
      dataForClient.blogId = blogMongoID;
      sendDataToClient(dataForClient, blogIdToSocket);
    }
    const agent = new Agent(openAIKey, sendData, blogJwt, blogID, subject, config, version, loops, daysToRun - 1, blogMongoID, user?._id);
    await BlogDB.setHasStarted(blogMongoID, true);
    console.log('about to run the agent');
    agent.run();
    console.log('ran the agent');
    return res.json(JSON.stringify(blog));
});

basicRoutes.post("/wordpress", async (req, res) => {
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
});

basicRoutes.post("/dailyrun", async (req, res) => {
    if (req.body === 'dailyrunpassword') {
        const activeBlog = await BlogDB.getActive();
        activeBlog.foreach(blog => {
            const agent = new Agent(
                blog.uid,
                blog.openAIKey,
                socket,
                blog.jwt,
                blog.blogID,
                blog.subject,
                blog.config,
                blog.version,
                blog.loops,
                blog.daysLeft - 1
            );
            agent.run();
        });
    }
});

basicRoutes.post('/create-checkout-session', async (req, res) => {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: 'price_1NRNozBA5cR4seZqGGQRAxcc',
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `http://localhost:3000/?success=true`,
      cancel_url: `http://localhost:3000/?canceled=true`,
    });
    res.redirect(303, session.url);
});

basicRoutes.post('/webhook', bodyParser.raw({type: 'application/json'}), (request, response) => {
    const payload = request.body;
    const sig = request.headers['stripe-signature'];
    let event;
    console.log('hitting');
    try {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err) {
        console.log(err.message);
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event.type === 'customer.subscription.created') {
        console.log(event.data.object.id); // subscription ID -- used to query and manage subscriptions on stripe
        // if authenticated, add subscription ID to user in mongodb and say the user has an active subscription.
        // and we can check before each agent run if it is still active
    }

    response.status(200).end();
});

module.exports = basicRoutes;