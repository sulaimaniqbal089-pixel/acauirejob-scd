// /api/applications
const express = require('express');
const controller = require('../controllers/applicationController');
const { requireLogin, requireRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.post('/', requireRole(ROLES.JOB_SEEKER), controller.apply);
router.get('/', requireRole(ROLES.EMPLOYER), controller.listForEmployer);
router.get('/mine', requireRole(ROLES.JOB_SEEKER), controller.listMine);   // above "/:id"

// These three check ownership inside the controller (seeker, owning employer or admin).
router.get('/:id', requireLogin, controller.getOne);
router.get('/:id/cv', requireLogin, controller.downloadCv);
router.patch('/:id/status', requireRole(ROLES.EMPLOYER), controller.updateStatus);

module.exports = router;
