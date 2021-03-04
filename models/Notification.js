const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
  type: {
    type: String,
  },
  read: {
    type: Boolean,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Notification = mongoose.model(
  'notification',
  NotificationSchema
);
