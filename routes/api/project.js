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

      const profile = await Profile.findOne({ user: req.user.id });

      const member = {
        user: req.user.id,
        fullName: user.fullName,
        status: 'Admin',
        avatar: profile.avatar,
      };

      const newProject = new Project({
        projectname: req.body.projectname,
        location: req.body.location,
        avatar: req.body.avatar,
        description: req.body.description,
        creator: user.userName,
        user: req.user.id,
        members: member,
        admin: member,
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
      'members.user': req.params.user_id,
    });

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
    const project = await Project.findById(
      req.params.project_id
    ).populate('user', ['fullName', 'groupName', 'userName']);

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

router.post('/:id/budget', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    const newBudget = {
      text: req.body.text,
      budget: req.body.budget,
    };

    project.projectbudget.unshift(newBudget);

    await project.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

router.get('/:id/budget', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'You have not created project yet' });
    }

    res.json(project.projectbudget);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

router.delete('/:id/budget/:budget_id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res
        .status(404)
        .json({ msg: 'You have not created a project yet' });
    }

    let removeIndex = project.projectbudget
      .map((e) => e._id)
      .indexOf(req.params.budget_id);

    project.projectbudget.splice(removeIndex, 1);
    await project.save();
    res.json({
      msg: 'Budget has been deleted',
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  PUT api/project/invites/:project_id/:profile_id
// @desc   Send a invites using profile id
// @access Private
router.put('/invites/:project_id/:profile_id', auth, async (req, res) => {
  try {
    // Pull out project and check if it exists
    const fromProject = await Project.findById(req.params.project_id);
    if (!fromProject) {
      return res
        .status(404)
        .json({ msg: 'You have not created a project yet' });
    }

    const fromUser = await User.findById(fromProject.user);

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

    /* Check if its the same person */
    if (toUser._id.toString() === req.user.id) {
      return res.status(401).json({ msg: 'Lol thats you, what are you doing' });
    }

    /* Check if toUser is already member */
    let memberIndex = toProfile.projects
      .map((e) => e.project)
      .indexOf(fromProject._id);
    if (memberIndex > -1) {
      return res.status(401).json({ msg: 'User is already a member' });
    }

    /* Check if the invite was sent already */
    let inviteIndex = toProfile.invites
      .map((e) => e.invite)
      .indexOf(req.params.project_id);
    if (inviteIndex > -1) {
      return res.status(401).json({ msg: 'You have already sent an invite' });
    }

    const xyz = {
      invite: fromProject._id,
      projectname: fromProject.projectname,
    };

    /* Send the invites */
    // toProfile.invites.unshift(fromProject._id);
    toProfile.invites.unshift(xyz);
    await toProfile.save();

    res.json({
      msg: `Project Invite successfully sent to ${toProfile.user.userName}`,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  DELETE api/invites/:project_id/:profile_id
// @desc   Cancel Project Invite
// @access Private
router.delete('/invites/:project_id/:profile_id', auth, async (req, res) => {
  try {
    /* Pull out the profile and check if it exists */
    const project = await Project.findById(req.params.project_id);
    if (!project) {
      return res
        .status(404)
        .json({ msg: 'You have not created a project yet' });
    }

    /* Pull out their profile and get their user */
    const reqProfile = await Profile.findById(req.params.profile_id);
    const reqUser = reqProfile.user;

    /* Check if the invite was not sent */
    let inviteIndex = reqProfile.invites
      .map((e) => e.invite)
      .indexOf(req.params.project_id);
    if (inviteIndex < 0) {
      return res.status(401).json({ msg: 'Project Invite not sent' });
    }

    let removeIndex = reqProfile.invites
      .map((e) => e.invite)
      .indexOf(req.params.project_id);
    if (removeIndex < 0) {
      return res
        .status(401)
        .json({ msg: 'This user has not sent a project request' });
    }

    /* Remove the request and return */
    reqProfile.invites.splice(removeIndex, 1);
    await reqProfile.save();
    res.json({ msg: 'Project Invite has been cancelled' });
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

// @route  PUT api/project/member/:project_id/:member_id
// @desc   Accept member request using member profiule id
// @access Private
router.put('/member/:project_id/:member_id', auth, async (req, res) => {
  try {
    // Get the users project and check if it exists
    const project = await Project.findById(req.params.project_id);
    if (!project) {
      return res.status(401).json({ msg: 'You did not make your project yet' });
    }

    // Get their profile and check if their profile exists
    const memberProfile = await Profile.findById(
      req.params.member_id
    ).populate('user', ['fullName', 'groupName', 'userName']);
    if (!memberProfile) {
      return res
        .status(404)
        .json({ msg: 'Cannot add, their profile does not exist' });
    }

    // Check if the friend request was sent
    let removeIndex = project.requests
      .map((e) => e.request)
      .indexOf(memberProfile._id);
    // console.log(memberProfile._id);
    // console.log(removeIndex);
    if (removeIndex < 0) {
      return res
        .status(401)
        .json({ msg: 'The user did not send a request to you' });
    }

    const member = {
      user: memberProfile.user,
      fullName: memberProfile.user.fullName,
      status: req.body.title,
      avatar: memberProfile.avatar,
    };

    // console.log(member);

    const profileProject = {
      project: project._id,
      projectname: project.projectname,
    };

    const profileexp = {
      title: req.body.title,
      company: project.projectname,
      location: project.location,
      from: project.date,
      description: project.description,
    };

    // console.log(profileexp);

    // Add the new buddy, save & return
    project.requests.splice(removeIndex, 1);
    memberProfile.projects.unshift(profileProject);
    memberProfile.experience.unshift(profileexp);
    project.members.unshift(member);
    await memberProfile.save();
    await project.save();

    res.json(project.members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  DELETE api/project/request/:project_id/:memuser_id
// @desc   Decline a member request
// @access Private
router.delete('/request/:project_id/:memuser_id', auth, async (req, res) => {
  try {
    /* Pull out the profile and check if it exists */
    const project = await Project.findById(req.params.project_id);
    if (!project) {
      return res
        .status(404)
        .json({ msg: 'You have not created a project yet' });
    }

    /* Pull out their profile and get their user */
    // const reqProfile = await Profile.findById(req.params.memprofile_id);
    // const reqUser = reqProfile.user;

    let removeIndex = project.requests
      .map((e) => e.request)
      .indexOf(req.params.memuser_id);
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

router.delete('/member/d/:project_id/:memuser_id', auth, async (req, res) => {
  try {
    /* Pull out the profile and check if it exists */
    const project = await Project.findById(req.params.project_id);
    if (!project) {
      return res
        .status(404)
        .json({ msg: 'You have not created a project yet' });
    }

    const profile = await Profile.findOne({ user: req.params.memuser_id });
    if (!profile) {
      return res.status(404).json({ msg: 'No Such profile exists' });
    }

    /* Check if the reqUser admin */
    let adminIndex = project.admin.map((e) => e.user).indexOf(req.user.id);
    if (adminIndex < 0) {
      return res.status(401).json({ msg: 'Youre not authorised' });
    }

    const removeIndex = project.members
      .map((member) => member.user)
      .indexOf(req.params.memuser_id);

    if (removeIndex < 0) {
      return res.status(401).json({ msg: 'This user is not a member' });
    }

    const removeMemberIndex = profile.projects
      .map((e) => e.project)
      .indexOf(req.params.project_id);

    if (removeMemberIndex < 0) {
      return res.status(401).json({ msg: 'This user is not a member' });
    }

    /* Remove the request and return */
    project.members.splice(removeIndex, 1);
    profile.projects.splice(removeMemberIndex, 1);
    await project.save();
    await profile.save();
    res.json(project.members);
    res.json(profile.projects);
    res.json({ msg: 'Member has been removed' });
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  POST api/project/admin/:project_id/:user_id
//@desc   make member admin
//@access Private
router.post('/admin/:project_id/:user_id', auth, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.params.user_id).select('-password');
    if (!user) {
      return res
        .status(404)
        .json({ msg: "The user you're requesting to does not exist" });
    }

    const project = await Project.findById(req.params.project_id);
    if (!project) return res.status(400).json({ msg: 'Project Not Found' });

    /* Check if User is admin */
    let adminIndex = project.admin.map((e) => e.user).indexOf(req.user.id);
    if (adminIndex < 0) {
      return res.status(401).json({ msg: 'Youre not authorised' });
    }

    /* Check if toUser is already member */
    let memberIndex = project.admin
      .map((e) => e.user)
      .indexOf(req.params.user_id);
    if (memberIndex > -1) {
      return res.status(401).json({ msg: 'User is already a admin' });
    }
    const member = {
      user: req.params.user_id,
      fullName: user.fullName,
      status: 'Admin',
      avatar: user.avatar,
    };

    project.admin.unshift(member);
    await project.save();

    // res.json(project.members);
    res.json(project);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  DELETE api/project/admin/d/:project_id/:memuser_id
//@desc   Remove member as admin using his user id
//@access Private

router.delete('/admin/d/:project_id/:memuser_id', auth, async (req, res) => {
  try {
    /* Pull out the profile and check if it exists */
    const project = await Project.findById(req.params.project_id);
    if (!project) {
      return res
        .status(404)
        .json({ msg: 'You have not created a project yet' });
    }

    const profile = await Profile.findOne({ user: req.params.memuser_id });
    if (!profile) {
      return res.status(404).json({ msg: 'No Such profile exists' });
    }

    /* Check if the reqUser admin */
    if (project.user.toString() !== req.user.id.toString()) {
      return res.status(401).json({ msg: 'Youre not authorised' });
    }

    const removeIndex = project.admin
      .map((member) => member.user)
      .indexOf(req.params.memuser_id);

    if (removeIndex < 0) {
      return res.status(401).json({ msg: 'This user is not a admin' });
    }

    /* Remove the request and return */
    project.admin.splice(removeIndex, 1);
    await project.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  POST api/project/moderator/:project_id/:user_id
//@desc   make member moderator
//@access Private
router.post('/moderator/:project_id/:user_id', auth, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.params.user_id).select('-password');
    if (!user) {
      return res
        .status(404)
        .json({ msg: "The user you're requesting to does not exist" });
    }

    const project = await Project.findById(req.params.project_id);
    if (!project) return res.status(400).json({ msg: 'Project Not Found' });

    /* Check if the reqUser admin */
    let adminIndex = project.admin.map((e) => e.user).indexOf(req.user.id);
    if (adminIndex < 0) {
      return res.status(401).json({ msg: 'Youre not authorised' });
    }

    /* Check if toUser is already member */
    let memberIndex = project.moderator
      .map((e) => e.user)
      .indexOf(req.params.user_id);
    if (memberIndex > -1) {
      return res.status(401).json({ msg: 'User is already moderator' });
    }
    const member = {
      user: req.params.user_id,
      fullName: user.fullName,
      status: 'Moderator',
      avatar: user.avatar,
    };

    project.moderator.unshift(member);
    await project.save();

    res.json(project);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  DELETE api/project/moderator/d/:project_id/:memuser_id
//@desc   Remove member as moderator using his user id
//@access Private

router.delete(
  '/moderator/d/:project_id/:memuser_id',
  auth,
  async (req, res) => {
    try {
      /* Pull out the profile and check if it exists */
      const project = await Project.findById(req.params.project_id);
      if (!project) {
        return res
          .status(404)
          .json({ msg: 'You have not created a project yet' });
      }

      const profile = await Profile.findOne({ user: req.params.memuser_id });
      if (!profile) {
        return res.status(404).json({ msg: 'No Such profile exists' });
      }

      /* Check if the reqUser admin */
      let adminIndex = project.admin.map((e) => e.user).indexOf(req.user.id);
      if (adminIndex < 0) {
        return res.status(401).json({ msg: 'Youre not authorised' });
      }

      const removeIndex = project.moderator
        .map((member) => member.user)
        .indexOf(req.params.memuser_id);

      if (removeIndex < 0) {
        return res.status(401).json({ msg: 'This user is not moderator' });
      }

      /* Remove the request and return */
      project.moderator.splice(removeIndex, 1);
      await project.save();
      res.json(project);
    } catch (err) {
      console.error(err.message);
      req.status(500).send('Server Error');
    }
  }
);

module.exports = router;
