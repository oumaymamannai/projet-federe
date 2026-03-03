const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/documentsController');

router.use(protect);

router.get('/', ctrl.getDocuments);
router.get('/mes-telechargements', ctrl.mestelechargements);
router.get('/:id/download', ctrl.downloadDocument);

module.exports = router;
