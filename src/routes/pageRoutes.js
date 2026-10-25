// Milestone 1 Page Routes
const express = require('express');
const page = require('../controllers/pageController');

const router = express.Router();

// Public homepage
router.get('/', page.home);

module.exports = router;
