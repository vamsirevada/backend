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
    reciever: {
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

// const mongoose = require("mongoose");
// mongoose.Promise = global.Promise;

// const Message = new mongoose.Schema({
//   roomId: { type: mongoose.Schema.Types.ObjectId },
//   sender: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
//   text: {
//     type: String,
//     trim: true,
//     minlength: 1,
//   },
//   messageType: {
//     type: String,
//     required: true,
//   },
//   receiver: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
//   photo: String,
//   read: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("Message", Message);
