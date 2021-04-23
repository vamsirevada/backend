const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route  POST api/posts
//@desc   Create a post
//@access Private
router.post('/', auth, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id).select('-password');

    const profile = await Profile.findOne({ user: req.user.id });

    const newPost = new Post({
      text: req.body.text,
      title: req.body.title,
      url: req.body.url,
      link: req.body.link,
      type: req.body.type,
      fullName: user.fullName,
      groupName: user.groupName,
      avatar: profile.avatar,
      userName: user.userName,
      user: req.user.id,
    });

    const post = await newPost.save();
    res.json(post);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  GET api/posts
//@desc   Get all post
//@access Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', ['fullName', 'groupName', 'userName', 'avatar'])
      .sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  GET api/posts/:id
//@desc   Get post by id
//@access Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('user', [
      'fullName',
      'groupName',
      'userName',
      'avatar',
    ]);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    req.status(500).send('Server Error');
  }
});

//@route  GET api/posts/user/:id
//@desc   Get Own post of user by id
//@access Private
router.get('/user/:id', auth, async (req, res) => {
  try {
    // Get the user's profile and check if it exists
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(401).json({ msg: 'You did not make your profile yet' });
    }
    const posts = await Post.find({ user: { _id: req.user.id } })
      .populate('user', ['fullName', 'groupName', 'userName', 'avatar'])
      .sort({ date: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    req.status(500).send('Server Error');
  }
});

//@route  GET api/posts/all/:id
//@desc   Get all Buddy post by user id
//@access Private
router.get('/all/:id', auth, async (req, res) => {
  try {
    // Get the user's profile and check if it exists
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(401).json({ msg: 'You did not make your profile yet' });
    }
    const posts = await Post.find({
      user: { $in: profile.buddies },
    })
      .populate('user', ['userName', 'fullName', ' groupName', 'avatar'])
      .sort({ date: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    req.status(500).send('Server Error');
  }
});

//@route  DELETE api/posts/:id
//@desc   Delete a post
//@access Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('user', [
      'userName',
      'fullName',
      ' groupName',
      'avatar',
    ]);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    //check user
    if (post.user._id.toString() !== req.user.id) {
      return res.status(404).json({ msg: 'User not authorised' });
    }

    await post.remove();

    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    req.status(500).send('Server Error');
  }
});

router.post('/delete', auth, async (req, res) => {
  try {
    await Post.findOneAndDelete({ url: req.body.url }).populate('user', [
      'userName',
      'fullName',
      ' groupName',
      'avatar',
    ]);
    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.log(err);

    res.status(500).send('Server Error');
  }
});

//@route  PUT api/posts/like/:id
//@desc   Like a post
//@access Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // const displayLBtn = false;
    //Check if the post is alredy been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
      // const displayLBtn = true;
    }

    const postLikeBody = await User.findById(req.user.id).select('-password');
    const postLikes = {
      user: req.user.id,
      fullName: postLikeBody.fullName
        ? postLikeBody.fullName
        : postLikeBody.groupName,
      avatar: postLikeBody.avatar,
      // displayLBtn: displayLBtn,
    };
    post.likes.unshift(postLikes);
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  PUT api/posts/unlike/:id
//@desc   Unlike a post
//@access Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //Check if the post is alredy been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }

    //Get remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

//@route  POST api/posts/comment/:id
//@desc   Comment a post
//@access Private
router.post(
  '/comment/:id',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        userName: user.userName,
        fullName: user.fullName,
        groupName: user.groupName,
        avatar: user.avatar,
        user: req.user.id,
        postId: req.params.id,
      };

      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      req.status(500).send('Server Error');
    }
  }
);

//@route  DELETE api/posts/comment/:id/:comment_id
//@desc   delete Comment of a post
//@access Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //pull out comment
    const comment = post.comments.find(
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
    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

module.exports = router;
