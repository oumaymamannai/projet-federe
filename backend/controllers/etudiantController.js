const db = require("../config/db");
const { ensureSoutenanceRowsForEtudiants } = require("../utils/soutenanceHelpers");
const fs = require('fs');
const path = require('path');

async function syncSoutenanceStatuts() {
  await db.query(`
    UPDATE soutenances 
    SET statut = 'terminee' 
    WHERE statut = 'planifiee' 
      AND date_soutenance IS NOT NULL 
      AND date_soutenance < NOW()
  `);
}

exports.getMaSoutenance = async (req, res) => {
  try {
    await syncSoutenanceStatuts();
    await ensureSoutenanceRowsForEtudiants();
    const [rows] = await db.query(
      `
      SELECT s.*, 
        GROUP_CONCAT(DISTINCT CONCAT(u.prenom,' ',u.nom,'|',sj.role) ORDER BY sj.role SEPARATOR ';;') as jury_info
      FROM soutenances s
      LEFT JOIN soutenance_jury sj ON sj.soutenance_id = s.id
      LEFT JOIN users u ON u.id = sj.jury_id
      WHERE s.etudiant_id = ?
      GROUP BY s.id
      LIMIT 1
    `,
      [req.user.id]
    );
    if (!rows.length) return res.json(null);
    const s = rows[0];
    s.jurys = s.jury_info
      ? s.jury_info.split(";;").map((j) => {
          const [n, r] = j.split("|");
          return { nom: n, role: r };
        })
      : [];
    delete s.jury_info;
    res.json(s);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.soumettreStage = async (req, res) => {
  const {
    nom_etudiant,
    prenom_etudiant,
    email_contact,
    encadreur,
    encadrant_entreprise,
    societe,
    sujet,
    description,
  } = req.body;

  // Vérifier si l'étudiant a déjà soumis
  const [existing] = await db.query(
    "SELECT id FROM stage_soumissions WHERE etudiant_id = ?",
    [req.user.id]
  );
  
  if (existing.length > 0) {
    return res.status(403).json({ 
      message: "Vous avez déjà soumis votre formulaire de stage. Une seule soumission est autorisée." 
    });
  }

  // Gérer plusieurs fichiers
  let fichiers = null;
  if (req.files && req.files.length > 0) {
    fichiers = JSON.stringify(req.files.map((f) => f.filename));
  }

  try {
    await db.query(
      "INSERT INTO stage_soumissions (etudiant_id, nom_etudiant, prenom_etudiant, email_contact, encadreur, encadrant_entreprise, societe, sujet, description, fichiers) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [
        req.user.id,
        nom_etudiant,
        prenom_etudiant,
        email_contact,
        encadreur,
        encadrant_entreprise || null,
        societe,
        sujet,
        description,
        fichiers,
      ]
    );
    res.json({ message: "Formulaire soumis avec succès" });
  } catch (err) {
    console.error("Erreur soumission stage:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getMesSoumissions = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM stage_soumissions WHERE etudiant_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.creerReclamation = async (req, res) => {
  const { type, message } = req.body;
  let piece_jointe = null;
  
  if (req.file) {
    piece_jointe = req.file.filename;
  }
  
  try {
    await db.query(
      "INSERT INTO reclamations (etudiant_id, type, message, piece_jointe) VALUES (?,?,?,?)",
      [req.user.id, type, message, piece_jointe]
    );
    res.json({ message: "Réclamation soumise avec succès" });
  } catch (err) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Erreur création réclamation:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getMesReclamations = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, type, message, piece_jointe, statut, reponse, created_at, reponse_at FROM reclamations WHERE etudiant_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, titre, description, type, created_at, fichier_path FROM documents WHERE publie = TRUE ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.demanderEncadreur = async (req, res) => {
  const { message } = req.body;
  const etudiant_id = req.user.id;

  try {
    const [existing] = await db.query(
      'SELECT id FROM reclamations WHERE etudiant_id = ? AND type = "pas_encadreur" AND statut = "en_attente"',
      [etudiant_id]
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ message: "Vous avez déjà une demande d'encadreur en attente" });
    }

    const [soutenance] = await db.query(
      "SELECT id FROM soutenances WHERE etudiant_id = ?",
      [etudiant_id]
    );

    if (soutenance.length > 0) {
      return res
        .status(400)
        .json({ message: "Vous avez déjà une soutenance planifiée" });
    }

    await db.query(
      'INSERT INTO reclamations (etudiant_id, type, message, statut) VALUES (?, "pas_encadreur", ?, "en_attente")',
      [etudiant_id, message]
    );

    res.json({ message: "Demande d'encadreur envoyée avec succès" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifierStatutEncadreur = async (req, res) => {
  const etudiant_id = req.user.id;

  try {
    const [rows] = await db.query(
      `
      SELECT 
        CASE 
          WHEN s.id IS NOT NULL THEN 
            CASE 
              WHEN s.encadreur_fige THEN 'a_encadreur_fige'
              ELSE 'soutenance_planifiee'
            END
          WHEN r.id IS NOT NULL THEN 'demande_en_cours'
          ELSE 'pas_demande'
        END as statut,
        s.encadreur_fige,
        CONCAT(enc.prenom, ' ', enc.nom) as encadreur_nom,
        r.message as message_demande,
        r.created_at as date_demande
      FROM users u
      LEFT JOIN soutenances s ON u.id = s.etudiant_id
      LEFT JOIN users enc ON s.encadreur_id = enc.id
      LEFT JOIN reclamations r ON u.id = r.etudiant_id AND r.type = 'pas_encadreur' AND r.statut = 'en_attente'
      WHERE u.id = ?
    `,
      [etudiant_id]
    );

    res.json(rows[0] || { statut: "pas_demande" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Vérifier si l'étudiant a déjà soumis un formulaire de stage
exports.aDejaSoumis = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id FROM stage_soumissions WHERE etudiant_id = ? LIMIT 1",
      [req.user.id]
    );
    res.json({ dejaSoumis: rows.length > 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};