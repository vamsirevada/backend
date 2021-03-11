const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const Project = require('../../models/Project');
const ProjectPost = require('../../models/ProjectPost');
const User = require('../../models/User');

//@route  POST api/projectpost/:project_id
//@desc   Create a post in project
//@access Private
router.post(
  '/:project_id',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const project = await Project.findById(req.params.project_id);

      if (!project) {
        return res.status(400).json({ msg: 'No Such Project exists' });
      }

      const userExist = project.members
        .map((member) => member.user)
        .indexOf(req.user.id);
      console.log(userExist);
      if (userExist < 0) {
        return res.status(401).json({
          msg:
            'Sorry you cannot post, Only Project Members can post, Kindly contact admin',
        });
      }

      const user = await User.findById(req.user.id).select('-password');

      const newProjectPost = new ProjectPost({
        text: req.body.text,
        title: req.body.title,
        url: req.body.url,
        type: req.body.type,
        fullName: user.fullName,
        groupName: user.groupName,
        userName: user.userName,
        project: req.params.project_id,
      });

      const post = await newProjectPost.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      req.status(500).send('Server Error');
    }
  }
);

module.exports = router;
