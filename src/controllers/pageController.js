// Milestone 1 Page Controller: renders public homepage and authentication views.
const { safeNextPath, dashboardPathFor } = require('../utils/paths');
const { ROLES } = require('../utils/constants');

const home = (req, res) => {
  res.render('public/home', {
    title: 'Find a job in Pakistan',
    latestJobs: [],
    cities: [],
    openJobCount: 0,
  });
};

const login = (req, res) => {
  if (req.user) return res.redirect(dashboardPathFor(req.user.role));
  return res.render('auth/login', { title: 'Log in', next: safeNextPath(req.query.next) || '' });
};

const register = (req, res) => {
  if (req.user) return res.redirect(dashboardPathFor(req.user.role));
  const role = req.query.role === ROLES.EMPLOYER ? ROLES.EMPLOYER : ROLES.JOB_SEEKER;
  return res.render('auth/register', { title: 'Create your account', role });
};

module.exports = { home, login, register };
