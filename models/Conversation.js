const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema({
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  lastMessage: {
    type: String,
  },
  date: {
    type: String,
    default: Date.now,
  },
});

module.exports = mongoose.model("conversations", ConversationSchema);
