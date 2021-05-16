const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Profile = require('../../models/Profile');
const Project = require('../../models/Project');
const User = require('../../models/User');
const Post = require('../../models/Post');

//@route  GET api/profile/me
//@desc   Get current users profile(user and groupuser)
//@access Private

router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    })
      .populate('user', [
        'userName',
        'fullName',
        'groupName',
        'isGroup',
        'avatar',
      ])
      .populate('chats');

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }
    req.user = profile;
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  POST api/profile
//@desc   Create or update user profile
//@access Private
router.post('/', [auth], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    location,
    avatar,
    bio,
    status,
    founder,
    dob,
    gender,
    hometown,
    languageknown,
  } = req.body;

  const profileFields = {};
  profileFields.user = req.user.id;
  if (location) profileFields.location = location;
  if (avatar) profileFields.avatar = avatar;
  if (bio) profileFields.bio = bio;
  if (status) profileFields.status = status;
  if (dob) profileFields.dob = dob;
  if (gender) profileFields.gender = gender;
  if (founder) profileFields.founder = founder;
  if (hometown) profileFields.hometown = hometown;
  if (languageknown) profileFields.languageknown = languageknown;

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    if (profile) {
      // Update
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      ).populate('user', [
        'userName',
        'fullName',
        'groupName',
        'isGroup',
        'avatar',
        'activityStatus',
      ]);

      await User.findByIdAndUpdate(
        { _id: req.user.id },
        { avatar: profileFields.avatar }
      );
      return res.json(profile);
    }

    //Create
    profile = new Profile(profileFields);

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  GET api/profile
//@desc   Get all profiles
//@access Public

router.get('/', auth, async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', [
      'fullName',
      'userName',
      'groupName',
      'avatar',
      'activityStatus',
    ]);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  GET api/profile/user/:user_id
//@desc   Get profile by user ID
//@access Public

router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', [
      'fullName',
      'groupName',
      'userName',
      'isGroup',
      'avatar',
      'activityStatus',
    ]);

    if (!profile) return res.status(400).json({ msg: 'Profile Not Found' });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile Not Found' });
    }
    req.status(500).send('Server Error');
  }
});

//@route  DELETE api/profile
//@desc   Delete profile, user, group Users & posts
//@access Private

router.delete('/', auth, async (req, res) => {
  try {
    // Removes users posts
    await Post.deleteMany({ user: req.user.id });

    // Removes user's profile
    await Profile.findOneAndRemove({ user: req.user.id });

    // Removes user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  PUT api/profile/experience
//@desc   Add profile experience
//@access Private

router.put('/experience', auth, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title,
    project,
    projectavatar,
    company,
    location,
    from,
    to,
    current,
    description,
  } = req.body;

  const newExp = {
    title,
    company,
    project,
    projectavatar,
    location,
    from,
    to,
    current,
    description,
  };

  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //creates profile experience
    profile.experience.unshift(newExp);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route  PUT api/profile/experience/:exp_id
//@desc   Update profile experience using experince id
//@access Private

router.put('/experience/:exp_id', auth, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title,
    company,
    project,
    projectavatar,
    location,
    from,
    to,
    current,
    description,
  } = req.body;

  //Build Profile object

  const profileFields = {};
  profileFields.user = req.user.id;

  //Build experience object
  profileFields.experience = {};
  if (title) profileFields.experience.title = title;
  if (project) profileFields.experience.project = project;
  if (projectavatar) profileFields.experience.projectavatar = projectavatar;
  if (company) profileFields.experience.company = company;
  if (location) profileFields.experience.location = location;
  if (from) profileFields.experience.from = from;
  if (to) profileFields.experience.to = to;
  if (current) profileFields.experience.current = current;
  if (description) profileFields.experience.description = description;

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    // if(profile) {
    //   // Update
    //   profile = await Profile.findOneAndUpdate({ user: req.user.id}, { $set: profileFields}, { new: true });

    //   return res.json(profile);
    // }

    //Get remove index
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);

    profile.experience.unshift(profileFields.experience);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  DELETE api/profile/experience/:exp_id
//@desc   Delete profile experience using experince id
//@access Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get remove index
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  PUT api/profile/education
//@desc   Add profile education
//@access Private

router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { school, degree, fieldofstudy, from, to, current, description } =
      req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      //creates profile experience
      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  PUT api/profile/education/:exp_id
//@desc   Update profile education using experince id
//@access Private

router.put(
  '/education/:exp_id',
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'degree is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { school, degree, fieldofstudy, from, to, current, description } =
      req.body;

    //Build Profile object

    const profileFields = {};
    profileFields.user = req.user.id;

    //Build education object
    profileFields.education = {};
    if (school) profileFields.education.school = school;
    if (degree) profileFields.education.degree = degree;
    if (fieldofstudy) profileFields.education.fieldofstudy = fieldofstudy;
    if (from) profileFields.education.from = from;
    if (to) profileFields.education.to = to;
    if (current) profileFields.education.current = current;
    if (description) profileFields.education.description = description;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      // if(profile) {
      //   // Update
      //   profile = await Profile.findOneAndUpdate({ _id: req.params.edu_id}, { $set: profileFields}, { new: true });

      //   return res.json(profile);
      // }

      const removeIndex = profile.education
        .map((item) => item.id)
        .indexOf(req.params.exp_id);

      profile.education.splice(removeIndex, 1);

      profile.education.unshift(profileFields.education);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      req.status(500).send('Server Error');
    }
  }
);

//@route  DELETE api/profile/education/:edu_id
//@desc   Delete profile education using education id
//@access Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get remove index
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  PUT api/profile/awards
//@desc   Add awards
//@access Private

router.put(
  '/awards',
  [
    auth,
    [
      check('award', 'Award is required').not().isEmpty(),
      check('date', 'date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { award, date, description } = req.body;

    const newExp = {
      award,
      date,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      //creates profile experience
      profile.awards.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  PUT api/profile/awards/:award_id
//@desc   Update award using award id
//@access Private

router.put(
  '/awards/:award_id',
  [
    auth,
    [
      check('award', 'Award is required').not().isEmpty(),
      check('date', 'date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { award, date, description } = req.body;

    //Build Profile object

    const profileFields = {};
    profileFields.user = req.user.id;

    //Build awards object
    profileFields.awards = {};
    if (award) profileFields.awards.award = award;
    if (date) profileFields.awards.date = date;
    if (description) profileFields.awards.description = description;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      // if(profile) {
      //   // Update
      //   profile = await Profile.findOneAndUpdate({ user: req.user.id}, { $set: profileFields}, { new: true });

      //   return res.json(profile);
      // }

      //Get remove index
      const removeIndex = profile.awards
        .map((item) => item.id)
        .indexOf(req.params.award_id);

      profile.awards.splice(removeIndex, 1);

      profile.awards.unshift(profileFields.awards);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      req.status(500).send('Server Error');
    }
  }
);

//@route  DELETE api/profile/awards/:award_id
//@desc   Delete award using experince id
//@access Private
router.delete('/awards/:award_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get remove index
    const removeIndex = profile.awards
      .map((item) => item.id)
      .indexOf(req.params.award_id);

    profile.awards.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  PUT api/profile/events
//@desc   Add events
//@access Private

router.put(
  '/events',
  [
    auth,
    [
      check('event', 'Event is required').not().isEmpty(),
      check('date', 'date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { event, date, description } = req.body;

    const newExp = {
      event,
      date,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      //creates profile experience
      profile.events.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  PUT api/profile/events/:event_id
//@desc   Update award using event id
//@access Private

router.put(
  '/events/:event_id',
  [
    auth,
    [
      check('event', 'Event Name is required').not().isEmpty(),
      check('date', 'date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { event, date, description } = req.body;

    //Build Profile object

    const profileFields = {};
    profileFields.user = req.user.id;

    //Build events object
    profileFields.events = {};
    if (event) profileFields.events.event = event;
    if (date) profileFields.events.date = date;
    if (description) profileFields.events.description = description;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      // if(profile) {
      //   // Update
      //   profile = await Profile.findOneAndUpdate({ user: req.user.id}, { $set: profileFields}, { new: true });

      //   return res.json(profile);
      // }

      //Get remove index
      const removeIndex = profile.awards
        .map((item) => item.id)
        .indexOf(req.params.event_id);

      profile.events.splice(removeIndex, 1);

      profile.events.unshift(profileFields.events);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      req.status(500).send('Server Error');
    }
  }
);

//@route  DELETE api/profile/events/:event_id
//@desc   Delete event using event id
//@access Private
router.delete('/events/:event_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get remove index
    const removeIndex = profile.events
      .map((item) => item.id)
      .indexOf(req.params.event_id);

    profile.events.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  PUT api/profile/skills
//@desc   Add skills
//@access Private

router.put(
  '/skills',
  [auth, [check('skill', 'Skills are required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { skill } = req.body;

    const newExp = {
      skill,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      //creates profile experience
      profile.skills.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  PUT api/profile/skills/:skill_id
//@desc   Update skill using skill id
//@access Private

router.put(
  '/skills/:skill_id',
  [
    auth,
    [
      check('skill', 'skill is required').not().isEmpty(),
      // check('date', 'date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { skill } = req.body;

    //Build Profile object

    const profileFields = {};
    profileFields.user = req.user.id;

    //Build skills object
    profileFields.skills = {};
    if (skill) profileFields.skills.skill = skill;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      //Get remove index
      const removeIndex = profile.skills
        .map((item) => item.id)
        .indexOf(req.params.skill_id);

      profile.skills.splice(removeIndex, 1);

      profile.skills.unshift(profileFields.skills);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      req.status(500).send('Server Error');
    }
  }
);

//@route  DELETE api/profile/skills/:skill_id
//@desc   Delete skill using skill id
//@access Private
router.delete('/skills/:skill_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get remove index
    const removeIndex = profile.skills
      .map((item) => item.id)
      .indexOf(req.params.skill_id);

    profile.skills.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  PUT api/profile/addteam
//@desc   Add team Members
//@access Private

router.put(
  '/addteam',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('status', 'status is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, status, from, to, current, description } = req.body;

    const newExp = {
      name,
      status,
      from,
      to,
      current,
      description,
    };

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      //adds team member
      profile.teammembers.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  PUT api/profile/addteam/:teammemid
//@desc   Update team members using team members id
//@access Private

router.put(
  '/addteam/:teammemid',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('status', 'Status is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, status, from, to, current, description } = req.body;

    //Build Profile object

    const profileFields = {};
    profileFields.user = req.user.id;

    //Build experience object
    profileFields.teammembers = {};
    if (name) profileFields.teammembers.name = name;
    if (status) profileFields.teammembers.status = status;
    if (from) profileFields.teammembers.from = from;
    if (to) profileFields.teammembers.to = to;
    if (current) profileFields.teammembers.current = current;
    if (description) profileFields.teammembers.description = description;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      // if(profile) {
      //   // Update
      //   profile = await Profile.findOneAndUpdate({ user: req.user.id}, { $set: profileFields}, { new: true });

      //   return res.json(profile);
      // }

      //Get remove index
      const removeIndex = profile.teammembers
        .map((item) => item.id)
        .indexOf(req.params.teammemid);

      profile.teammembers.splice(removeIndex, 1);

      profile.teammembers.unshift(profileFields.teammembers);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      req.status(500).send('Server Error');
    }
  }
);

//@route  DELETE api/profile/addteam/:teammemid
//@desc   Delete team member using team member id
//@access Private
router.delete('/addteam/:teammemid', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get remove index
    const removeIndex = profile.teammembers
      .map((item) => item.id)
      .indexOf(req.params.teammemid);

    profile.teammembers.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  PUT api/profile/testinomials
//@desc   Add testinomial
//@access Private

router.put(
  '/testinomials',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('description', 'description is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    const newExp = {
      name,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      //creates testinomial
      profile.testinomials.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  PUT api/profile/testinomials/:test_id
//@desc   Update testinomial by test ID
//@access Private

router.put(
  '/testinomials/:test_id',
  [
    auth,
    [
      check('name', ' Name is required').not().isEmpty(),
      check('description', 'description is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    //Build Profile object

    const profileFields = {};
    profileFields.user = req.user.id;

    //Build testinomials object
    profileFields.testinomials = {};
    if (name) profileFields.testinomials.name = name;
    if (description) profileFields.testinomials.description = description;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      // if(profile) {
      //   // Update
      //   profile = await Profile.findOneAndUpdate({ user: req.user.id}, { $set: profileFields}, { new: true });

      //   return res.json(profile);
      // }

      //Get remove index
      const removeIndex = profile.testinomials
        .map((item) => item.id)
        .indexOf(req.params.test_id);

      profile.testinomials.splice(removeIndex, 1);

      profile.testinomials.unshift(profileFields.testinomials);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      req.status(500).send('Server Error');
    }
  }
);

//@route  DELETE api/profile/testinomials/:test_id
//@desc   Delete testinomial using test id
//@access Private
router.delete('/testinomials/:test_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get remove index
    const removeIndex = profile.testinomials
      .map((item) => item.id)
      .indexOf(req.params.test_id);

    profile.testinomials.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  PUT api/profile/partners
//@desc   Add partners
//@access Private

router.put(
  '/partners',
  [auth, [check('partner', 'Partner are required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { partner } = req.body;

    const newExp = {
      partner,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      //creates profile experience
      profile.partners.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  DELETE api/profile/partners/:part_id
//@desc   Delete partner using partner id
//@access Private
router.delete('/partners/:part_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get remove index
    const removeIndex = profile.partners
      .map((item) => item.id)
      .indexOf(req.params.part_id);

    profile.partners.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  PUT api/profile/clients
//@desc   Add clients
//@access Private

router.put(
  '/clients',
  [auth, [check('client', 'Client are required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { client } = req.body;

    const newExp = {
      client,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      //creates profile experience
      profile.clients.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  DELETE api/profile/clients/:cli_id
//@desc   Delete client using client id
//@access Private
router.delete('/clients/:cli_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get remove index
    const removeIndex = profile.clients
      .map((item) => item.id)
      .indexOf(req.params.cli_id);

    profile.clients.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  PUT api/profile/specialisation
//@desc   Add specialisations
//@access Private

router.put(
  '/specialisation',
  [auth, [check('skill', 'Please add the fields').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { skill } = req.body;

    const newExp = {
      skill,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      //creates profile experience
      profile.skills.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  DELETE api/profile/specialisation/:spec_id
//@desc   Delete specialisation using specialisation id
//@access Private
router.delete('/specialisation/:spec_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get remove index
    const removeIndex = profile.skills
      .map((item) => item.id)
      .indexOf(req.params.spec_id);

    profile.skills.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  PUT api/profile/contactus
//@desc   Add contactus
//@access Private

router.put(
  '/contactus',
  [
    auth,
    [
      check('email', 'Please add Email').not().isEmpty(),
      check('address', 'Please add address').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, address } = req.body;

    const newExp = {
      email,
      address,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      //creates profile experience
      profile.contactus.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  DELETE api/profile/contacts/:con_id
//@desc   Delete Email and address
//@access Private
router.delete('/contactus/:con_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get remove index
    const removeIndex = profile.contactus
      .map((item) => item.id)
      .indexOf(req.params.con_id);

    profile.contactus.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

// @route  GET api/profile/request
// @desc   Get friend requests
// @access Private
router.get('/request', auth, async (req, res) => {
  try {
    //test
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res
        .status(404)
        .json({ msg: 'You have not created your profile yet' });
    }

    res.json(profile.requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  PUT api/profile/request/:profile_id
// @desc   Send a buddy request
// @access Private
router.put('/request/:profile_id', auth, async (req, res) => {
  try {
    /* Pull out profile and check if it exists */
    const fromProfile = await Profile.findOne({ user: req.user.id });
    if (!fromProfile) {
      return res
        .status(404)
        .json({ msg: 'You have not created a profile yet' });
    }

    const fromUser = await User.findById(fromProfile.user);

    /* Check if its the same person */
    if (fromProfile._id.toString() === req.params.profile_id) {
      return res.status(401).json({ msg: 'Lol thats you, what are you doing' });
    }

    /* Pull out profile theyre requesting to and check if it exists */
    const toProfile = await Profile.findById(req.params.profile_id).populate(
      'user',
      ['fullName', 'groupName', 'userName']
    );
    if (!toProfile) {
      return res
        .status(404)
        .json({ msg: "The user you're requesting to does not exist" });
    }
    const toUser = toProfile.user._id;

    /* Check if they're friends already */
    let friendIndex = toProfile.buddies
      .map((buddy) => buddy.toString())
      .indexOf(req.user.id);
    if (friendIndex > -1) {
      return res
        .status(401)
        .json({ msg: 'You are already friends with this user' });
    }

    /* Check if the request was sent already */
    let requestIndex = toProfile.requests
      .map((request) => request.toString())
      .indexOf(req.user.id);
    if (requestIndex > -1) {
      return res
        .status(401)
        .json({ msg: 'You have already sent a friend request' });
    }

    /* Check if a request was sent back already, cancel both requests and make them friends */
    requestIndex = fromProfile.requests.indexOf(toUser);
    if (requestIndex > -1) {
      fromProfile.requests.splice(requestIndex, 1);
      fromProfile.buddies.unshift(toUser);
      toProfile.buddies.unshift(req.user.id);
      await fromProfile.save();
      await toProfile.save();
      return res.json({
        msg: `${toProfile.user.userName} already sent a request to you, so now you're friends`,
      });
    }

    /* Send the request */
    toProfile.requests.unshift(req.user.id);
    await toProfile.save();
    res.json({
      msg: `Buddy request successfully sent to ${toProfile.user.userName}`,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  DELETE api/profile/request/:profile_id
// @desc   Decline a buddy request
// @access Private
router.delete('/request/:profile_id', auth, async (req, res) => {
  try {
    /* Pull out the profile and check if it exists */
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res
        .status(404)
        .json({ msg: 'You have not created a profile yet' });
    }

    /* Pull out their profile and get their user */
    const reqProfile = await Profile.findById(req.params.profile_id);
    const reqUser = reqProfile.user;

    let removeIndex = profile.requests.indexOf(reqUser);
    if (removeIndex < 0) {
      return res
        .status(401)
        .json({ msg: 'This user has not sent a request to you' });
    }

    /* Remove the request and return */
    profile.requests.splice(removeIndex, 1);
    await profile.save();
    res.json({ msg: 'Buddy request has been declined' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  PUT api/profile/buddy/:buddy_id
// @desc   Add buddy to profile using buddy profiule id
// @access Private
router.put('/buddy/:buddy_id', auth, async (req, res) => {
  try {
    // Get the users profile and check if it exists
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(401).json({ msg: 'You did not make your profile yet' });
    }

    // Get their profile and check if their profile exists
    const buddyProfile = await Profile.findById(req.params.buddy_id);
    if (!buddyProfile) {
      return res
        .status(404)
        .json({ msg: 'Cannot add, their profile does not exist' });
    }

    // Check if the friend request was sent
    let removeIndex = profile.requests.indexOf(buddyProfile.user);
    if (removeIndex < 0) {
      return res
        .status(401)
        .json({ msg: 'The user did not send a request to you' });
    }

    // Add the new buddy, save & return
    profile.requests.splice(removeIndex, 1);
    profile.buddies.unshift(buddyProfile.user);
    buddyProfile.buddies.unshift(req.user.id);
    await buddyProfile.save();
    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  DELETE api/profile/buddy/:buddy_id
// @desc   Delete buddy from profile
// @access Private
router.delete('/buddy/:buddy_id', auth, async (req, res) => {
  try {
    // Get the user's profile and check if it exists
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(401).json({ msg: 'You did not make your profile yet' });
    }

    // Get the buddies profile and check if it exists
    const buddyProfile = await Profile.findById(req.params.buddy_id);
    if (!buddyProfile) {
      return res.status(401).json({
        msg: 'Profile not found, You are not friends with this person',
      });
    }

    // Get remove index, see if they were buddies in the first place
    const removeIndex = profile.buddies.indexOf(buddyProfile.user);
    if (removeIndex < 0) {
      return res
        .status(400)
        .json({ msg: 'You are not friends with this person' });
    }

    // Remove user from their friends list
    const removeIndex2 = buddyProfile.buddies
      .map((buddy) => buddy.toString())
      .indexOf(req.user.id);
    if (removeIndex > -1) {
      buddyProfile.buddies.splice(removeIndex2, 1);
      await buddyProfile.save();
    }

    // Unfriend the buddy, save & return
    profile.buddies.splice(removeIndex, 1);
    buddyProfile.buddies.splice(removeIndex2, 1);
    await profile.save();
    res.json(profile.buddies);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/profile/buddyRequests
// @desc   Get the profiles of a user's buddy requests
// @access Private
router.get('/buddyRequests', auth, async (req, res) => {
  try {
    // Get the user's profile and check if it exists
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(401).json({ msg: 'You did not make your profile yet' });
    }

    const profiles = await Profile.find({
      user: { $in: profile.requests },
    }).populate('user', ['fullName', 'groupName', 'userName']);

    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/profile/buddyProfiles
// @desc   Get the profiles of a user's buddy buddies
// @access Private
router.get('/buddyProfiles', auth, async (req, res) => {
  try {
    // Get the user's profile and check if it exists
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(401).json({ msg: 'You did not make your profile yet' });
    }
    const profiles = await Profile.find({
      user: { $in: profile.buddies },
    }).populate('user', ['fullName', 'groupName', 'userName']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/profile/buddyProfiles/:id
// @desc   Get the profiles of a user's buddy buddies
// @access Private
router.get('/buddyProfiles/:id', auth, async (req, res) => {
  try {
    // Get the user's profile and check if it exists
    const profile = await Profile.findOne({ user: req.params.id });
    if (!profile) {
      return res.status(401).json({ msg: 'You did not make your profile yet' });
    }
    const profiles = await Profile.find({
      user: { $in: profile.buddies },
    }).populate('user', [
      'fullName',
      'groupName',
      'userName',
      'activityStatus',
    ]);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  PUT api/profile/notes/:profile_id
// @desc   note a person using profile id
// @access Private
router.put('/note/:profile_id', auth, async (req, res) => {
  try {
    // Get the users profile and check if it exists
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(401).json({ msg: 'You did not make your profile yet' });
    }

    // Get their profile and check if their profile exists
    const noteProfile = await Profile.findById(req.params.profile_id).populate(
      'user',
      ['fullName', 'groupName', 'userName']
    );
    if (!noteProfile) {
      return res
        .status(404)
        .json({ msg: 'Cannot add, this profile does not exist' });
    }

    /* Check if people is already noted*/
    let noteIndex = profile.peoplenote
      .map((notepeople) => notepeople.user)
      .indexOf(toUser);
    if (noteIndex > -1) {
      return res.status(401).json({ msg: 'You noted this user' });
    }

    const toUser = noteProfile.user._id;

    const note = {
      user: toUser,
      fullName: noteProfile.user.fullName,
      status: noteProfile.status,
      avatar: noteProfile.avatar,
      remark: req.body.remark,
    };

    // note a person save & return
    // profile.notepeople.unshift(noteProfile.user);
    profile.peoplenote.unshift(note);
    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route  PUT api/profile/unnote/:user_id
//@desc   unnote people using user id
//@access Private
router.delete('/unnote/:user_id', auth, async (req, res) => {
  try {
    // Get the users profile and check if it exists
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(401).json({ msg: 'You did not make your profile yet' });
    }
    const toUser = req.params.user_id;

    /* Check if people is already noted*/
    let noteIndex = profile.peoplenote
      .map((notepeople) => notepeople.user)
      .indexOf(toUser);
    if (noteIndex > -1) {
      return res.status(401).json({ msg: 'You noted this user' });
    }

    //Get remove index
    const removeIndex = profile.peoplenote
      .map((unnote) => unnote.user)
      .indexOf(toUser);

    if (removeIndex < 0) {
      return res
        .status(401)
        .json({ msg: 'This user has not sent a request to you' });
    }

    profile.peoplenote.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

// @route  GET api/profile/notedpeople
// @desc   Get all noted people of user
// @access Private
router.get('/notedpeople', auth, async (req, res) => {
  try {
    // Get the user's profile and check if it exists
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(401).json({ msg: 'You did not make your profile yet' });
    }

    const xyz = profile.peoplenote;

    res.json(xyz);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  PUT api/profile/note/post/:post_id
// @desc   note a post using post id
// @access Private
router.put(
  '/note/post/:post_id',
  auth,
  [check('remark', 'write a note').exists()],
  async (req, res) => {
    try {
      // Get the users profile and check if it exists
      const profile = await Profile.findOne({ user: req.user.id });
      if (!profile) {
        return res
          .status(401)
          .json({ msg: 'You did not make your profile yet' });
      }

      // Get their post and check if their profile exists
      const notePost = await Post.findById(req.params.post_id);
      if (!notePost) {
        return res
          .status(404)
          .json({ msg: 'Cannot add, this post does not exist' });
      }

      const toUser = notePost.user._id;

      /* Check if people is already noted*/
      let noteIndex = profile.postnote
        .map((notepost) => notepost.post)
        .indexOf(req.params.post_id);
      if (noteIndex > -1) {
        return res.status(401).json({ msg: 'You noted this post' });
      }

      const note = {
        user: notePost.user._id,
        post: req.params.post_id,
        fullName: notePost.fullName,
        groupName: notePost.groupName,
        status: notePost.status,
        avatar: notePost.avatar,
        remark: req.body.remark,
      };

      // note a person save & return

      profile.postnote.unshift(note);
      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  PUT api/profile/unnote/post/:post_id
//@desc   unnote post using post id
//@access Private
router.delete('/unnote/post/:post_id', auth, async (req, res) => {
  try {
    // Get the users profile and check if it exists
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(401).json({ msg: 'You did not make your profile yet' });
    }

    const toPost = req.params.post_id;

    /* Check if post is noted*/
    let noteIndex = profile.postnote
      .map((notepost) => notepost.post)
      .indexOf(req.params.post_id);
    if (noteIndex < 0) {
      return res.status(401).json({ msg: 'You already unnoted this post' });
    }

    //Get remove index

    const removeIndex = profile.postnote
      .map((unnote) => unnote.post)
      .indexOf(toPost);

    if (removeIndex < 0) {
      return res
        .status(401)
        .json({ msg: 'This user has not sent a request to you' });
    }

    profile.postnote.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

// @route  GET api/profile/notedpost
// @desc   Get the all noted post of user
// @access Private
router.get('/notedpost', auth, async (req, res) => {
  try {
    // Get the user's profile and check if it exists
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(401).json({ msg: 'You did not make your profile yet' });
    }

    const xyz = profile.postnote;

    res.json(xyz);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/profile/invites
// @desc   Get project invites
// @access Private
router.get('/invites', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res
        .status(404)
        .json({ msg: 'You have not created your profile yet' });
    }

    res.json(profile.invites);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  PUT api/profile/projectrequest/:project_id
// @desc   Send a project request
// @access Private
router.put('/projectrequest/:project_id', auth, async (req, res) => {
  try {
    /* Pull out profile and check if it exists */
    const fromProfile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['fullName', 'groupName', 'userName']);
    if (!fromProfile) {
      return res
        .status(404)
        .json({ msg: 'You have not created a profile yet' });
    }

    const fromUser = await User.findById(fromProfile.user);

    /* Pull out project theyre requesting to and check if it exists */
    const toProject = await Project.findById(req.params.project_id).populate(
      'user',
      ['fullName', 'groupName', 'userName']
    );
    if (!toProject) {
      return res
        .status(404)
        .json({ msg: "The project you're requesting to does not exist" });
    }
    const toUser = toProject.user;

    /* Check if he is member already */
    let ProjectIndex = toProject.members
      .map((member) => member.user)
      .indexOf(req.user.id);
    if (ProjectIndex > -1) {
      return res
        .status(401)
        .json({ msg: 'You are already member of this project' });
    }

    /* Check if the request was sent already */
    let requestIndex = toProject.requests
      .map((e) => e.request)
      .indexOf(req.user.id);
    if (requestIndex > -1) {
      return res
        .status(401)
        .json({ msg: 'You have already sent a project request' });
    }

    const xyz = {
      request: fromProfile._id,
      firstName: fromProfile.user.firstName,
      groupName: fromProfile.user.groupName,
      userName: fromProfile.user.userName,
    };

    /* Send the request */
    toProject.requests.unshift(xyz);
    await toProject.save();

    res.json({
      msg: `Project request successfully sent to ${toProject.projectname}`,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  PUT api/profile/invites/:project_id
// @desc   Accept Project Invite
// @access Private
router.put(
  '/invite/:project_id',
  auth,
  [check('status', 'write a status').exists()],
  async (req, res) => {
    try {
      // Get the users profile and check if it exists
      const profile = await Profile.findOne({
        user: req.user.id,
      }).populate('user', ['fullName', 'groupName', 'userName']);
      if (!profile) {
        return res
          .status(401)
          .json({ msg: 'You did not make your profile yet' });
      }

      // Get project and check if it exists
      const project = await Project.findById(req.params.project_id);
      if (!project) {
        return res
          .status(404)
          .json({ msg: 'Cannot add, project does not exist' });
      }

      // Check if the Project request was sent
      let removeIndex = profile.invites
        .map((e) => e.invite)
        .indexOf(req.params.project_id);

      if (removeIndex < 0) {
        return res
          .status(401)
          .json({ msg: 'They did not send a project request to you' });
      }

      const member = {
        user: profile.user,
        fullName: profile.user.fullName,
        status: req.body.status,
        avatar: profile.avatar,
      };

      const profileProject = {
        project: project._id,
        projectname: project.projectname,
      };

      const profileexp = {
        title: member.status,
        company: project.projectname,
        location: project.location,
        from: project.date,
        description: project.description,
      };

      // Add the new buddy, save & return
      profile.invites.splice(removeIndex, 1);
      profile.projects.unshift(profileProject);
      profile.experience.unshift(profileexp);
      project.members.unshift(member);
      await project.save();
      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route  DELETE api/profile/invite/:project_id
// @desc   Decline a project invite
// @access Private
router.delete('/invite/:project_id', auth, async (req, res) => {
  try {
    /* Pull out the profile and check if it exists */
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res
        .status(404)
        .json({ msg: 'You have not created a profile yet' });
    }

    let removeIndex = profile.invites
      .map((e) => e.invite)
      .indexOf(req.params.project_id);
    if (removeIndex < 0) {
      return res
        .status(401)
        .json({ msg: 'This user has not sent you a project request' });
    }

    /* Remove the request and return */
    profile.invites.splice(removeIndex, 1);
    await profile.save();
    res.json({ msg: 'Project invite is declined' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

//@route  GET api/profile
//@desc   Get all profiles
//@access Public

router.get('/', auth, async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', [
      'fullName',
      'userName',
      'groupName',
    ]);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

router.get('/status', auth, async (req, res) => {
  try {
    await Profile.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: { progressStatus: true },
      }
    );

    res.json({
      message: 'Profile Completed!',
    });
  } catch (error) {
    console.error(error.message);
  }
});

module.exports = router;
