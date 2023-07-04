if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
  const { Agent } = require("../classes/Agent");
  const User = require("../mongo/user");
  const cookie = require("cookie");
  const jwt = require('jsonwebtoken');



  const webSocket = (socket) => {
    console.log("New client connected");
    socket.on("addData", (newData) => {
      // const cookies = cookie.parse(socket.handshake.headers.cookie);
      console.log(socket.handshake.headers);
      const sendData = async (dataForClient) => {
        if (dataForClient.type !== "updating"){
          SuccesfulPostsCount += 1;
          console.log(`sending data to client: ${SuccesfulPostsCount}:`);
          console.log(dataForClient);
        }
        socket.emit("updateData", dataForClient); // sends data only to the connected socket
      };
      try {
        if (newData.version !== "blogger") {
          newData.version = "wordpress";
        }
        const decoded = jwt.verify(newData.userAuthToken, process.env.JWT_PRIVATE_KEY);
        const uid = decoded._id;
        const agent = new Agent(
          uid,
          newData.jwt,
          newData.id,
          newData.content,
          newData.loops,
          newData.openAIKey,
          newData.version,
          newData.blogSubject,
          sendData
        );
        agent.run();
      } catch (e) {
        sendData({
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