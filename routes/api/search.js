const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Profile = require('../../models/Profile');

//@access Public

const postUtils = {};

postUtils.searchPost = async (title) => {
  try {
    let result = [];
    const search = await User.aggregate([
      {
        $match: {
          $or: [
            { userName: { $regex: `${title}`, $options: 's' } },
            { fullName: { $regex: `${title}`, $options: 's' } },
            { groupName: { $regex: `${title}`, $options: 's' } },
          ],
        },
      },
      {
        $project: {
          fullName: 1,
          _id: 1,
        },
      },
    ]);

    if (title) {
      const profiles = await Profile.find({
        user: search.map((i) => i._id),
      }).populate('user', ['fullName', 'userName', 'groupName']);

      result = profiles;
    }
    return result;
  } catch (err) {
    const errorObj = { code: 500, error: 'Internal server error' }; // It can be dynamic
    throw errorObj;
  }
};

router.get('/search', [], async (req, res) => {
  try {
    const { title } = req.query;

    const result = await postUtils.searchPost(title);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.code).json({ error: err.error });
  }
});

module.exports = router;
