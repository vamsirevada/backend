const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExpenseSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'project',
  },
  creator: {
    type: String,
  },
  text: {
    type: String,
  },
  amount: {
    type: Number,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('expense', ExpenseSchema);
