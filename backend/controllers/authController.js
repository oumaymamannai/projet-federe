// authController.js — Logique métier de l'authentification
// Rôle : Vérifier les identifiants, générer un token JWT, et retourner les infos utilisateur
const bcrypt = require('bcryptjs'); // Compare le mot de passe avec le hash stocké en BD
const jwt = require('jsonwebtoken'); // Génère le token signé envoyé au client
const db = require('../config/db'); // Connexion à la base de données
require('dotenv').config(); // Charger les variables d'environnement

const LOGIN_ROLES = ['etudiant', 'jury', 'admin'];
// POST /api/auth/login — Connexion d'un utilisateur
exports.login = async (req, res) => {
   // Récupérer les données envoyées par le frontend
  const { email, password, expectedRole } = req.body;
  const emailNorm = typeof email === 'string' ? email.trim().toLowerCase() : ''; // Normalise pour éviter les doublons de casse
  const pwd = typeof password === 'string' ? password : '';
    // Validation des champs obligatoires
  if (!emailNorm || !pwd) return res.status(400).json({ message: 'Champs requis' });
  // Vérifier que le rôle demandé est valide
  if (expectedRole != null && expectedRole !== '' && !LOGIN_ROLES.includes(expectedRole)) {
    return res.status(400).json({ message: 'Rôle de connexion invalide' });
  }
  try {
    // Chercher l'utilisateur dans la base de données par son email
    const [rows] = await db.query('SELECT * FROM users WHERE LOWER(TRIM(email)) = ?', [emailNorm]);
    if (!rows.length) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    const user = rows[0];
     //Comparer le mot de passe saisi avec le hash stocké en BD
    const valid = await bcrypt.compare(pwd, user.password);
    if (!valid) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    // Vérifier que le rôle correspond à l'espace choisi sur la page de connexion
    if (expectedRole && String(user.role).trim() !== expectedRole) {
      return res.status(403).json({ 
        message:
          "Ce compte ne correspond pas à l'espace choisi. Sélectionnez le bon rôle (Étudiant, Jury ou Responsable) ou utilisez les identifiants adaptés.",
      });
    }
    // Générer un token JWT (valable pour 7 jours, défini dans .env)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    //Retourner le token + les infos de l'utilisateur (sans le mot de passe)
    res.json({ token, user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
//GET /api/auth/me — Récupérer l'utilisateur connecté (après vérification du token)
exports.me = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nom, prenom, email, role FROM users WHERE id = ?', [req.user.id]); // req.user est ajouté par le middleware verifyToken (contenu du token décodé)
    if (!rows.length) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
