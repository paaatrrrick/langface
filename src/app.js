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
const { User } = require("./classes/User");
const FormData = require("form-data");
const fetch = require("node-fetch");

var SuccesfulPostsCount = 0; // counts how many blog posts were succesfully posted

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
  fetch("https://public-api.wordpress.com/oauth2/token", requestOptions)
    .then((response) => response.text())
    .then((result) => {
      res.send(result);
    })
    .catch((error) => {
      console.log("error", error);
      res.send(error).status(500);
    });
});

// establish socket connection
io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("addData", (newData) => {
    const sendData = async (data123) => {
      SuccesfulPostsCount += 1;
      console.log(SuccesfulPostsCount);
      socket.emit("updateData", data123); // sends data only to the connected socket
    };
    if (newData.loops > 50) {
      socket.emit("updateData", {
        type: "ending",
        error: "Please do 50 or less loops",
      });
      return;
    }
    const user = new User(
      newData.jwt,
      newData.id,
      newData.content,
      newData.loops,
      newData.openAIKey,
      newData.version,
      sendData
    );
    try {
      user.run();
    } catch (e) {
      console.log(e);
      sendData({
        type: "ending",
        content: "Oops, we had an error",
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
