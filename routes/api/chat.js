const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Chat = require("../../models/Chat");

router.get("/getChats", auth, async (req, res) => {
  try {
    Chat.find()
      .populate("sender")
      .populate("reciever")
      .exec((err, chats) => {
        if (err) return res.status(400).send(err);
        res.status(200).send(chats);
      });
  } catch (error) {
    console.error(error);
  }
});

router.post("/uploadfiles", auth, async (req, res) => {});

module.exports = router;
