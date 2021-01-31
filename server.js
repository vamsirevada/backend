const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const server = http.createServer(app);
const jwt = require("jsonwebtoken");
const io = require("socket.io")(server);
const dotenv = require("dotenv");
const Chat = require("./models/Chat");

dotenv.config();

//Connect Database
const connect = mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("MongoDB Connected...");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

app.set("socket", io);

io.on("connection", (socket) => {
  console.log(`client connected at ${socket.id}`);
  socket.on("Input Chat Message", (msg) => {
    connect.then((db) => {
      try {
        let chat = new Chat({
          message: msg.chatMessage,
          sender: msg.userId,
          reciever: msg.reciever,
          type: msg.type,
        });

        chat.save((err, doc) => {
          if (err) return res.json({ success: false, err });
          Chat.find({ _id: doc._id })
            .populate("sender")
            .populate("reciever")
            .exec((err, doc) => {
              console.log(doc);
              return io.emit("Output Chat Message", doc);
            });
        });
      } catch (error) {
        console.error(error);
      }
    });
  });
});

//endpoint
app.get("/api", (req, res) => res.send("API Running...!"));

//init middleware
app.use(morgan("dev"));
app.use(express.json({}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

// Define routes
app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/posts", require("./routes/api/posts"));
app.use("/api/article", require("./routes/api/article"));
app.use("/api/password", require("./routes/api/password"));
app.use("/api/chat", require("./routes/api/chat"));
app.use("/api", require("./routes/api/search"));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server Started on port ${PORT}`));
