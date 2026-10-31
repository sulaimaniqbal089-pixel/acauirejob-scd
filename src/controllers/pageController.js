// Page Controller: renders HTML views for public and job seeker pages.
const jobModel = require('../models/jobModel');
const profileModel = require('../models/profileModel');
const applicationModel = require('../models/applicationModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { dashboardPathFor, safeNextPath } = require('../utils/paths');
const { readSearchFilters, canSeeJob } = require('./jobController');
const { getAccessibleApplication } = require('./applicationController');
const { ROLES, JOBS_PER_PAGE } = require('../utils/constants');

// ---------- Public ----------
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

const jobDetails = asyncHandler(async (req, res) => {
  const job = await jobModel.findById(req.params.id);
  if (!job || !canSeeJob(job, req.user)) throw new AppError(404, 'We could not find that job.');

  // For job seekers: have they applied already, and is a CV uploaded?
  let existingApplication = null;
  let hasCv = false;
  if (req.user && req.user.role === ROLES.JOB_SEEKER) {
    existingApplication = await applicationModel.findByJobAndSeeker(job.id, req.user.id);
    hasCv = Boolean((await profileModel.getByUserId(req.user.id)).cv_filename);
  }

  res.render('public/job-details', {
    title: `${job.title} at ${job.company_name}`,
    job,
    isOpen: jobModel.isOpen(job),
    existingApplication,
    hasCv,
  });
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

const dashboardRedirect = (req, res) => res.redirect(dashboardPathFor(req.user.role));

const accountSettings = (req, res) => res.render('account/settings', { title: 'Account settings', section: 'settings' });

// ---------- Job seeker ----------
const seekerDashboard = asyncHandler(async (req, res) => {
  const [profile, stats, recentApplications] = await Promise.all([
    profileModel.getByUserId(req.user.id),
    applicationModel.seekerStats(req.user.id),
    applicationModel.listBySeeker(req.user.id, 5),
  ]);

  // Profile completeness: how many of these fields are filled in.
  const checklist = [profile.phone, profile.city, profile.education, profile.experience, profile.skills, profile.summary, profile.cv_filename];
  const completion = Math.round((checklist.filter(Boolean).length / checklist.length) * 100);

  res.render('jobseeker/dashboard', { title: 'Dashboard', section: 'dashboard', profile, stats, recentApplications, completion });
});

const seekerProfile = asyncHandler(async (req, res) => {
  const profile = await profileModel.getByUserId(req.user.id);
  res.render('jobseeker/profile', { title: 'My profile', section: 'profile', profile });
});

const seekerCv = asyncHandler(async (req, res) => {
  const profile = await profileModel.getByUserId(req.user.id);
  res.render('jobseeker/cv', { title: 'My CV', section: 'cv', profile });
});

const seekerApplications = asyncHandler(async (req, res) => {
  const applications = await applicationModel.listBySeeker(req.user.id);
  res.render('jobseeker/applications', { title: 'My applications', section: 'applications', applications });
});

const seekerApplicationDetails = asyncHandler(async (req, res) => {
  const application = await getAccessibleApplication(req);
  res.render('jobseeker/application-details', {
    title: `${application.job_title} application`,
    section: 'applications',
    application,
  });
});

module.exports = {
  home,
  browseJobs,
  jobDetails,
  login,
  register,
  dashboardRedirect,
  accountSettings,
  seekerDashboard,
  seekerProfile,
  seekerCv,
  seekerApplications,
  seekerApplicationDetails,
};
