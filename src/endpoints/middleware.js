const jwt = require('jsonwebtoken');
const User = require("../mongo/user");

const isLoggedInMiddleware = async (req, res, next) => {
    const token = req.headers["x-access'langface-auth-token"];
    console.log(token);
    if (!token) {
        res.status(401).json({error: "Not logged in"});
        return;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
        const user = await User.login(decoded._id);
        if (!user) {
            res.status(401).json({error: "Not logged in"});
            return;
        }
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({error: "Not logged in"});
    }
}

const asyncMiddleware = fn => 
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { isLoggedInMiddleware, asyncMiddleware };