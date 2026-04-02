const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { uploadMessage } = require('../config/multer');
const msgCtrl = require('../controllers/messageController');

router.use(verifyToken);

router.get('/conversations', msgCtrl.getConversations);
router.get('/non-lus', msgCtrl.getNonLus);
router.get('/:soutenance_id', msgCtrl.getMessages);
router.post('/:soutenance_id', uploadMessage.single('fichier'), msgCtrl.envoyerMessage);

module.exports = router;