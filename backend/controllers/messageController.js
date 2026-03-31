const db = require('../config/db');

exports.envoyerMessage = async (req, res) => {
  const { soutenance_id } = req.params;
  const { contenu } = req.body;

  if (!contenu || !contenu.trim()) {
    return res.status(400).json({ message: 'Le message est vide' });
  }

  try {
    const [acces] = await db.query(`
      SELECT 1 FROM soutenances s
      LEFT JOIN soutenance_jury sj ON sj.soutenance_id = s.id
      WHERE s.id = ?
        AND (s.etudiant_id = ? OR sj.jury_id = ?)
      LIMIT 1
    `, [soutenance_id, req.user.id, req.user.id]);

    if (!acces.length) {
      return res.status(403).json({ message: 'Accès refusé à cette soutenance' });
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

exports.getMessages = async (req, res) => {
  const { soutenance_id } = req.params;

  try {
    const [acces] = await db.query(`
      SELECT 1 FROM soutenances s
      LEFT JOIN soutenance_jury sj ON sj.soutenance_id = s.id
      WHERE s.id = ?
        AND (s.etudiant_id = ? OR sj.jury_id = ?)
      LIMIT 1
    `, [soutenance_id, req.user.id, req.user.id]);

    if (!acces.length) {
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

    await db.query(`
      UPDATE messages SET lu = 1
      WHERE soutenance_id = ? AND expediteur_id != ? AND lu = 0
    `, [soutenance_id, req.user.id]);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getNonLus = async (req, res) => {
  try {
    const [[{ count }]] = await db.query(`
      SELECT COUNT(*) as count FROM messages m
      LEFT JOIN soutenance_jury sj ON sj.soutenance_id = m.soutenance_id
      LEFT JOIN soutenances s ON s.id = m.soutenance_id
      WHERE m.expediteur_id != ?
        AND m.lu = 0
        AND (sj.jury_id = ? OR s.etudiant_id = ?)
    `, [req.user.id, req.user.id, req.user.id]);

    res.json({ non_lus: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.id as soutenance_id, s.sujet, s.date_soutenance, s.salle,
        u.nom, u.prenom,
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
      LEFT JOIN soutenance_jury sj ON sj.soutenance_id = s.id
      WHERE s.etudiant_id = ? OR sj.jury_id = ?
      GROUP BY s.id
      ORDER BY dernier_message_at DESC
    `, [req.user.id, req.user.id, req.user.id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};