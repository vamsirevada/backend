const jwt = require('jsonwebtoken');
require('dotenv').config();
const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const _ = require('lodash');
const { sendEmail } = require('../../helpers');
const { check } = require('express-validator');
const bcrypt = require('bcryptjs');

router.put(
  '/forgot-password',
  [check('email', 'Please include a valid email').isEmail()],
  async (req, res) => {
    if (!req.body) return res.status(400).json({ message: 'No request body' });
    if (!req.body.email)
      return res.status(400).json({ message: 'No Email in request body' });

    const { email } = req.body;
    // find the user based on email
    try {
      const user = await User.findOne({ email });

      if (!user) {
        return res.status('401').json({
          error: 'User with that email does not exist!',
        });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET);

      const emailData = {
        from: `"Vanity Admin" ${process.env.EMAIL_USER}`,
        to: email,
        subject: 'Password Reset Instructions',
        text: `Please use the following link to reset your password: ${process.env.CLIENT_URL}/reset-password/${token}`,
        html: `<p>Please use the following link to reset your password:</p> <p>${process.env.CLIENT_URL}/reset-password/${token}</p>`,
      };

      return user.updateOne({ resetPasswordLink: token }, (err, success) => {
        if (err) {
          return res.json({ message: err });
        } else {
          sendEmail(emailData);
          return res.status(200).json({
            message: `Email has been sent to ${email}. Follow the instructions to reset your password.`,
          });
        }
      });
    } catch (err) {
      console.error(err);
    }
  }
);

router.put('/reset-password', async (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;
  User.findOne({ resetPasswordLink }, async (err, user) => {
    // if err or no user
    if (err || !user)
      return res.status('401').json({
        error: 'Invalid Link!',
      });

    const salt = await bcrypt.genSalt(10);

    const updatepass = await bcrypt.hash(newPassword, salt);

    const updatedFields = {
      password: updatepass,
      resetPasswordLink: '',
    };
    user = _.extend(user, updatedFields);
    user.updated = Date.now();
    user.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: err,
        });
      }
      res.json({
        message: `Great! Now you can login with your new password.`,
      });
    });
  });
});
module.exports = router;
