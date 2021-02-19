const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
  code: {
    type: String,
  },
});

module.exports = mongoose.model('referral', ReferralSchema);
