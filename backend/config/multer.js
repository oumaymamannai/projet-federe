const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Storage pour les documents admin
const documentsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = process.env.UPLOAD_DIR || './uploads';
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
    cb(null, name);
  }
});

// Storage pour les formulaires de stage
const stageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.env.UPLOAD_PATH || './uploads', 'stages');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.zip', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Type de fichier non autorisé'), false);
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

const uploadDocument = multer({ storage: documentsStorage, fileFilter, limits: { fileSize: maxSize } });
const uploadStage = multer({ storage: stageStorage, fileFilter, limits: { fileSize: maxSize } });

module.exports = { uploadDocument, uploadStage };
