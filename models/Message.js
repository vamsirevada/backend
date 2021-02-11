const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "conversations",
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  body: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    default: Date.now,
  },
});

module.exports = mongoose.model("messages", MessageSchema);
