const { getIO } = require('./socketConfig');

var SuccesfulPostsCount = 0
const blogIdToSocket = {};
const activeTabIds = new Set();

const leaveRoom = (tabId) => {
  console.log('leave');
  for (let blogId in blogIdToSocket){
    const index = blogIdToSocket[blogId].indexOf(tabId);
    if (index > -1){
      blogIdToSocket[blogId].splice(index, 1);
    }
    if (blogIdToSocket[blogId].length === 0){
      delete blogIdToSocket[blogId];
    }
  }
  activeTabIds.delete(tabId);
  console.log("Client disconnected");
}

const sendDataToClient = (dataForClient, blogIdToSocketMap) => {
  try{
    const io = getIO();
    const blogId = dataForClient.blogId;
    if (!blogIdToSocketMap[blogId]){
      return;
    }
    for (let tabId of blogIdToSocketMap[blogId]){
      if (dataForClient.type !== "updating"){
        SuccesfulPostsCount += 1;
        console.log(`sending data to client: ${SuccesfulPostsCount}:`);
        console.log(dataForClient);
      }
      io.to(tabId).emit('updateData', dataForClient);
    }
  } catch(e) {
    console.log(e);
  }
}


const webSocket = () => {
    const io = getIO();
    io.on("connection", (socket) => { 
      socket.on("leaveRoom", (newData) => {
        console.log('at leave room');
        console.log(newData);
        leaveRoom(newData.tabId);
      });
      socket.on("joinRoom", async (newData) => {
        const { tabId, blogIds } = newData;
        for (let blogId of blogIds){
          if (!blogIdToSocket[blogId]){
            blogIdToSocket[blogId] = [tabId];
          } else {
            //check if tabId is already in the array
            if (blogIdToSocket[blogId].indexOf(tabId) === -1){
              blogIdToSocket[blogId].push(tabId);
            }
          }
        }
        activeTabIds.add(tabId);
        socket.join(tabId);
      });
      socket.on("addData", async (newData) => {
        console.log(socket.id);
        try {
          await handleAddData(newData, io, socket);
        } catch (e) {
          console.log('bottom error');
          console.log(e);
          if (newData.blogID){
            socket.emit("updateData", { 
              blogId: newData.blogID,
              type: "ending",
              config: e.message
            });
          }
        }
      });
    });
};

module.exports = { webSocket, blogIdToSocket, sendDataToClient };