const jwt = require("jsonwebtoken");
const config = require("config");
const key = require("../config/key");

module.exports = function (req, res, next) {
  //Get token from header
  const token = req.header("x-auth-token");

  //Check if no token
  if (!token) {
    return res.status(401).json({ msg: "No token, authoriztion denied" });
  }
  // console.log(token);
  //verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded.user;
    // console.log(req.user);
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};
