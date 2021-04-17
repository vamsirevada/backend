const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
  avatar: {
    type: String,
  },
  text: {
    type: String,
  },
  title: {
    type: String,
  },
  fullName: {
    type: String,
  },
  groupName: {
    type: String,
  },
  userName: {
    type: String,
  },
  url: {
    type: String,
  },
  link: {
    type: String,
  },
  type: {
    type: String,
  },
  likes: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
      },
      fullName: {
        type: String,
      },
      avatar: {
        type: String,
      },
    },
  ],
  comments: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
      },
      postId: {
        type: Schema.Types.ObjectId,
        ref: 'post',
      },
      text: {
        type: String,
        required: true,
      },
      fullName: {
        type: String,
      },
      groupName: {
        type: String,
      },
      userName: {
        type: String,
      },
      avatar: {
        type: String,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Post = mongoose.model('post', PostSchema);
