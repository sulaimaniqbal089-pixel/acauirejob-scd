// Where each role lands after logging in.
const { ROLES } = require('./constants');

const DASHBOARD_PATHS = {
  [ROLES.JOB_SEEKER]: '/seeker/dashboard',
  [ROLES.EMPLOYER]: '/employer/dashboard',
  [ROLES.ADMIN]: '/admin/dashboard',
};

const dashboardPathFor = (role) => DASHBOARD_PATHS[role] || '/';

// Only allow redirects inside our own site (stops "open redirect" tricks).
function safeNextPath(next) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

module.exports = { dashboardPathFor, safeNextPath };
