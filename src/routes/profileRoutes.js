// /api/profile (job seekers only)
const express = require('express');
const controller = require('../controllers/profileController');
const { requireRole } = require('../middleware/authMiddleware');
const { uploadCv } = require('../middleware/uploadMiddleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();
router.use(requireRole(ROLES.JOB_SEEKER));

router.get('/', controller.getProfile);
router.put('/', controller.updateProfile);
router.get('/cv', controller.downloadOwnCv);
router.post('/cv', uploadCv, controller.uploadCv);
router.delete('/cv', controller.deleteCv);

module.exports = router;
