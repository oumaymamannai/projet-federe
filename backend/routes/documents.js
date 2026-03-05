const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth'); 
const ctrl = require('../controllers/documentsController');
router.use(verifyToken);

router.get('/', ctrl.getDocuments);
router.get('/mes-telechargements', ctrl.mestelechargements);
router.get('/:id/download', ctrl.downloadDocument);

module.exports = router;
