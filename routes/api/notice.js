const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Project = require('../../models/Project');
const Notice = require('../../models/Notice');

//@route  POST api/notice/:project_id
//@desc   Create or update notice
//@access Private

router.post('/:project_id', [auth], async (req, res) => {
  try {
    const project = await Project.findById(req.params.project_id);

    const newNotice = new Notice({
      title: req.body.title,
      noticeImg: req.body.noticeImg,
      deadline: req.body.deadline,
      eligibility: req.body.eligibility,
      venue: req.body.venue,
      description: req.body.description,
      role: req.body.role,
      project: project.id,
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
//@desc   Get all notices by user ID
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

//@route  GET api/notice/single/:notice_id
//@desc   Get notice by Notice ID
//@access Private

router.get('/single/:notice_id', auth, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.notice_id);
    res.json(notice);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Notice Not Found' });
    }
    req.status(500).send('Server Error');
  }
});

//@route  DELETE api/notice/:id
//@desc   Delete notice
//@access Private

router.delete('/:id', auth, async (req, res) => {
  try {
    await Notice.findOneAndDelete(req.params.id);
    res.json({ msg: 'Notice deleted' });
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

module.exports = router;
