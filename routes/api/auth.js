const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Referral = require('../../models/Referral');
const Writer = require('../../models/Writer');
const { sendEmail } = require('../../helpers');
const Generator = require('../../helpers/referralCodegenerator');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

//@route  GET api/auth
//@desc   get logged in users
//@access Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, {
      $set: { activityStatus: 'online' },
    }).select(-'password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route GET /auth/writer
//@desc  Get logged in writer token
//@acess Private

router.get('/writer', auth, async (req, res) => {
  try {
    const user = await Writer.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

//@route  POST api/auth
//@desc   Authenticate user & get token(Login)
//@access Public

router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      //See if user exists
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User does not exist' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      //Retrun jsonwebtoken
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.cookie('t', token);
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

//@route POST /auth/writer
//@desc  Auth user & get Token
//@acess Public

router.post(
  '/writer',
  [
    check('email', 'please include a valid email').isEmail(),
    check('password', 'password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await Writer.findOne({ email });

      if (!user) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      //object that we wanna send to token
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.sattus(500).send('Server Error');
    }
  }
);

//@route POST /auth/send-referral
//@desc  Auth user & get Token
//@acess Public

router.post('/send-referral', [], async (req, res) => {
  const { email } = req.body;

  const code = Generator.generate({
    length: 6,
    count: 1,
  });

  const emailData = {
    from: `"Vanity India" ${process.env.EMAIL_USER}`,
    to: email,
    subject: 'Vanity | Social Networking site for M& E Industry',
    text: `Please use the following Code to Register:${code[0]} `,
    html: `<p>Hi,</p>
    <p>Welcome to Vanity!!!</p>
    <p>Vanity is an Professional networking platform for the Media &</p> <p>Entertainment community, with an aim to bring entertainment</p><p>industry professionals under one roof and facilitate them with</p><p> productive tools that will ensure success.</p><br/>
    <p>We are very pleased that you’re becoming part of vanity family and</p><p>joining your friends and colleagues. We hope to cater your needs.</p> <br/> 
    <p>Your Referral Code:</p><b>${code[0]}</b>
    <p>Best Regards</p>
    <h3>Team Vanity</h3>`,
  };
  try {
    const newCode = new Referral({
      code: code[0],
    });

    const insert = await newCode.save();

    if (insert) {
      sendEmail(emailData);
      res.json({
        message: 'Referral code sent to your email-id, Kindly check your email',
      });
    }
  } catch (err) {
    console.error(err.message);
    res.sattus(500).send('Server Error');
  }
});

//@route POST /auth/send-invite
//@desc  Auth user & get Token
//@acess Public

router.post('/send-invite', [], async (req, res) => {
  const { email } = req.body;

  const code = Generator.generate({
    length: 6,
    count: 1,
  });

  const emailData = {
    from: `"Vanity India" ${process.env.EMAIL_USER}`,
    to: email,
    subject: 'You have been invited to join Vanity',
    text: `Please use the following Code to Register:${code[0]} `,
    html: `<p>Hi,</p>
   <p>Greetings from team vanity,</p>
   <p>We are a Professional networking platform for the Media &</p> <p>Entertainment community, with an aim to bring entertainment</p> <p>industry professionals under one roof and facilitate them with</p> <p>productive tools that will ensure success.</p><br/>
   <p>Your Friend/ Colleague has invited you to join vanity.</p><br/>
   <a href="http://vanity.ac">Vanity Webiste</a><br/>
   <p>Your Invite Code:</p><b>${code[0]}</b>
   <p>Thank you</p>
   <p>Best Regards</p>
   <h3>Team Vanity</h3>`,
  };
  try {
    const newCode = new Referral({
      code: code[0],
    });

    const insert = await newCode.save();

    if (insert) {
      sendEmail(emailData);
      res.json({
        message: 'Referral code sent to your email-id, Kindly check your email',
      });
    }
  } catch (err) {
    console.error(err.message);
    res.sattus(500).send('Server Error');
  }
});

router.get('/signout', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $set: { activityStatus: 'offline' },
    });
    res.clearCookie('t');
    res.json({ message: 'Signout success!' });
  } catch (err) {
    console.error(err.message);
  }
});

module.exports = router;
