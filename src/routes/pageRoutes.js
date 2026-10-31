// Page Routes
const express = require('express');
const page = require('../controllers/pageController');
const { requireLogin, requireRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();
const seekerOnly = requireRole(ROLES.JOB_SEEKER);

// Public
router.get('/', page.home);
router.get('/jobs', page.browseJobs);
router.get('/jobs/:id', page.jobDetails);
router.get('/login', page.login);
router.get('/register', page.register);

// Any logged-in user
router.get('/dashboard', requireLogin, page.dashboardRedirect);
router.get('/account/settings', requireLogin, page.accountSettings);

// Job seeker
router.get('/seeker/dashboard', seekerOnly, page.seekerDashboard);
router.get('/seeker/profile', seekerOnly, page.seekerProfile);
router.get('/seeker/cv', seekerOnly, page.seekerCv);
router.get('/seeker/applications', seekerOnly, page.seekerApplications);
router.get('/seeker/applications/:id', seekerOnly, page.seekerApplicationDetails);

module.exports = router;
