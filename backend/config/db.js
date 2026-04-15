// config/db.js — Connexion à la base de données MySQL
// Rôle : Créer un pool de connexions réutilisables pour interagir avec la base de données
const mysql = require('mysql2/promise'); // Version promise = permet d'utiliser async/await
require('dotenv').config(); // Charger les variables d'environnement depuis le fichier .env 
// Un pool garde plusieurs connexions ouvertes plutôt qu'en ouvrir une par requête
const pool = mysql.createPool({
  host: process.env.DB_HOST, 
  user: process.env.DB_USER, 
  password: process.env.DB_PASSWORD, // Ne pas mettre le mot de passe en dur dans le code, mais le stocker dans .env
  database: process.env.DB_NAME, // Nom de la base de données à utiliser(gradFlow)
  waitForConnections: true, // Attendre si aucune connexion n'est disponible au lieu de rejeter la requête
  connectionLimit: 10, // Nombre maximum de connexions simultanées dans le pool
  queueLimit: 0, // Nombre maximum de requêtes en attente (0 = pas de limite)
  timezone: 'local' // Assure que les dates sont stockées et récupérées dans le fuseau horaire local du serveur
});
module.exports = pool; // Exporter le pool pour l'utiliser dans les autres fichiers 
