const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Déterminer le dossier de destination selon le type d'upload
    let dir = "uploads";
    
    // Si c'est une réclamation, mettre dans un sous-dossier
    if (req.originalUrl.includes('/reclamation') || req.baseUrl?.includes('/reclamation')) {
      dir = path.join("uploads", "reclamations");
    }
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    // Ajouter un préfixe pour identifier le type de fichier
    const prefix = req.originalUrl.includes('/reclamation') ? 'reclamation-' : 'file-';
    cb(null, `${prefix}${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("Type de fichier non autorisé. Types acceptés: PDF, DOC, DOCX, PNG, JPG, JPEG"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Réduire à 5MB pour les réclamations
});

module.exports = upload;