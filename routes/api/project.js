const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Project = require('../../models/Project');
const User = require('../../models/User');

//@route  POST api/project
//@desc   Create or update project
//@access Private
router.post(
  '/',
  [auth, [check('projectname', 'Project Name is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newProject = new Project({
        projectname: req.body.projectname,
        location: req.body.location,
        avatar: user.avatar,
        description: req.body.description,
        creator: user.userName,
        user: req.user.id,
      });

      const project = await newProject.save();
      res.json(project);
    } catch (err) {
      console.error(err.message);
      req.status(500).send('Server Error');
    }
  }
);

//@route  GET api/project/:user_id
//@desc   Get all project by user ID
//@access Private

router.get('/:user_id', auth, async (req, res) => {
  try {
    const project = await Project.find({
      user: req.params.user_id,
    }).populate('user', ['fullName', 'groupName', 'userName', 'isGroup']);

    if (!project) return res.status(400).json({ msg: 'Project Not Found' });

    res.json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Project Not Found' });
    }
    req.status(500).send('Server Error');
  }
});
//@route  GET api/project/1/:project_id
//@desc   Get project by Project ID
//@access Private

router.get('/single/:project_id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.project_id);

    if (!project) return res.status(400).json({ msg: 'Project Not Found' });

    res.json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Project Not Found' });
    }
    req.status(500).send('Server Error');
  }
});

//@route  DELETE api/project
//@desc   Delete project
//@access Private

router.delete('/:id', auth, async (req, res) => {
  try {
    // Removes project using project id
    await Project.findOneAndRemove(req.params.id);

    res.json({ msg: 'Project deleted' });
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

module.exports = router;
