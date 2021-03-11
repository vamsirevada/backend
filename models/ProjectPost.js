const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProjectPostSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'project',
  },
  text: {
    type: String,
    required: true,
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
      firstName: {
        type: String,
      },
      lastName: {
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

module.exports = ProjectPost = mongoose.model('projectpost', ProjectPostSchema);
