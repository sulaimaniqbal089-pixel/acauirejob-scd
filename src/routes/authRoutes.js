// /api/auth
const express = require('express');
const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const controller = require('../controllers/authController');
const { requireLogin } = require('../middleware/authMiddleware');
const AppError = require('../utils/AppError');

const router = express.Router();

// Only failed attempts count: 10 wrong passwords in 15 minutes locks that IP out for a while (relaxed in development).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProduction ? 10 : 500,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => next(new AppError(429, 'Too many failed attempts. Try again in 15 minutes.')),
});

router.post('/register', controller.register);
router.post('/login', loginLimiter, controller.login);
router.post('/logout', controller.logout);
router.post('/change-password', requireLogin, controller.changePassword);

module.exports = router;
