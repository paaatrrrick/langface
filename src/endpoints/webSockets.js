if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
  const { Agent } = require("../classes/Agent");
  const User = require("../mongo/user");
  const BlogDB = require("../mongo/blog");
  const cookie = require("cookie");
  const jwt = require('jsonwebtoken');



  const webSocket = (socket) => {
    console.log("New client connected");
    socket.on("addData", (newData) => {

      // const cookies = cookie.parse(socket.handshake.headers.cookie);
      // console.log(socket.handshake.headers);
      try {
        if (newData.version !== "blogger") {
          newData.version = "wordpress";
        }

        if (newData.userAuthToken) {
          const decoded = jwt.verify(newData.userAuthToken, process.env.JWT_PRIVATE_KEY);
          var uid = decoded._id;
        }

        var agent = new Agent(
          uid,
          newData.openAIKey,
          socket,
          newData.jwt,
          newData.id,
          newData.blogSubject,
          newData.content,
          newData.version,
          newData.loops,
          newData.daysLeft
        );
        agent.run();
      } catch (e) {
        agent.sendData({
          type: "ending",
          content: e.message,
        });
      }
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
};

module.exports = webSocket;