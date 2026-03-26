const db = require("../config/db");

/**
 * Crée une ligne soutenances (statut en_attente) pour chaque étudiant qui n'en a pas.
 * Sinon les nouveaux comptes n'apparaissent pas dans la page Soutenances du responsable.
 */
async function ensureSoutenanceRowsForEtudiants() {
  await db.query(`
    INSERT INTO soutenances (etudiant_id, sujet, statut)
    SELECT u.id, '', 'en_attente'
    FROM users u
    WHERE u.role = 'etudiant'
    AND NOT EXISTS (
      SELECT 1 FROM soutenances s WHERE s.etudiant_id = u.id
    )
  `);
}

module.exports = { ensureSoutenanceRowsForEtudiants };
