const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./config/db');
const { DEFAULT_DEV_PASSWORD } = require('./config/defaultPassword');
const fs = require('fs');
require('dotenv').config();

const app = express();

// CORS : autoriser le front Vite (localhost ou 127.0.0.1, tout port)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Créer les dossiers nécessaires s'ils n'existent pas
const createUploadDirectories = () => {
  const dirs = [
    'uploads',
    'uploads/reclamations',
    'uploads/soumissions',
    'uploads/documents'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Dossier créé: ${dir}`);
    }
  });
};

// Appeler la fonction au démarrage
createUploadDirectories();

// Servir les fichiers statiques avec affichage inline pour PDF/images
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    
    // Permettre l'affichage inline pour les fichiers des réclamations
    if (filePath.includes('reclamations')) {
      if (ext === '.pdf') {
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Content-Type', 'application/pdf');
      } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
        res.setHeader('Content-Disposition', 'inline');
      } else {
        res.setHeader('Content-Disposition', 'attachment');
      }
    } else {
      // Pour les autres fichiers
      if (ext === '.pdf') {
        res.setHeader('Content-Disposition', 'inline');
      } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
        res.setHeader('Content-Disposition', 'inline');
      } else {
        res.setHeader('Content-Disposition', 'attachment');
      }
    }
    
    // Sécurité : empêcher le MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
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

app.use('/api/auth', require('./routes/auth'));
app.use('/api/etudiant', require('./routes/etudiant'));
app.use('/api/jury', require('./routes/jury'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/documents', require('./routes/documents'));
// Après vos autres routes existantes
app.use('/api/messages', require('./routes/messageRoutes'));
app.get('/', (req, res) => res.json({ message: 'GradFlow API v1.0' }));

// Middleware de gestion des erreurs
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


/** Réaligne les mots de passe si le dump SQL a d'anciens hash (sinon connexion impossible). Tous les rôles : mot de passe unique (voir config/defaultPassword.js). */
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`✅ GradFlow API running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  await ensurePasswords();
});
