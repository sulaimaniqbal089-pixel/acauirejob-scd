// requireLogin: blocks visitors who are not logged in
// requireRole:  blocks users whose role is not in the allowed list
const AppError = require('../utils/AppError');

const isApiRequest = (req) => req.originalUrl.startsWith('/api/');

function requireLogin(req, res, next) {
  if (req.user) return next();
  if (isApiRequest(req)) return next(new AppError(401, 'Please log in to continue.'));
  return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
}

function requireRole(...roles) {
  return [
    requireLogin,
    (req, res, next) => {
      if (roles.includes(req.user.role)) return next();
      return next(new AppError(403, 'You do not have permission to open this page.'));
    },
  ];
}

module.exports = { requireLogin, requireRole };
