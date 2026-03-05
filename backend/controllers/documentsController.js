const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs');

// GET /api/documents
const getDocuments = async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT d.*, u.nom as uploader_nom, u.prenom as uploader_prenom FROM documents d JOIN users u ON d.uploaded_by=u.id';
    const params = [];
    if (type) { query += ' WHERE d.type=?'; params.push(type); }
    query += ' ORDER BY d.created_at DESC';
    const [docs] = await pool.query(query, params);
    res.json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// POST /api/documents
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Fichier requis.' });
    const { titre, description, type } = req.body;
    const [result] = await pool.query(
      'INSERT INTO documents (titre, description, fichier_path, type, uploaded_by) VALUES (?,?,?,?,?)',
      [titre, description || null, req.file.path, type || 'general', req.user.id]
    );
    res.status(201).json({ success: true, message: 'Document uploadé.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// GET /api/documents/:id/download
const downloadDocument = async (req, res) => {
  try {
    const [[doc]] = await pool.query('SELECT * FROM documents WHERE id=?', [req.params.id]);
    if (!doc) return res.status(404).json({ success: false, message: 'Document introuvable.' });

    // Check if published or user authenticated
    if (!doc.publie && !req.user) return res.status(403).json({ success: false, message: 'Accès refusé.' });

    const fileName = path.basename(doc.fichier_path);
    const filePath = path.join(__dirname, '..', 'uploads', fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Fichier introuvable sur le serveur.' });
    }
    res.download(filePath, fileName);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// DELETE /api/documents/:id
const deleteDocument = async (req, res) => {
  try {
    const [[doc]] = await pool.query('SELECT * FROM documents WHERE id=?', [req.params.id]);
    if (!doc) return res.status(404).json({ success: false, message: 'Document introuvable.' });

    const filePath = path.resolve(doc.fichier_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query('DELETE FROM documents WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Document supprimé.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// GET /api/documents/mes-telechargements
const mestelechargements = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.*, tl.downloaded_at
      FROM telechargements_log tl JOIN documents d ON tl.document_id=d.id
      WHERE tl.user_id=? ORDER BY tl.downloaded_at DESC
    `, [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

module.exports = { getDocuments, uploadDocument, downloadDocument, deleteDocument, mestelechargements };
