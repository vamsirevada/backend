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
  members: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'user',
  },
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
