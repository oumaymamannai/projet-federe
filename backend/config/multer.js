//FICHIER: config/multer.js
//UTILISATION : uniquement uploadMessage pour les pièces jointes des messages (routes/messageRoutes.js)
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// Crée un dossier s'il n'existe pas
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
// --- Stockage messages (dossier : ./uploads/messages) ---
const messagesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.env.UPLOAD_PATH || './uploads', 'messages');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `message_${Date.now()}_${Math.random().toString(36).substring(2, 11)}${ext}`;
    cb(null, name);
  }
});
// Filtre des types de fichiers
const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.zip', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Type de fichier non autorisé'), false);
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10 Mo

const uploadMessage = multer({ storage: messagesStorage, fileFilter, limits: { fileSize: maxSize } });
module.exports = { uploadMessage };
