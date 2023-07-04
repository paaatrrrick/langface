if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
  const { Agent } = require("../classes/Agent");
  const User = require("../mongo/user");
  const BlogDB = require("../mongo/blog");
  const cookie = require("cookie");
  const jwt = require('jsonwebtoken');
  const io = require("../app");

  var SuccesfulPostsCount = 0


  blogIdToSocket = {};






const webSocket = (io) => {
    function sendDataToClient(dataForClient) {
      try{
        const blogId = dataForClient.blogId;
        console.log('sending data');
        console.log(blogId);
        if (dataForClient.type !== "updating"){
          SuccesfulPostsCount += 1;
          console.log(`sending data to client: ${SuccesfulPostsCount}:`);
          console.log(dataForClient);
        }
        io.to(blogId).emit('updateData', dataForClient);
      } catch(e) {
        console.log('sending data error')
        console.log(e);
      }
    }

    io.on("connection", (socket) => {
      console.log("New client connected");
      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
      socket.on("addData", async (newData) => {
        try {
          var {openAIKey, blogID, subject, config, version, loops, daysLeft, userAuthToken} = newData;
          console.log(newData);
          socket.join(blogID);
          if (version !== "blogger") {
            version = "wordpress";
          }
          var user = null;
          var uid = null;
          if (userAuthToken) {
            const decoded = jwt.verify(userAuthToken, process.env.JWT_PRIVATE_KEY);
            var uid = decoded._id;
            console.log(uid);
          }
          const sendData = (dataForClient) => {
            console.log('send date wrapper has been called');
            console.log(dataForClient);
            dataForClient.blogId = blogID;
            sendDataToClient(dataForClient);
          }
  
          const agent = new Agent(
            openAIKey,
            sendData,
            newData.jwt,
            blogID,
            subject,
            config,
            version,
            loops,
            daysLeft - 1,
            uid,
        );
        agent.run();
        } catch (e) {
          console.log('bottom error');
          console.log(e);
          if (newData.blogID){
            sendData({
              blogId: newData.blogID,
              type: "ending",
              content: e.message,
            });
          }
        }
      });
    });
};

module.exports = webSocket;