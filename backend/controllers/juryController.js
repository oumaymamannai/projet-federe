const db = require('../config/db');

async function syncSoutenanceStatuts() {
  await db.query(`
    UPDATE soutenances 
    SET statut = 'terminee' 
    WHERE statut = 'planifiee' 
      AND date_soutenance IS NOT NULL 
      AND date_soutenance < NOW()
  `);
}

exports.getMesSoutenances = async (req, res) => {
  try {
    await syncSoutenanceStatuts();
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
    const [sout] = await db.query('SELECT * FROM soutenances WHERE id = ?', [soutenance_id]);
    if (!sout.length) return res.status(404).json({ message: 'Soutenance non trouvée' });

    const [jrow] = await db.query('SELECT * FROM soutenance_jury WHERE soutenance_id = ? AND jury_id = ?', [soutenance_id, req.user.id]);
    if (!jrow.length) return res.status(403).json({ message: 'Vous n\'êtes pas assigné à cette soutenance' });
    
    if (note !== undefined && jrow[0].role !== 'president') {
      return res.status(403).json({ message: 'Seul le président peut saisir la note' });
    }

    if (note !== undefined && jrow[0].role === 'president') {
      const now = new Date();
      const soutenanceDate = new Date(sout[0].date_soutenance);
      if (now < soutenanceDate) {
        return res.status(403).json({ message: 'Vous ne pouvez noter qu\'après la date et l\'heure de la soutenance' });
      }
    }

    const updates = {};
    if (remarques !== undefined) updates.remarques = remarques;
    if (note !== undefined && jrow[0].role === 'president') updates.note = note;
    
    if (Object.keys(updates).length === 0) return res.status(400).json({ message: 'Rien à mettre à jour' });
    
    await db.query('UPDATE soutenance_jury SET ? WHERE soutenance_id = ? AND jury_id = ?', [updates, soutenance_id, req.user.id]);
    
    if (note !== undefined) {
      await db.query('UPDATE soutenances SET note_finale = ?, statut = "terminee" WHERE id = ?', [note, soutenance_id]);
    }
    
    res.json({ message: 'Évaluation enregistrée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
