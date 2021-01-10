const jwt = require("jsonwebtoken");


module.exports = function (req, res, next) {
  //Get token from header
  const writertoken = req.header("x-auth-token");

  //Check if no token
  if (!writertoken) {
    return res.status(401).json({ msg: "No token, authoriztion denied" });
  }
  // console.log(token);
  //verify token
  try {
    const decoded = jwt.verify(writertoken, process.env.JWT_SECRET);

    req.user = decoded.user;
    // console.log(req.user);
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};
