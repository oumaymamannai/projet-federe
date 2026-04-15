// server.js — Point d'entrée principal de l'API Express
// Rôle : Configurer le serveur, les middlewares, les routes, et démarrer l'écoute
const express = require('express'); 
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./config/db');
const { DEFAULT_DEV_PASSWORD } = require('./config/defaultPassword');
const fs = require('fs');
require('dotenv').config();

const app = express();

// CORS : Permet au frontend de communiquer avec le backend
// origin: true = accepte toutes les origines 
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
// Middleware pour parser le JSON et les données URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Créer automatiquement les dossiers nécessaires s'ils n'existent pas 
const createUploadDirectories = () => {
  const dirs = [
    'uploads',
    'uploads/reclamations',
    'uploads/soumissions',
    'uploads/documents',
    'uploads/messages'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Dossier créé: ${dir}`);
    }
  });
};

// Crée la table messages si elle manque et ajoute colonne piece_jointe si nécessaire
const ensureMessagesTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT NOT NULL AUTO_INCREMENT,
        soutenance_id INT NOT NULL,
        expediteur_id INT NOT NULL,
        contenu TEXT,
        piece_jointe VARCHAR(255),
        lu TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY (soutenance_id),
        KEY (expediteur_id),
        CONSTRAINT messages_soutenance_fk FOREIGN KEY (soutenance_id) REFERENCES soutenances(id) ON DELETE CASCADE,
        CONSTRAINT messages_expediteur_fk FOREIGN KEY (expediteur_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
// Vérifier si la colonne piece_jointe existe déjà (pour éviter les erreurs d'ALTER TABLE)
    const [[col]] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'piece_jointe'`,
      [process.env.DB_NAME]
    );

    if (!col) {
      await db.query('ALTER TABLE messages ADD COLUMN piece_jointe VARCHAR(255) NULL AFTER contenu');
    }
  } catch (err) {
    console.warn('⚠️ Impossible d\'initialiser la table messages:', err.message);
  }
};

// Appeler la fonction au démarrage
createUploadDirectories();

// Servir les fichiers statiques (uploads) avec les bons headers pour l'affichage
// Permet d'ouvrir les PDF/images dans le navigateur au lieu de les télécharger
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    
    // Permettre l'affichage inline pour les fichiers des réclamations
    if (filePath.includes('reclamations')) {
      if (ext === '.pdf') {
        res.setHeader('Content-Disposition', 'inline');   // Afficher dans le navigateur
        res.setHeader('Content-Type', 'application/pdf');
      } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
        res.setHeader('Content-Disposition', 'inline');  // Afficher l'image
      } else {
        res.setHeader('Content-Disposition', 'attachment');  // Télécharger les autres types de fichiers
      }
    } else {
      if (ext === '.pdf') {
        res.setHeader('Content-Disposition', 'inline');
      } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
        res.setHeader('Content-Disposition', 'inline');
      } else {
        res.setHeader('Content-Disposition', 'attachment');
      }
    }
    
    res.setHeader('X-Content-Type-Options', 'nosniff'); //sécurité
  }
}));

// Route pour servir spécifiquement les fichiers des réclamations (optionnel)
app.get('/api/reclamations/fichier/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads/reclamations', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: 'Fichier non trouvé' });
  }
});
//Routes API (toutes commencent par /api/...)
app.use('/api/auth', require('./routes/auth'));  //authentification
app.use('/api/etudiant', require('./routes/etudiant'));  //espace étudiant
app.use('/api/jury', require('./routes/jury'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/documents', require('./routes/documents')); //gestion des documents (soutenance, etc.)
app.use('/api/messages', require('./routes/messageRoutes'));
app.get('/', (req, res) => res.json({ message: 'GradFlow API v1.0' }));// Route de test pour vérifier que le serveur fonctionne

// Middleware de gestion des erreurs (attrape les erreurs des routes précédentes)
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err);
  
  // Gestion spécifique des erreurs multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Le fichier est trop volumineux. Maximum 5MB.' });
  }
  
  if (err.message === 'Type de fichier non autorisé') {
    return res.status(400).json({ message: 'Type de fichier non autorisé. Formats acceptés: PDF, DOC, DOCX, JPG, JPEG, PNG' });
  }
  
  res.status(500).json({ message: err.message || 'Erreur interne du serveur' });
});

// Synchronisation des mots de passe pour les comptes existants
// Permet d'avoir le même mot de passe pour tous les comptes de développement
async function ensurePasswords() {
  try {
    const [rows] = await db.query("SELECT id, password FROM users WHERE role='admin' LIMIT 1");
    if (!rows.length) return;
    const match = await bcrypt.compare(DEFAULT_DEV_PASSWORD, rows[0].password);
    if (match) return;
    console.log(`🔄 Mise à jour des mots de passe (tous les comptes → "${DEFAULT_DEV_PASSWORD}")...`);
    const hash = await bcrypt.hash(DEFAULT_DEV_PASSWORD, 12);
    await db.query('UPDATE users SET password=?', [hash]);
    console.log('✅ Mots de passe synchronisés');
  } catch (err) {
    console.error('⚠️ ensurePasswords:', err.message);
  }
}
// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`✅ GradFlow API running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  await ensureMessagesTable(); // Crée la table messages si besoin
  await ensurePasswords(); // Synchroniser les mots de passe au démarrage pour que tous les comptes aient le même mdp
});
