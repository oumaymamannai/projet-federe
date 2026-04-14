const express = require('express');
// Importation du module express pour créer un routeur
const router = express.Router();
// Importation du middleware d'authentification
const { verifyToken } = require('../middleware/auth');
// Importation du middleware de gestion des fichiers uploadés
const { uploadMessage } = require('../config/multer');
// Importation du contrôleur de messages
const msgCtrl = require('../controllers/messageController');
// Création du routeur

router.use(verifyToken); // Middleware d'authentification pour toutes les routes de ce routeur

router.get('/conversations', msgCtrl.getConversations); // Route pour récupérer les conversations
router.get('/non-lus', msgCtrl.getNonLus); // Route pour récupérer les messages non lus par l'utilisateur
router.get('/:soutenance_id/non-lus', msgCtrl.getNonLusBySoutenance); // Route pour récupérer les messages non lus par soutenance
router.put('/:soutenance_id/read', msgCtrl.markAsRead); // Route pour marquer les messages comme lus
router.get('/:soutenance_id', msgCtrl.getMessages); // Route pour récupérer les messages par soutenance 
router.post('/:soutenance_id', uploadMessage.single('fichier'), msgCtrl.envoyerMessage);

module.exports = router;