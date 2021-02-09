const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http").createServer(app);

dotenv.config();

const PORT = process.env.PORT || 5000;

http.listen(PORT, () => console.log(`Server Started on port ${PORT}`));

const io = require("socket.io")(http, {
  cors: {
    origin: "*",
  },
});

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.use(bodyParser.json());
app.use(express.json({}));
app.use(cors());

//Connect Database
mongoose
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

app.use((req, res, next) => {
  req.io = io;
  next();
});

// Define routes
app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/posts", require("./routes/api/posts"));
app.use("/api/article", require("./routes/api/article"));
app.use("/api/password", require("./routes/api/password"));
app.use("/api/messages", require("./routes/api/chat"));
app.use("/api", require("./routes/api/search"));

//endpoint
app.get("/api", (req, res) => res.send("API Running...!"));
