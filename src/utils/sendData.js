const { sendDataToClient, blogIdToSocket } = require("../endpoints/webSockets");
const AgentDB = require("../mongo/agent");
const DemoAgent = require("../mongo/demoAgent");


const initSendData = (blogMongoID, demo = false) => {
    const sendData = async (dataForClient) => {
        dataForClient.hasStarted = true;
        if (dataForClient.type === "ending") {
          dataForClient.hasStarted = false;
          if (!demo) {
            await AgentDB.setHasStarted(blogMongoID, false);
            const daysLeftBlog = await AgentDB.subtractDaysLeft(blogMongoID);
            dataForClient.daysLeft = daysLeftBlog.daysLeft;
          }
        }
    
        if (dataForClient.type !== "updating") {
          const currAgent = demo ? DemoAgent : AgentDB;
          const postsLeft = await currAgent.addPost(blogMongoID, { url: dataForClient?.url || "", config: dataForClient?.config || "", title: dataForClient?.title || "", type: dataForClient?.type || "error", html: dataForClient?.html || "" });
          dataForClient = { ...dataForClient, ...postsLeft };
        }
        dataForClient.blogId = blogMongoID;
        sendDataToClient(dataForClient, blogIdToSocket);
    }
    return sendData;
}

module.exports = initSendData;