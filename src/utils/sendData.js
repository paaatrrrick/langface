const { sendDataToClient, blogIdToSocket } = require("../endpoints/webSockets");
const BlogDB = require("../mongo/blog");
const DemoBlog = require("../mongo/demoBlog");


const initSendData = (blogMongoID, demo = false) => {
    const sendData = async (dataForClient) => {
      console.log('hit send data');
      console.log(dataForClient);
        dataForClient.hasStarted = true;
        if (dataForClient.type === "ending") {
          dataForClient.hasStarted = false;
          if (!demo) {
            BlogDB.setHasStarted(blogMongoID, false);
            BlogDB.subtractDaysLeft(blogMongoID);
          }
        }
    
        if (dataForClient.type !== "updating") {
          const currAgent = demo ? DemoBlog : BlogDB;
          const postsLeft = await currAgent.addPost(blogMongoID, { url: dataForClient?.url || "", config: dataForClient?.config || "", title: dataForClient?.title || "", type: dataForClient?.type || "error" });
          dataForClient = { ...dataForClient, ...postsLeft };
        }
        dataForClient.blogId = blogMongoID;
        sendDataToClient(dataForClient, blogIdToSocket);
    }
    return sendData;
}

module.exports = initSendData;