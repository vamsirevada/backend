const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Writer = require('../../models/Writer');

//@route  POST api/users
//@desc   Register user
//@access Public
router.post(
  '/',
  [
    check('fullName', 'fullName is required').not().isEmpty(),
    check('userName', 'userName is required').exists(),
    // check('userName', 'userName is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
    check('userpermission', 'Please agree to Terms and condition').contains(
      true
    ),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      fullName,
      userName,
      email,
      password,
      userpermission,
      // code,
    } = req.body;

    try {
      //See if user exists
      let user = await User.findOne({ email });
      // let refferal = await Referral.findOne({ code });
      // console.log(refferal, "refferal");

      // if (!refferal) {
      //   res
      //     .status(400)
      //     .json({ errors: [{ msg: "Refferral Code doesn't matched" }] });
      // } else

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      } else {
        user = new User({
          fullName,
          userName,
          email,
          password,
          userpermission,
        });

        //Encrypt password
        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);

        await user.save();

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
            if (err) {
              throw err;
            } else {
              res.json({ token });
            }
          }
        );
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

//@route  POST api/users/group
//@desc   Register A Group user
//@access Public
router.post(
  '/group',
  [
    check('groupName', 'Group Name is required').not().isEmpty(),
    check('userName', 'userName is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
    check('userpermission', 'Please agree to Terms and condition').contains(
      true
    ),
    check('isGroup', 'Please select account type').contains(true),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      groupName,
      userName,
      email,
      password,
      userpermission,
      isGroup,
      // code,
    } = req.body;

    try {
      //See if user exists
      let user = await User.findOne({ email });
      // let referral = await Referral.findOne({ code });
      // console.log(referral, "referral");

      // if (!referral) {
      //   res
      //     .status(400)
      //     .json({ errors: [{ msg: "Referral code doesn't macthed" }] });
      // } else

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      } else {
        user = new User({
          groupName,
          userName,
          email,
          password,
          userpermission,
          isGroup,
        });

        //Encrypt password
        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);

        await user.save();

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
            res.json({ token });
          }
        );
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

//@route Post /users/writer
//@desc  Register a  writer
//@acess Public

router.post(
  '/writer',
  [
    check('name', 'Please Add Name').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;

    try {
      //checking if user already exists by email
      let user = await Writer.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }
      //Createing new User
      user = new Writer({
        name,
        email,
        password,
      });
      //Hashing Password by bcrypt(encrypting password)
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

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
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
