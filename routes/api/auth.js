const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const Referral = require("../../models/Referral");
const Writer = require("../../models/Writer");
const { sendEmail } = require("../../helpers");
const Generator = require("../../helpers/referralCodegenerator");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");

//@route  GET api/auth
//@desc   get logged in users
//@access Public
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route GET /auth/writer
//@desc  Get logged in writer token
//@acess Private

router.get("/writer", auth, async (req, res) => {
  try {
    const user = await Writer.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

//@route  POST api/auth
//@desc   Authenticate user & get token(Login)
//@access Public

router.post(
  "/",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
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
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
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
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

//@route POST /auth/writer
//@desc  Auth user & get Token
//@acess Public

router.post(
  "/writer",
  [
    check("email", "please include a valid email").isEmail(),
    check("password", "password is required").exists(),
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
        return res.status(400).json({ msg: "Invalid Credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ msg: "Invalid Credentials" });
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
      res.sattus(500).send("Server Error");
    }
  }
);

//@route POST /auth/send-referral
//@desc  Auth user & get Token
//@acess Public

router.post("/send-referral", [], async (req, res) => {
  const { email } = req.body;

  const code = Generator.generate({
    length: 6,
    count: 1,
  });

  const emailData = {
    from: "noreply@node-react.com",
    to: email,
    subject: "Referral Code",
    text: `Please use the following Code to Register:${code[0]} `,
    html: `<p>Please use the following Code to Register:</p> <b>${code[0]}</b>`,
  };
  try {
    const newCode = new Referral({
      code: code[0],
    });

    const insert = await newCode.save();

    if (insert) {
      sendEmail(emailData);
      res.json({ message: "code sent" });
    }
  } catch (err) {
    console.error(err.message);
    res.sattus(500).send("Server Error");
  }
});

module.exports = router;
