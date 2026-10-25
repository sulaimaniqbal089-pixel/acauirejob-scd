// Express 4 does not catch errors from async functions by itself.
// Wrapping a handler with this sends any error to the error middleware.
module.exports = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
