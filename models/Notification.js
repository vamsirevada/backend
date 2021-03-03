const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  profile: {
    type: Schema.Types.ObjectId,
    ref: 'profile',
  },
  requests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'profile',
    },
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'post',
    },
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'post',
    },
  ],
  notices: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'notice',
    },
  ],
  read: {
    type: Boolean,
  },
});
