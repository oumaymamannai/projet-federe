const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./config/db');
const { DEFAULT_DEV_PASSWORD } = require('./config/defaultPassword');
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

// Servir les fichiers statiques avec affichage inline pour PDF/images
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') {
      res.setHeader('Content-Disposition', 'inline');
    } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
      res.setHeader('Content-Disposition', 'inline');
    } else {
      res.setHeader('Content-Disposition', 'attachment');
    }
  }
}));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/etudiant', require('./routes/etudiant'));
app.use('/api/jury', require('./routes/jury'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/documents', require('./routes/documents'));

app.get('/', (req, res) => res.json({ message: 'GradFlow API v1.0' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Erreur interne' });
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
  await ensurePasswords();
});
