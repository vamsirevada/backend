const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    message: {
      type: String,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    type: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", ChatSchema);
