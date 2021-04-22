const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../../middleware/auth');
const Project = require('../../models/Project');
const Notice = require('../../models/Notice');
const Profile = require('../../models/Profile');

//@route  GET api/notice/all
//@desc   Get all notices
//@access Public

router.get('/all', auth, async (req, res) => {
  try {
    const notices = await Notice.find().populate(
      'project',
      'projectname avatar creator'
    );
    res.json(notices);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  POST api/notice/:project_id
//@desc   Create or update notice
//@access Private

router.post('/:project_id', [auth], async (req, res) => {
  try {
    const project = await Project.findById(req.params.project_id);

    const newNotice = new Notice({
      project: project.id,
      title: req.body.title,
      noticeImg: req.body.noticeImg,
      deadline: req.body.deadline,
      eligibility: req.body.eligibility,
      venue: req.body.venue,
      description: req.body.description,
      role: req.body.role,
    });
    project.notices.unshift(newNotice);
    project.save();
    const notice = await newNotice.save();
    res.json(notice);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  GET api/notice/:project_id
//@desc   Get all notices by project ID
//@access Private

router.get('/:project_id', auth, async (req, res) => {
  try {
    const notice = await Notice.find({
      project: req.params.project_id,
    }).populate('project', ['projectname']);
    res.json(notice);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Notices Not Found' });
    }
    req.status(500).send('Server Error');
  }
});

//@route  GET api/notice/
//@desc   Get all notices by user ID
//@access Private

router.get('/', auth, async (req, res) => {
  try {
    const project = await Project.find({
      'members.user': req.user.id,
    });

    if (!project) return res.status(400).json({ msg: 'Project Not Found' });

    const project_id = project.map((val) => val._id);

    const notice = await Notice.find({
      project: {
        $in: project_id,
      },
    }).populate('project', 'projectname');

    res.json(notice);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Notices Not Found' });
    }
    req.status(500).send('Server Error');
  }
});

//@route  GET api/notice/single/:notice_id
//@desc   Get notice by Notice ID
//@access Private

router.get('/single/:notice_id', auth, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.notice_id).populate(
      'project',
      'projectname avatar creator'
    );

    res.json(notice);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Notice Not Found' });
    }
    req.status(500).send('Server Error');
  }
});

// @route PUT api/notice/apply/:id
// @desc Applying for Notice using Notice Id
// @access Private

router.put('/apply/:id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', 'userName');

    if (!profile) {
      return res.status(401).json({ msg: 'You did not make your profile yet' });
    }

    const notice = await Notice.findById(req.params.id).populate(
      'project',
      'creator'
    );

    const creator = notice.project.creator;

    if (creator === profile.user.userName) {
      return res.status(401).json({
        msg: 'You are the creator of this notice',
      });
    }

    let appliedIndex = notice.applied
      .map((x) => x.applicant)
      .indexOf(profile._id);

    if (appliedIndex > -1) {
      return res.status(401).json({ msg: 'You have already applied' });
    }
    notice.applied.unshift(profile);
    await notice.save();
    res.json(notice);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route PUT api/notice/shortlist/:id/:profile_id
// @desc Shortlisting for Notice using Notice Id and Profile Id
// @access Private

router.put('/shortlist/:id/:profile_id', auth, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    const profile = await Profile.findById(req.params.profile_id);

    let removeIndex = notice.applied
      .map((e) => e.applicant)
      .indexOf(profile._id);

    if (removeIndex < 0) {
      return res.status(401).json({ msg: 'This user has not applied' });
    }

    shortlistedId = {
      shorlist: profile._id,
    };

    notice.applied.splice(removeIndex, 1);
    notice.shortlisted.unshift(shortlistedId);
    await notice.save();
    res.json(notice);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route GET api/notice/applied/:id
// @desc Getting Applied members using Notice Id
// @access Private

router.get('/applied/:id', auth, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    const profile_id = notice.applied.map((val) => val._id);

    const profiles = await Profile.find({
      _id: { $in: profile_id },
    });

    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route GET api/notice/shortlisted/:id
// @desc Getting Shortlisted members using Notice Id
// @access Private

router.get('/shortlisted/:id', auth, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    const profile_id = notice.shortlisted.map((val) => val._id);

    const profiles = await Profile.find({
      _id: { $in: profile_id },
    });
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route  DELETE api/notice/:id
//@desc   Delete notice
//@access Private

router.delete('/:id', auth, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ msg: 'Notice not found' });
    }

    await notice.remove();

    res.json({ msg: 'Notice deleted' });
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

module.exports = router;
