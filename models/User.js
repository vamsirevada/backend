const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
  },
  groupName: {
    type: String,
  },
  userName: {
    type: String,
    unique: true,
    required: true,
  },
  avatar: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isGroup: {
    type: Boolean,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  resetPasswordLink: {
    data: String,
    default: '',
  },
  activityStatus: {
    type: String,
    default: 'offline',
  },
});

module.exports = mongoose.model('user', UserSchema);
