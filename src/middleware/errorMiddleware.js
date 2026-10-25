// The last middleware in the chain: every error ends up here.
const AppError = require('../utils/AppError');
const env = require('../config/env');
const { viewLocals } = require('./viewLocals');

function notFound(req, res, next) {
  next(new AppError(404, 'We could not find that page.'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  let status = error.status || 500;
  let message = error.message;
  let errors = error.errors;

  if (error.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = `Your CV must be ${env.maxCvSizeMb} MB or smaller.`;
    errors = { cv: message };
  } else if (error.name === 'MulterError') {
    status = 400;
    errors = { cv: 'Upload one PDF file.' };
  } else if (!error.status) {
    console.error(error); // unexpected bug: log details, show a safe message
    status = 500;
    message = 'Something went wrong on our side. Please try again.';
  }

  if (res.headersSent) return next(error);

  if (req.originalUrl.startsWith('/api/')) {
    return res.status(status).json({ success: false, message, errors });
  }

  // The error may have happened before viewLocals ran, so make sure templates have their variables.
  if (!res.locals.fmt) {
    req.user = req.user || null;
    viewLocals(req, res, () => {});
  }

  const template = status === 404 ? 'public/404' : 'public/error';
  return res.status(status).render(template, { title: status === 404 ? 'Page not found' : 'Something went wrong', status, message });
}

module.exports = { notFound, errorHandler };
