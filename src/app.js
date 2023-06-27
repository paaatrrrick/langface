//require dotenv
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const { Agent } = require("./classes/Agent");
const FormData = require("form-data");
const fetch = require("node-fetch");
const mongoose = require("mongoose");

var SuccesfulPostsCount = 0; // counts how many blog posts were succesfully posted

console.log(process.env.MONGO_URI);
console.log('asdfsdfsfssfdsdffs');
console.log(process.env);
// mongoose.set('strictQuery', true);
// mongoose.connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// });

// const db = mongoose.connection;
// db.on("error", (message) => {
//     console.log(message)
//     console.error("Error connecting to database");
// });
// db.once("open", () => {
//     console.log("✅ Database connected");
// });


app.use(bodyParser.json(), bodyParser.urlencoded({ extended: false }));
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://langface.netlify.app",
      "https://langface.ai",
    ],
    methods: ["GET", "POST"],
  },
});

// test whether backend is responding
app.get("/data", (req, res) => {
  res.send("data");
});

// get full WP API token using temporary code
app.post("/wordpress", async (req, res) => {
  const { code } = req.body;
  var formdata = new FormData();
  formdata.append("client_id", process.env.WORDPRESS_CLIENT_ID);
  formdata.append("redirect_uri", process.env.WORDPRESS_REDIRECT_URI);
  formdata.append("client_secret", process.env.WORDPRESS_CLIENT_SECRET);
  formdata.append("code", code);
  formdata.append("grant_type", "authorization_code");
  var requestOptions = {
    method: "POST",
    body: formdata,
    redirect: "follow",
  };
  const result = await fetch(
    "https://public-api.wordpress.com/oauth2/token",
    requestOptions
  );
  if (!result.ok) {
    const error = await result.json();
    res.send(error).status(400);
  } else {
    const data = await result.json();
    console.log(data);
    res.send(data);
  }
});

// establish socket connection
io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("addData", (newData) => {
    const sendData = async (dataForClient) => {
      if (dataForClient.type !== "updating"){
        SuccesfulPostsCount += 1;
        console.log(`sending data to client: ${SuccesfulPostsCount}:`);
        console.log(dataForClient);
      }
      socket.emit("updateData", dataForClient); // sends data only to the connected socket
    };
    if (newData.loops > 50) {
      socket.emit("updateData", {
        type: "ending",
        content: "Ending: Please do 50 or less loops",
      });
      return;
    }
    try {
      if (newData.version !== "blogger") {
        newData.version = "wordpress";
      }
      const user = new Agent(
        newData.jwt,
        newData.id,
        newData.content,
        newData.loops,
        newData.openAIKey,
        newData.version,
        newData.blogSubject,
        sendData
      );
      user.run();
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
});

let PORT = process.env.PORT;
if (PORT == null || PORT == "") {
  PORT = 8000;
}

server.listen(PORT, () => {
  return console.log(`✅ We're live: ${PORT}`);
});
