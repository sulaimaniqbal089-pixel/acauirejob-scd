// Page Controller: renders public views (homepage, jobs, authentication).
const jobModel = require('../models/jobModel');
const asyncHandler = require('../utils/asyncHandler');
const { dashboardPathFor, safeNextPath } = require('../utils/paths');
const { readSearchFilters } = require('./jobController');
const { ROLES, JOBS_PER_PAGE } = require('../utils/constants');

const home = asyncHandler(async (req, res) => {
  const [latestJobs, cities, openJobCount] = await Promise.all([
    jobModel.latestOpen(6),
    jobModel.openCityCounts(6),
    jobModel.countOpen(),
  ]);
  res.render('public/home', { title: 'Find a job in Pakistan', latestJobs, cities, openJobCount });
});

const browseJobs = asyncHandler(async (req, res) => {
  const filters = readSearchFilters(req.query);
  const { jobs, pagination } = await jobModel.search({ ...filters, perPage: JOBS_PER_PAGE });
  res.render('public/jobs', { title: 'Browse jobs', jobs, pagination, filters });
});

const login = (req, res) => {
  if (req.user) return res.redirect(dashboardPathFor(req.user.role));
  return res.render('auth/login', { title: 'Log in', next: safeNextPath(req.query.next) || '' });
};

const register = (req, res) => {
  if (req.user) return res.redirect(dashboardPathFor(req.user.role));
  const role = req.query.role === ROLES.EMPLOYER ? ROLES.EMPLOYER : ROLES.JOB_SEEKER;
  return res.render('auth/register', { title: 'Create your account', role });
};

module.exports = { home, browseJobs, login, register };
