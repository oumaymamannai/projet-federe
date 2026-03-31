const express = require('express');
const router = express.Router();
const JuryController = require('../../controllers/JuryController');
const authMiddleware = require('../../middlewares/authMiddleware');

// Appliquer le middleware d'authentification à toutes les routes
router.use(authMiddleware);

// GET /api/admin/jury - Récupérer tous les membres du jury
router.get('/', JuryController.getAllJuryMembers);

// POST /api/admin/jury/contact - Envoyer un email à un membre du jury
router.post('/contact', JuryController.sendEmailToMember);

module.exports = router;