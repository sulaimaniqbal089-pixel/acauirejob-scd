// Milestone 1 Page Routes
const express = require('express');
const page = require('../controllers/pageController');

const router = express.Router();

// Public
router.get('/', page.home);
router.get('/jobs', page.browseJobs);
router.get('/login', page.login);
router.get('/register', page.register);

module.exports = router;
