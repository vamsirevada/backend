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
  applied: [
    {
      applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'profile',
      },
    },
  ],
  shortlisted: [
    {
      shortlist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'profile',
      },
    },
  ],

  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('notice', NoticeSchema);
