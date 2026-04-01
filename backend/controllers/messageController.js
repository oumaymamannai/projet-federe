const db = require('../config/db');

/**
 * Vérifie si l'utilisateur est autorisé à accéder à la messagerie d'une soutenance.
 * Seuls l'étudiant concerné et son encadreur sont autorisés.
 */
async function verifierAccesEncadreur(soutenanceId, userId) {
  const [rows] = await db.query(`
    SELECT 
      s.etudiant_id,
      s.encadreur_id,
      sj.jury_id,
      sj.role as jury_role
    FROM soutenances s
    LEFT JOIN soutenance_jury sj 
      ON sj.soutenance_id = s.id 
      AND sj.jury_id = ?
      AND LOWER(sj.role) IN ('encadreur', 'encadrant', 'supervisor')
    WHERE s.id = ?
    LIMIT 1
  `, [userId, soutenanceId]);

  if (!rows.length) return false;

  const row = rows[0];
  const estEtudiant = row.etudiant_id === userId;
  const estEncadreurDirect = row.encadreur_id === userId;
  const estEncadreurViaJury = row.jury_id === userId;

  return estEtudiant || estEncadreurDirect || estEncadreurViaJury;
}

/**
 * Envoyer un message (étudiant ↔ encadreur uniquement)
 */
exports.envoyerMessage = async (req, res) => {
  const { soutenance_id } = req.params;
  const { contenu } = req.body;

  if (!contenu || !contenu.trim()) {
    return res.status(400).json({ message: 'Le message est vide' });
  }

  try {
    const autorise = await verifierAccesEncadreur(soutenance_id, req.user.id);
    if (!autorise) {
      return res.status(403).json({ message: 'Accès refusé : vous n\'êtes pas l\'encadreur ou l\'étudiant de cette soutenance' });
    }

    await db.query(
      'INSERT INTO messages (soutenance_id, expediteur_id, contenu) VALUES (?, ?, ?)',
      [soutenance_id, req.user.id, contenu.trim()]
    );

    res.status(201).json({ message: 'Message envoyé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Récupérer les messages d'une soutenance (étudiant ↔ encadreur uniquement)
 */
exports.getMessages = async (req, res) => {
  const { soutenance_id } = req.params;

  try {
    const autorise = await verifierAccesEncadreur(soutenance_id, req.user.id);
    if (!autorise) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const [messages] = await db.query(`
      SELECT m.id, m.contenu, m.created_at, m.lu,
             u.id as user_id, u.nom, u.prenom, u.role
      FROM messages m
      JOIN users u ON u.id = m.expediteur_id
      WHERE m.soutenance_id = ?
      ORDER BY m.created_at ASC
    `, [soutenance_id]);

    // Marquer comme lus les messages de l'autre partie
    await db.query(`
      UPDATE messages SET lu = 1
      WHERE soutenance_id = ? AND expediteur_id != ? AND lu = 0
    `, [soutenance_id, req.user.id]);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Nombre de messages non lus (uniquement dans les conversations encadreur ↔ étudiant)
 */
exports.getNonLus = async (req, res) => {
  try {
    const [[{ count }]] = await db.query(`
      SELECT COUNT(*) as count
      FROM messages m
      JOIN soutenances s ON s.id = m.soutenance_id
      LEFT JOIN soutenance_jury sj 
        ON sj.soutenance_id = m.soutenance_id
        AND sj.jury_id = ?
        AND LOWER(sj.role) IN ('encadreur', 'encadrant', 'supervisor')
      WHERE m.expediteur_id != ?
        AND m.lu = 0
        AND (
          s.etudiant_id = ?
          OR s.encadreur_id = ?
          OR sj.jury_id = ?
        )
    `, [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]);

    res.json({ non_lus: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Liste des conversations disponibles pour l'utilisateur connecté.
 * - Étudiant : voit uniquement sa conversation avec son encadreur
 * - Encadreur : voit la liste de tous les étudiants qu'il encadre
 * - Président / 3ème membre : ne voit rien (aucune conversation)
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role; // 'etudiant', 'jury', 'admin'

    let rows = [];

    if (role === 'etudiant') {
      // L'étudiant voit uniquement sa soutenance et son encadreur
      [rows] = await db.query(`
        SELECT 
          s.id as soutenance_id,
          s.sujet,
          s.date_soutenance,
          s.salle,
          u.nom,
          u.prenom,
          u.id as interlocuteur_id,
          (
            SELECT contenu FROM messages
            WHERE soutenance_id = s.id
            ORDER BY created_at DESC LIMIT 1
          ) as dernier_message,
          (
            SELECT created_at FROM messages
            WHERE soutenance_id = s.id
            ORDER BY created_at DESC LIMIT 1
          ) as dernier_message_at,
          (
            SELECT COUNT(*) FROM messages
            WHERE soutenance_id = s.id
              AND expediteur_id != ?
              AND lu = 0
          ) as non_lus
        FROM soutenances s
        -- Trouver l'encadreur (priorité à encadreur_id, sinon via soutenance_jury)
        LEFT JOIN users u ON u.id = COALESCE(
          s.encadreur_id,
          (
            SELECT sj2.jury_id FROM soutenance_jury sj2
            WHERE sj2.soutenance_id = s.id
              AND LOWER(sj2.role) IN ('encadreur', 'encadrant', 'supervisor')
            LIMIT 1
          )
        )
        WHERE s.etudiant_id = ?
          AND u.id IS NOT NULL
        ORDER BY dernier_message_at DESC
      `, [userId, userId]);

    } else if (role === 'jury') {
      // L'encadreur voit uniquement les étudiants qu'il encadre
      [rows] = await db.query(`
        SELECT 
          s.id as soutenance_id,
          s.sujet,
          s.date_soutenance,
          s.salle,
          u.nom,
          u.prenom,
          u.id as interlocuteur_id,
          (
            SELECT contenu FROM messages
            WHERE soutenance_id = s.id
            ORDER BY created_at DESC LIMIT 1
          ) as dernier_message,
          (
            SELECT created_at FROM messages
            WHERE soutenance_id = s.id
            ORDER BY created_at DESC LIMIT 1
          ) as dernier_message_at,
          (
            SELECT COUNT(*) FROM messages
            WHERE soutenance_id = s.id
              AND expediteur_id != ?
              AND lu = 0
          ) as non_lus
        FROM soutenances s
        JOIN users u ON u.id = s.etudiant_id
        LEFT JOIN soutenance_jury sj 
          ON sj.soutenance_id = s.id
          AND sj.jury_id = ?
          AND LOWER(sj.role) IN ('encadreur', 'encadrant', 'supervisor')
        WHERE (
          s.encadreur_id = ?
          OR sj.jury_id = ?
        )
        GROUP BY s.id
        ORDER BY dernier_message_at DESC
      `, [userId, userId, userId, userId]);
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};