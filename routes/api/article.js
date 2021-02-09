const express = require('express');
const router = express.Router();
const authwriter = require('../../middleware/authwriter');
const Article = require('../../models/Article');

// @route  GET /article
// @desc    gets all article

router.get('/', async (req, res) => {
  try {
    const articles = await Article.find({}).sort({ _id: -1 });
    res.json(articles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  GET /article/:id
// @desc    gets single article

router.get('/:id', async (req, res) => {
  try {
    const article = await Article.find({ _id: req.params.id });
    const data = article[0];
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route POST /article
//@desc  add a article

router.post('/', authwriter, async (req, res) => {
  const { title, author, body, time, imgName } = req.body;

  try {
    const newArticle = new Article({
      title,
      author,
      body,
      time,
      imgName,
    });

    const article = await newArticle.save();
    res.json(article);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route   PUT api/contacts/:id
//@desc    Update contacts
//@access  private
router.put('/:id', authwriter, async (req, res) => {
  const { title, author, body } = req.body;

  //Build COntact object
  const contactFields = {};

  if (title) contactFields.title = title;
  if (author) contactFields.author = author;
  if (body) contactFields.body = body;

  try {
    let post = await Article.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: 'Post not found' });

    post = await Article.findByIdAndUpdate(
      req.params.id,
      { $set: contactFields },
      { new: true }
    );

    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

//@route Delete /article/:id

router.delete('/:id', authwriter, async (req, res) => {
  try {
    let post = await Article.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: 'Contact not found' });

    await Article.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Article removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
