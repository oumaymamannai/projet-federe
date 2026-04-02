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
      SELECT s.id, 
        COALESCE(NULLIF(s.sujet, ''), ss.sujet) as sujet,
        s.date_soutenance, s.salle, s.statut, s.note_finale,
        u.nom, u.prenom, u.email,
        sj.role as mon_role, sj.note as ma_note, sj.remarques as mes_remarques, sj.id as sj_id
      FROM soutenance_jury sj
      JOIN soutenances s ON s.id = sj.soutenance_id
      JOIN users u ON u.id = s.etudiant_id
      LEFT JOIN stage_soumissions ss ON ss.etudiant_id = u.id
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

exports.getDashboard = async (req, res) => {
  try {
    const juryId = req.user.id;
 
    // 1. Total soutenances assignées à ce jury
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM soutenance_jury WHERE jury_id = ?`,
      [juryId]
    );
 
    // 2. Évaluations terminées (soutenance statut = 'terminee')
    const [[{ terminees }]] = await db.query(
      `SELECT COUNT(*) as terminees
       FROM soutenance_jury sj
       JOIN soutenances s ON s.id = sj.soutenance_id
       WHERE sj.jury_id = ? AND s.statut = 'terminee'`,
      [juryId]
    );
 
    // 3. En attente de remarque (remarques NULL ou vides)
    const [[{ sans_remarque }]] = await db.query(
      `SELECT COUNT(*) as sans_remarque
       FROM soutenance_jury sj
       JOIN soutenances s ON s.id = sj.soutenance_id
       WHERE sj.jury_id = ?
         AND (sj.remarques IS NULL OR sj.remarques = '')
         AND s.statut != 'terminee'`,
      [juryId]
    );
 
    // 4. En attente de note (seulement pour président, note NULL)
    const [[{ sans_note }]] = await db.query(
      `SELECT COUNT(*) as sans_note
       FROM soutenance_jury sj
       JOIN soutenances s ON s.id = sj.soutenance_id
       WHERE sj.jury_id = ?
         AND sj.role = 'president'
         AND sj.note IS NULL
         AND s.statut != 'terminee'`,
      [juryId]
    );
 
    // 5. Soutenances planifiées (à venir)
    const [[{ planifiees }]] = await db.query(
      `SELECT COUNT(*) as planifiees
       FROM soutenance_jury sj
       JOIN soutenances s ON s.id = sj.soutenance_id
       WHERE sj.jury_id = ? AND s.statut = 'planifiee'`,
      [juryId]
    );
 
    // 6. Prochaine soutenance (la plus proche dans le futur)
    const [[prochaine]] = await db.query(
      `SELECT s.date_soutenance, s.salle, s.sujet,
              u.nom, u.prenom, sj.role as mon_role
       FROM soutenance_jury sj
       JOIN soutenances s ON s.id = sj.soutenance_id
       JOIN users u ON u.id = s.etudiant_id
       WHERE sj.jury_id = ?
         AND s.date_soutenance > NOW()
       ORDER BY s.date_soutenance ASC
       LIMIT 1`,
      [juryId]
    );
 
    // 7. Mon rôle principal (le plus fréquent)
    const [roles] = await db.query(
      `SELECT role, COUNT(*) as cnt
       FROM soutenance_jury
       WHERE jury_id = ?
       GROUP BY role
       ORDER BY cnt DESC
       LIMIT 1`,
      [juryId]
    );
 
    // 8. Moyenne des notes données (si président)
    const [[{ moyenne_notes }]] = await db.query(
      `SELECT ROUND(AVG(note), 2) as moyenne_notes
       FROM soutenance_jury
       WHERE jury_id = ? AND note IS NOT NULL`,
      [juryId]
    );
 
    res.json({
      total,
      terminees,
      planifiees,
      sans_remarque,
      sans_note,
      prochaine: prochaine || null,
      mon_role: roles[0]?.role || null,
      moyenne_notes: moyenne_notes || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};