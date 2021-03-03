const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NoticeSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'project',
  },
  title: {
    type: String,
  },
  noticeImg: {
    type: String,
  },
  deadline: {
    type: Date,
  },
  eligibility: {
    type: String,
  },
  venue: {
    type: String,
  },
  description: {
    type: String,
  },
  role: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('notice', NoticeSchema);
