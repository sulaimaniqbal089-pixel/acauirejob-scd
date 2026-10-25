// Runs on every request and puts the logged-in user in req.user (or null).
// It reads the user from the database each time, so a deactivated account
// is locked out immediately instead of when the session expires.
const asyncHandler = require('../utils/asyncHandler');
const userModel = require('../models/userModel');

module.exports = asyncHandler(async (req, res, next) => {
  req.user = null;
  if (req.session.userId) {
    const user = await userModel.findById(req.session.userId);
    if (user && user.is_active) req.user = user;
    else delete req.session.userId;
  }
  next();
});
