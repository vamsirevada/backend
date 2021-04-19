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
router.post('/:project_id', auth, async (req, res) => {
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
    // console.log(userExist);
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
      link: req.body.link,
      type: req.body.type,
      fullName: user.fullName,
      groupName: user.groupName,
      avatar: user.avatar,
      userName: user.userName,
      user: req.user.id,
      project: req.params.project_id,
    });

    const post = await newProjectPost.save();
    res.json(post);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  GET api/projectpost/:project_id
//@desc   Get  all post of project using project id
//@access Private
router.get('/:project_id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.project_id);

    if (!project) {
      return res.status(400).json({ msg: 'No Such Project exists' });
    }

    const userExist = project.members
      .map((member) => member.user)
      .indexOf(req.user.id);
    // console.log(userExist);
    if (userExist < 0) {
      return res.status(401).json({
        msg:
          'Sorry you cannot post, Only Project Members can post, Kindly contact admin',
      });
    } else {
      const projectpost = await ProjectPost.find({
        project: req.params.project_id,
      });
      if (!projectpost) {
        return res.status(404).json({ msg: 'Post not found' });
      }

      res.json(projectpost);
    }
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    req.status(500).send('Server Error');
  }
});

//@route  GET api/projectpost/user/:project_id
//@desc   Get  user post of project using project id
//@access Private
router.get('/user/:project_id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.project_id);

    if (!project) {
      return res.status(400).json({ msg: 'No Such Project exists' });
    }

    const userExist = project.members
      .map((member) => member.user)
      .indexOf(req.user.id);

    if (userExist < 0) {
      return res.status(401).json({
        msg:
          'Sorry you cannot post, Only Project Members can post, Kindly contact admin',
      });
    } else {
      const projectpost = await ProjectPost.find({
        project: req.params.project_id,
      });
      if (!projectpost) {
        return res.status(404).json({ msg: 'Post not found' });
      }

      const reqUser = await User.findById(req.user.id);

      const reqUserName = reqUser.userName;

      const userprojectpost = projectpost.filter(
        (e) => e.userName === reqUserName
      );

      res.json(userprojectpost);
    }
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    req.status(500).send('Server Error');
  }
});

//@route  GET api/projectpost/single/:post_id
//@desc   Get post by id
//@access Private
router.get('/single/:post_id', auth, async (req, res) => {
  try {
    const projectpost = await ProjectPost.findById(req.params.post_id);
    if (!projectpost) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.json(projectpost);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    req.status(500).send('Server Error');
  }
});

//@route  DELETE api/projectposts/:post_id
//@desc   Delete a post by projectpost id
//@access Private
router.delete('/:post_id', auth, async (req, res) => {
  try {
    const projectpost = await ProjectPost.findById(req.params.post_id);
    if (!projectpost) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    //check user
    // if (post.user.toString() !== req.user.id) {
    //   return res.status(404).json({ msg: 'User not authorised' });
    // }

    await projectpost.remove();

    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    req.status(500).send('Server Error');
  }
});

//@route  PUT api/projectpost/like/:post_id
//@desc   Like a post
//@access Private
router.put('/like/:post_id', auth, async (req, res) => {
  try {
    const projectpost = await ProjectPost.findById(req.params.post_id);

    //Check if the post is alredy been liked
    if (
      projectpost.likes.filter((like) => like.user.toString() === req.user.id)
        .length > 0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }

    const postLikeBody = await User.findById(req.user.id).select('-password');
    const postLikes = {
      user: req.user.id,
      fullName: postLikeBody.fullName,
      avatar: postLikeBody.avatar,
    };
    projectpost.likes.unshift(postLikes);
    await projectpost.save();
    res.json(projectpost.likes);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  PUT api/projectpost/unlike/:post_id
//@desc   Unlike a post
//@access Private
router.put('/unlike/:post_id', auth, async (req, res) => {
  try {
    const projectpost = await ProjectPost.findById(req.params.post_id);

    //Check if the post is alredy been liked
    if (
      projectpost.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }

    //Get remove index
    const removeIndex = projectpost.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    projectpost.likes.splice(removeIndex, 1);

    await projectpost.save();

    res.json(projectpost.likes);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  POST api/projectpost/comment/:post_id
//@desc   Comment a post
//@access Private
router.post(
  '/comment/:post_id',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const projectpost = await ProjectPost.findById(req.params.post_id);

      const newComment = {
        text: req.body.text,
        userName: user.userName,
        avatar: user.avatar,
        user: req.user.id,
        postId: req.params.post_id,
      };

      projectpost.comments.unshift(newComment);

      await projectpost.save();

      res.json(projectpost.comments);
    } catch (err) {
      console.error(err.message);
      req.status(500).send('Server Error');
    }
  }
);

//@route  DELETE api/projectpost/comment/:post_id/:comment_id
//@desc   delete Comment of a post
//@access Private
router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
  try {
    const projectpost = await ProjectPost.findById(req.params.post_id);

    //pull out comment
    const comment = projectpost.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    //Make sure comment exxists
    if (!comment) {
      return res.status(400).json({ msg: 'Comment does not exist' });
    }

    //check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    //Get remove index
    const removeIndex = projectpost.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);

    projectpost.comments.splice(removeIndex, 1);

    await projectpost.save();

    res.json(projectpost.comments);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

module.exports = router;
