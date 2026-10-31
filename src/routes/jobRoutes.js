// /api/jobs: public search + employer management
const express = require('express');
const controller = require('../controllers/jobController');
const { requireRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();
const employerOnly = requireRole(ROLES.EMPLOYER);

router.get('/', controller.list);                                   // public
router.get('/mine', employerOnly, controller.listMine);             // must stay above "/:id"
router.post('/', employerOnly, controller.create);
router.get('/:id', controller.getOne);                              // public
router.put('/:id', employerOnly, controller.update);
router.patch('/:id/status', employerOnly, controller.setStatus);

module.exports = router;
