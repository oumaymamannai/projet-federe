const db = require('../config/db');

exports.getMesSoutenances = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.id, s.sujet, s.date_soutenance, s.salle, s.statut, s.note_finale,
        u.nom, u.prenom, u.email,
        sj.role as mon_role, sj.note as ma_note, sj.remarques as mes_remarques, sj.id as sj_id
      FROM soutenance_jury sj
      JOIN soutenances s ON s.id = sj.soutenance_id
      JOIN users u ON u.id = s.etudiant_id
      WHERE sj.jury_id = ?
      ORDER BY s.date_soutenance ASC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.evaluer = async (req, res) => {
  const { soutenance_id } = req.params;
  const { note, remarques } = req.body;
  try {
    // Check if today is the day of the soutenance
    const [sout] = await db.query('SELECT * FROM soutenances WHERE id = ?', [soutenance_id]);
    if (!sout.length) return res.status(404).json({ message: 'Soutenance non trouvée' });
    
    const soutenanceDate = new Date(sout[0].date_soutenance);
    const today = new Date();
    const sameDay = soutenanceDate.toDateString() === today.toDateString();
    if (!sameDay) return res.status(403).json({ message: "L'évaluation n'est disponible que le jour de la soutenance" });

    // Get jury role
    const [jrow] = await db.query('SELECT * FROM soutenance_jury WHERE soutenance_id = ? AND jury_id = ?', [soutenance_id, req.user.id]);
    if (!jrow.length) return res.status(403).json({ message: 'Vous n\'êtes pas assigné à cette soutenance' });
    
    // Only president can give note
    if (note !== undefined && jrow[0].role !== 'president') {
      return res.status(403).json({ message: 'Seul le président peut saisir la note' });
    }

    const updates = {};
    if (remarques !== undefined) updates.remarques = remarques;
    if (note !== undefined && jrow[0].role === 'president') updates.note = note;
    
    if (Object.keys(updates).length === 0) return res.status(400).json({ message: 'Rien à mettre à jour' });
    
    await db.query('UPDATE soutenance_jury SET ? WHERE soutenance_id = ? AND jury_id = ?', [updates, soutenance_id, req.user.id]);
    
    // If note given by president, update soutenance note_finale and statut
    if (note !== undefined) {
      await db.query('UPDATE soutenances SET note_finale = ?, statut = "terminee" WHERE id = ?', [note, soutenance_id]);
    }
    
    res.json({ message: 'Évaluation enregistrée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
