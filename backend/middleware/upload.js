const multer = require("multer");
const path = require("path");
const fs = require("fs");
// ============================================================
// MIDDLEWARE D'UPLOAD DE FICHIERS (Multer)
// Gère l'upload de fichiers pour deux contextes :
 //   -soumission stage etudiants
//   - Documents admin      → uploads/
//   - Pièces jointes réclamations etudiants → uploads/reclamations/
// STRATÉGIE DE STOCKAGE — Disque local
// Détermine dynamiquement le dossier et le nom du fichier
// en fonction de la route appelante.
// ============================================================
// Dossier de destination : détecte automatiquement les réclamations
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Si l'URL contient "reclamation" → sous-dossier reclamations/
    let dir = "uploads";
    
    // Si la requête provient d'une route de réclamation,
    // isoler les fichiers dans un sous-dossier dédié
    if (req.originalUrl.includes('/reclamation') || req.baseUrl?.includes('/reclamation')) {
      dir = path.join("uploads", "reclamations");
    }
    
    // Créer le dossier s'il n'existe pas
    //si quelqu'un supprime le dossier uploads/ manuellement, Multer le recrée automatiquement au prochain upload au lieu de planter.
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  //filename : génère un nom unique pour éviter les collisions
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
  if (allowed.includes(ext)) cb(null, true);// Fichier accepté
  // Fichier rejeté — l'erreur sera capturée par le middleware d'erreur Express
  else cb(new Error("Type de fichier non autorisé. Types acceptés: PDF, DOC, DOCX, PNG, JPG, JPEG"));
};
// INSTANCE MULTER — Assemblage de la configuration complète
//   storage   : stratégie disque définie ci-dessus
//   fileFilter: whitelist des extensions
//   limits    : taille maximale fixée à 5 Mo par fichier
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});
// Exporté et utilisé via upload.single("fichier") dans les routes
module.exports = upload;