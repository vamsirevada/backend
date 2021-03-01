const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Project = require('../../models/Project');
const Profile = require('../../models/Profile');
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
//@route  GET api/project/single/:project_id
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

//@route  DELETE api/project/:id
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

// @route  PUT api/project/invites/:profile_id
// @desc   Send a invites
// @access Private
router.put('/invites/:profile_id', auth, async (req, res) => {
  try {
    // Pull out project and check if it exists
    const fromProject = await Project.findOne({ user: req.user.id });
    if (!fromProject) {
      return res
        .status(404)
        .json({ msg: 'You have not created a profile yet' });
    }

    const fromUser = await User.findById(fromProject.user);

    /* Check if its the same person */
    if (fromProject._id.toString() === req.params.profile_id) {
      return res.status(401).json({ msg: 'Lol thats you, what are you doing' });
    }

    /* Pull out profile theyre requesting to and check if it exists */
    const toProfile = await Profile.findById(
      req.params.profile_id
    ).populate('user', ['fullName', 'groupName', 'userName']);
    if (!toProfile) {
      return res
        .status(404)
        .json({ msg: "The user you're requesting to does not exist" });
    }
    const toUser = toProfile.user._id;

    /* Check if toUser is already member */
    let memberIndex = toProfile.projects
      .map((project) => project.toString())
      .indexOf(fromProject._id);
    if (memberIndex > -1) {
      return res.status(401).json({ msg: 'User is already a member' });
    }

    /* Check if the invite was sent already */
    let inviteIndex = toProfile.invites
      .map((invite) => invite.toString())
      .indexOf(req.user.id);
    if (inviteIndex > -1) {
      return res.status(401).json({ msg: 'You have already sent an invite' });
    }

    /* Send the invites */
    toProfile.invites.unshift(req.user.id);
    await toProfile.save();

    res.json({
      msg: `Project Invite successfully sent to ${toProfile.user.userName}`,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/project/p/requests
// @desc   Get project requests
// @access Private
router.get('/p/requests', auth, async (req, res) => {
  try {
    const project = await Project.findOne({ user: req.user.id });
    if (!project) {
      return res.status(404).json({ msg: 'You have not created project yet' });
    }

    res.json(project.requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  PUT api/project/member/:member_id
// @desc   Accept member request using member profiule id
// @access Private
router.put('/member/:member_id', auth, async (req, res) => {
  try {
    // Get the users project and check if it exists
    const project = await Project.findOne({ user: req.user.id });
    if (!project) {
      return res.status(401).json({ msg: 'You did not make your project yet' });
    }

    // Get their profile and check if their profile exists
    const memberProfile = await Profile.findById(req.params.member_id);
    if (!memberProfile) {
      return res
        .status(404)
        .json({ msg: 'Cannot add, their profile does not exist' });
    }

    // Check if the friend request was sent
    let removeIndex = project.requests.indexOf(memberProfile.user);
    if (removeIndex < 0) {
      return res
        .status(401)
        .json({ msg: 'The user did not send a request to you' });
    }

    // Add the new buddy, save & return
    project.requests.splice(removeIndex, 1);
    project.members.unshift(memberProfile.user);
    memberProfile.projects.unshift(project._id);
    await memberProfile.save();
    await project.save();

    res.json(project.members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  DELETE api/project/request/:memprofile_id
// @desc   Decline a member request
// @access Private
router.delete('/request/:memprofile_id', auth, async (req, res) => {
  try {
    /* Pull out the profile and check if it exists */
    const project = await Project.findOne({ user: req.user.id });
    if (!project) {
      return res
        .status(404)
        .json({ msg: 'You have not created a project yet' });
    }

    /* Pull out their profile and get their user */
    const reqProfile = await Profile.findById(req.params.memprofile_id);
    const reqUser = reqProfile.user;

    let removeIndex = project.requests.indexOf(reqUser);
    if (removeIndex < 0) {
      return res
        .status(401)
        .json({ msg: 'This user has not sent a project request' });
    }

    /* Remove the request and return */
    project.requests.splice(removeIndex, 1);
    await project.save();
    res.json({ msg: 'Member request has been declined' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

//@route  DELETE api/project/member/d/:memuser_id
//@desc   Remove member using his user id
//@access Private

router.delete('/member/d/:memuser_id', auth, async (req, res) => {
  try {
    /* Pull out the profile and check if it exists */
    const project = await Project.findOne({ user: req.user.id });
    if (!project) {
      return res
        .status(404)
        .json({ msg: 'You have not created a project yet' });
    }

    let removeIndex = project.members.indexOf(req.params.memuser_id);
    if (removeIndex < 0) {
      return res.status(401).json({ msg: 'This user is not a member' });
    }

    /* Remove the request and return */
    project.members.splice(removeIndex, 1);
    await project.save();
    res.json({ msg: 'Member has been removed' });
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

module.exports = router;
