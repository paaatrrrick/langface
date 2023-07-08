//require dotenv
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const http = require("http");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { webSocket } = require("./endpoints/webSockets");
const { socketInit } = require("./endpoints/socketConfig");
const basicRoutes = require("./endpoints/basicRoutes");
const cookieParser = require("cookie-parser");



mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", (message) => {
    console.log(message)
    console.error("Error connecting to database");
});
db.once("open", () => {
    console.log("✅ Database connected");
});

app.use('/webhook', bodyParser.raw({type: "*/*"}));
app.use(bodyParser.json(), bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({credentials: true, origin: ["http://localhost:3000", "https://langface.netlify.app", "https://langface.ai"]}));
app.use("", basicRoutes);

const server = http.createServer(app);
socketInit(server);
webSocket();


let PORT = process.env.PORT;
if (PORT == null || PORT == "") {
  PORT = 8000;
}

server.listen(PORT, () => {
  return console.log(`✅ We're live: ${PORT}`);
});
