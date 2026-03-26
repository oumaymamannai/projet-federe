const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const LOGIN_ROLES = ['etudiant', 'jury', 'admin'];

exports.login = async (req, res) => {
  const { email, password, expectedRole } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Champs requis' });
  if (expectedRole != null && expectedRole !== '' && !LOGIN_ROLES.includes(expectedRole)) {
    return res.status(400).json({ message: 'Rôle de connexion invalide' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({
        message:
          "Ce compte ne correspond pas à l'espace choisi. Sélectionnez le bon rôle (Étudiant, Jury ou Responsable) ou utilisez les identifiants adaptés.",
      });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ token, user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nom, prenom, email, role FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
