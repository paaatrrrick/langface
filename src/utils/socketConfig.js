const socketIo = require("socket.io");


let io;

module.exports = {
  socketInit: (httpServer) => {
    io = socketIo(httpServer, {
      cors: {
        origin: [
          "http://localhost:3000",
          "https://langface.netlify.app",
          "https://langface.ai",
        ],
        methods: ["GET", "POST"],
      },
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
}







