const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Chat = require("../../models/Chat");



router.get("/getChats", auth, async (req, res) => {
  try {
    Chat.find()
      .populate("sender")
      .exec((err, chats) => {
        if (err) return res.status(400).send(err);
        res.status(200).send(chats);
      });
  } catch (error) {
    console.error(error);
  }
});

// router.get("/getChatById", auth, async (req, res) => {
//   try {
//     Chat.findById(req.params.id)
//       .populate("sender", "reciever")
//       .exec((err, chat) => {
//         if (err) return res.status(400).send(err);
//         res.status(200).send(chat);
//       });
//   } catch (error) {
//     console.error(error);
//   }
// });

router.post("/uploadfiles", auth, async (req, res) => {});

module.exports = router;
