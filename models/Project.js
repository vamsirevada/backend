const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
  projectname: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
  },
  location: {
    type: String,
  },
  creator: {
    type: String,
  },
  notices: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'notice',
    },
  ],
  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
      fullName: {
        type: String,
      },
      status: {
        type: String,
      },
      avatar: {
        type: String,
      },
    },
  ],
  requests: [
    {
      request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'profile',
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
    },
  ],
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Project = mongoose.model('project', ProjectSchema);