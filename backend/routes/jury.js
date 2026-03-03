const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/juryController');

router.use(verifyToken, requireRole('jury'));
router.get('/soutenances', ctrl.getMesSoutenances);
router.post('/evaluer/:soutenance_id', ctrl.evaluer);

module.exports = router;
