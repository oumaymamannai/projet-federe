// routes/auth.js — Définit les 2 endpoints d'authentification
const express = require('express');
const router = express.Router(); // Crée un routeur Express (mini application pour grouper des routes)
const { login, me } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');// Middleware pour protéger la route /me (seulement accessible aux utilisateurs authentifiés)

router.post('/login', login); // POST /api/auth/login — Route publique pour se connecter et obtenir un token
router.get('/me', verifyToken, me); // GET /api/auth/me — Route protégée pour récupérer les infos de l'utilisateur connecté (token JWT requis)

module.exports = router;// Exporter le routeur pour l'utiliser dans server.js (app.use('/api/auth', require('./routes/auth')))
