// CSRF protection for cookie sessions.
// Every session gets a random token. Pages put it in <meta name="csrf-token">,
// and public/js/api.js sends it back in the "X-CSRF-Token" header on every
// POST / PUT / PATCH / DELETE request. Requests without the right token are rejected.
const crypto = require('crypto');
const AppError = require('../utils/AppError');

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

function newToken() {
  return crypto.randomBytes(24).toString('hex');
}

function tokensMatch(sent, expected) {
  if (!sent || !expected) return false;
  const a = Buffer.from(String(sent));
  const b = Buffer.from(String(expected));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function csrfProtection(req, res, next) {
  if (!req.session.csrfToken) req.session.csrfToken = newToken();
  res.locals.csrfToken = req.session.csrfToken;

  if (SAFE_METHODS.includes(req.method)) return next();

  if (!tokensMatch(req.get('x-csrf-token'), req.session.csrfToken)) {
    return next(new AppError(403, 'Your session has expired. Refresh the page and try again.'));
  }
  next();
}

module.exports = { csrfProtection, newToken };
