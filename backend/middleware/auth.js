// auth.js — Middleware d'authentification et d'autorisation
// Rôle : Vérifier que l'utilisateur est connecté (verifyToken) et qu'il a le bon rôle (requireRole)
const jwt = require('jsonwebtoken');
require('dotenv').config();
//MIDDLEWARE : Vérifier que l'utilisateur est authentifié (token JWT valide)
// Ce middleware est placé sur les routes protégées (ex: /api/etudiant/...)
const verifyToken = (req, res, next) => {
  let token;
  //Récupérer le token depuis le header Authorization 
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
    //Alternative : depuis l'URL (pour les téléchargements de fichiers)
  } else if (req.path.includes('/download') && req.query.token) {
    token = req.query.token;
  }
  //Si pas de token → accès refusé
  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }
  //Vérifier la validité du token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  // Vérifier que le rôle de l'utilisateur (extrait du token) est dans la liste des rôles autorisés
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé' }); // 403 Forbidden : l'utilisateur est authentifié mais n'a pas les droits nécessaires
  }
  next();
};

module.exports = { verifyToken, requireRole };
