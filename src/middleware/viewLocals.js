// Variables every EJS template can use without being passed in.
const constants = require('../utils/constants');
const format = require('../utils/format');
const { isJobOpen } = require('../utils/jobRules');

const ICON = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;

function viewLocals(req, res, next) {
  Object.assign(res.locals, {
    siteName: 'AcquireJobs.pk',
    user: req.user,
    currentPath: req.path,
    c: constants,            // c.CITIES, c.JOB_TYPES, ...
    fmt: format,             // fmt.formatDate(...), fmt.timeAgo(...), ...
    jobIsOpen: isJobOpen, // jobIsOpen(job)
    icon: ICON,              // <%- icon('search') %>
  });
  next();
}

module.exports = { viewLocals };
