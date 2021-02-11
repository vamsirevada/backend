const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Message = require("../../models/Message");

const mongoose = require("mongoose");
const Conversation = require("../../models/Conversation");

router.get("/conversations", auth, async (req, res) => {
  const from = req.user.id;
  Conversation.aggregate([
    {
      $lookup: {
        from: "user",
        localField: "recipients",
        foreignField: "_id",
        as: "recipientObj",
      },
    },
  ])
    .match({ recipients: { $all: [{ $elemMatch: { $eq: from } }] } })
    .project({
      "recipientObj.password": 0,
      "recipientObj.__v": 0,
      "recipientObj.date": 0,
    })
    .exec((err, conversations) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
      } else {
        res.send(conversations);
      }
    });
});

router.get("/conversations/query", auth, async (req, res) => {
  const user1 = req.user.id;
  const user2 = req.query.userId;
  Message.aggregate([
    {
      $lookup: {
        from: "user",
        localField: "to",
        foreignField: "_id",
        as: "toObj",
      },
    },
    {
      $lookup: {
        from: "user",
        localField: "from",
        foreignField: "_id",
        as: "fromObj",
      },
    },
  ])
    .match({
      $or: [
        { $and: [{ to: user1 }, { from: user2 }] },
        { $and: [{ to: user2 }, { from: user1 }] },
      ],
    })
    .project({
      "toObj.password": 0,
      "toObj.__v": 0,
      "toObj.date": 0,
      "fromObj.password": 0,
      "fromObj.__v": 0,
      "fromObj.date": 0,
    })
    .exec((err, messages) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
      } else {
        res.send(messages);
      }
    });
});

router.post("/", auth, async (req, res) => {
  console.log(req.body.body);

  const from = req.user.id;
  const to = req.body.to;
  Conversation.findOneAndUpdate(
    {
      recipients: {
        $all: [{ $elemMatch: { $eq: from } }, { $elemMatch: { $eq: to } }],
      },
    },
    {
      recipients: [req.user.id, req.body.to],
      lastMessage: req.body.body,
      date: Date.now(),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
    (err, conversation) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
      } else {
        let message = new Message({
          conversation: conversation._id,
          to: req.body.to,
          from: req.user.id,
          body: req.body.body,
        });
        req.io.sockets.emit("messages", req.body.body);
        message.save((err) => {
          if (err) {
            console.log(err);
            res.sendStatus(500);
          } else {
            res.end(
              JSON.stringify({
                message: "Success",
                conversationId: conversation._id,
              })
            );
          }
        });
      }
    }
  );
});

module.exports = router;
