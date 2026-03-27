const bcrypt = require("bcryptjs");
const db = require("../config/db");
const {
  sendResultatEmail,
  sendReclamationReponse,
} = require("../config/email");
const { DEFAULT_DEV_PASSWORD } = require("../config/defaultPassword");
const { ensureSoutenanceRowsForEtudiants } = require("../utils/soutenanceHelpers");

async function syncSoutenanceStatuts() {
  await db.query(`
    UPDATE soutenances 
    SET statut = 'terminee' 
    WHERE statut = 'planifiee' 
      AND date_soutenance IS NOT NULL 
      AND date_soutenance < NOW()
  `);
}

exports.getDashboard = async (req, res) => {
  try {
    await syncSoutenanceStatuts();
    await ensureSoutenanceRowsForEtudiants();
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) as total FROM soutenances"
    );
    const [[{ planifiees }]] = await db.query(
      'SELECT COUNT(*) as planifiees FROM soutenances WHERE statut="planifiee"'
    );
    const [[{ en_attente }]] = await db.query(
      'SELECT COUNT(*) as en_attente FROM soutenances WHERE statut="en_attente"'
    );
    const [[{ terminees }]] = await db.query(
      'SELECT COUNT(*) as terminees FROM soutenances WHERE statut="terminee"'
    );
    const [[{ taux }]] = await db.query(
      'SELECT ROUND(AVG(CASE WHEN note_finale >= 10 THEN 100 ELSE 0 END),1) as taux FROM soutenances WHERE statut="terminee"'
    );
    const [[{ reclamations }]] = await db.query(
      'SELECT COUNT(*) as reclamations FROM reclamations WHERE statut="en_attente"'
    );
    const [[{ docs }]] = await db.query(
      "SELECT COUNT(*) as docs FROM documents WHERE publie=TRUE"
    );
    const [notes] = await db.query(
      'SELECT note_finale, CONCAT(u.prenom," ",u.nom) as etudiant FROM soutenances s JOIN users u ON u.id=s.etudiant_id WHERE s.note_finale IS NOT NULL'
    );
    const [[{ moy }]] = await db.query(
      "SELECT ROUND(AVG(note_finale),2) as moy FROM soutenances WHERE note_finale IS NOT NULL"
    );

    const [repartition] = await db.query(`
      SELECT 
        SUM(CASE WHEN note_finale < 10 THEN 1 ELSE 0 END) as moins_10,
        SUM(CASE WHEN note_finale >= 10 AND note_finale < 12 THEN 1 ELSE 0 END) as entre_10_12,
        SUM(CASE WHEN note_finale >= 12 AND note_finale < 14 THEN 1 ELSE 0 END) as entre_12_14,
        SUM(CASE WHEN note_finale >= 14 AND note_finale < 16 THEN 1 ELSE 0 END) as entre_14_16,
        SUM(CASE WHEN note_finale >= 16 THEN 1 ELSE 0 END) as plus_16
      FROM soutenances WHERE note_finale IS NOT NULL
    `);

    const notesRepartition = repartition[0] || {};

    res.json({
      total,
      planifiees,
      en_attente,
      terminees,
      taux: taux || 0,
      reclamations,
      docs,
      notes,
      moy,
      notesRepartition: {
        moins_10: Number(notesRepartition.moins_10) || 0,
        entre_10_12: Number(notesRepartition.entre_10_12) || 0,
        entre_12_14: Number(notesRepartition.entre_12_14) || 0,
        entre_14_16: Number(notesRepartition.entre_14_16) || 0,
        plus_16: Number(notesRepartition.plus_16) || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSoutenances = async (req, res) => {
  try {
    await syncSoutenanceStatuts();
    const [rows] = await db.query(`
      SELECT s.*, 
             CONCAT(u.prenom,' ',u.nom) as etudiant_nom, 
             u.email as etudiant_email,
             ss.statut as soumission_statut,
             GROUP_CONCAT(DISTINCT CONCAT(uj.id, '::', uj.prenom, ' ', uj.nom, '|', sj.role) ORDER BY sj.role SEPARATOR ';;') as jury_info
      FROM soutenances s
      JOIN users u ON u.id = s.etudiant_id
      LEFT JOIN stage_soumissions ss ON ss.etudiant_id = u.id
      LEFT JOIN soutenance_jury sj ON sj.soutenance_id = s.id
      LEFT JOIN users uj ON uj.id = sj.jury_id
      GROUP BY s.id
      ORDER BY s.date_soutenance ASC
    `);
    
    rows.forEach((r) => {
      r.jurys = r.jury_info
        ? r.jury_info.split(";;").map((j) => {
            const [left, role] = j.split("|");
            const [idStr, name] = left.split("::");
            const id = parseInt(idStr, 10);
            return { id, nom: name, role };
          })
        : [];
      delete r.jury_info;
      
      // Déterminer si le jury est verrouillé
      // Verrouillé si : soumission_statut != 'traite' (pas encore validée)
      r.jury_verrouille = !r.soumission_statut || r.soumission_statut !== 'traite';
    });
    
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getJuryMembers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, nom, prenom, email
      FROM users
      WHERE role = 'jury' OR (role = 'admin' AND email != 'admin@gradflow.dz')
      ORDER BY nom, prenom
    `);
    res.json(rows);
  } catch (err) {
    console.error("ERREUR getJuryMembers:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.affecterJury = async (req, res) => {
  const { soutenance_id } = req.params;
  const { encadreur_id, president_id, membre3_id } = req.body;
  try {
    // If encadreur_id is provided, replace whole jury (including encadreur).
    // If not provided, keep existing encadreur and only (re)assign president and 3eme_membre.
    if (encadreur_id) {
      await db.query("DELETE FROM soutenance_jury WHERE soutenance_id = ?", [soutenance_id]);
    } else {
      await db.query(
        "DELETE FROM soutenance_jury WHERE soutenance_id = ? AND role IN ('president','3eme_membre')",
        [soutenance_id]
      );
    }

    const inserts = [];
    if (encadreur_id) inserts.push([soutenance_id, encadreur_id, "encadreur"]);
    if (president_id) inserts.push([soutenance_id, president_id, "president"]);
    if (membre3_id) inserts.push([soutenance_id, membre3_id, "3eme_membre"]);
    for (const row of inserts) {
      await db.query(
        "INSERT INTO soutenance_jury (soutenance_id, jury_id, role) VALUES (?,?,?)",
        row
      );
    }
    res.json({ message: "Jury affecté avec succès" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// À AJOUTER à la fin de adminController.js
// Pour quand un étudiant n'a pas d'encadreur (via réclamation)
exports.traiterReclamationAvecJury = async (req, res) => {
  const {
    reclamation_id,
    etudiant_id,
    sujet,
    encadreur_id,
    president_id,
    membre3_id,
    reponse,
  } = req.body;

  try {
    // 1. Marquer la réclamation comme traitée
    await db.query(
      'UPDATE reclamations SET statut = "traitee", reponse = ?, reponse_at = NOW() WHERE id = ?',
      [reponse, reclamation_id]
    );

    // 2. Créer la soutenance
    const [result] = await db.query(
      'INSERT INTO soutenances (etudiant_id, sujet, encadreur_id, encadreur_fige, statut) VALUES (?, ?, ?, false, "planifiee")',
      [etudiant_id, sujet, encadreur_id]
    );
    const soutenance_id = result.insertId;

    // 3. Ajouter tous les membres du jury
    await db.query(
      'INSERT INTO soutenance_jury (soutenance_id, jury_id, role) VALUES (?, ?, "encadreur")',
      [soutenance_id, encadreur_id]
    );
    await db.query(
      'INSERT INTO soutenance_jury (soutenance_id, jury_id, role) VALUES (?, ?, "president")',
      [soutenance_id, president_id]
    );
    await db.query(
      'INSERT INTO soutenance_jury (soutenance_id, jury_id, role) VALUES (?, ?, "3eme_membre")',
      [soutenance_id, membre3_id]
    );

    res.json({ message: "Jury complet affecté avec succès" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Pour quand un étudiant a déjà un encadreur (figé)
exports.completerJury = async (req, res) => {
  const { soutenance_id, president_id, membre3_id } = req.body;

  try {
    // Vérifier que l'encadreur est bien figé
    const [soutenance] = await db.query(
      "SELECT encadreur_fige FROM soutenances WHERE id = ?",
      [soutenance_id]
    );

    if (!soutenance.length || !soutenance[0].encadreur_fige) {
      return res.status(400).json({ message: "L'encadreur n'est pas figé" });
    }

    // Ajouter président et 3ème membre
    if (president_id) {
      await db.query(
        'INSERT INTO soutenance_jury (soutenance_id, jury_id, role) VALUES (?, ?, "president")',
        [soutenance_id, president_id]
      );
    }
    if (membre3_id) {
      await db.query(
        'INSERT INTO soutenance_jury (soutenance_id, jury_id, role) VALUES (?, ?, "3eme_membre")',
        [soutenance_id, membre3_id]
      );
    }

    res.json({ message: "Jury complété avec succès" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// 3. Obtenir la liste des soutenances à compléter
exports.getSoutenancesACompleter = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.id, 
             CONCAT(e.prenom, ' ', e.nom) as etudiant_nom,
             s.sujet,
             CONCAT(enc.prenom, ' ', enc.nom) as encadreur_nom,
             (SELECT COUNT(*) FROM soutenance_jury WHERE soutenance_id = s.id) as nb_jurys_assignes
      FROM soutenances s
      JOIN users e ON s.etudiant_id = e.id
      LEFT JOIN users enc ON s.encadreur_id = enc.id
      WHERE s.encadreur_fige = TRUE
      HAVING nb_jurys_assignes = 1
      ORDER BY s.date_soutenance ASC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.setPeriode = async (req, res) => {
  const { date_debut, date_fin, salles } = req.body;
  try {
    await db.query(
      "INSERT INTO periode_soutenances (date_debut, date_fin, salles) VALUES (?,?,?)",
      [
        date_debut,
        date_fin,
        JSON.stringify(salles || ["Salle A101", "Salle B203", "Amphi 1"]),
      ]
    );
    res.json({ message: "Période définie" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.affecterDatesAuto = async (req, res) => {
  try {
    const [[periode]] = await db.query(
      "SELECT * FROM periode_soutenances ORDER BY id DESC LIMIT 1"
    );
    if (!periode)
      return res.status(400).json({ message: "Aucune période définie" });

    const salles = periode.salles;
    const heures = ["08:30", "10:00", "11:30", "14:00"];
    const startDate = new Date(periode.date_debut);
    const endDate = new Date(periode.date_fin);
    
    // MODIFICATION ICI : Récupérer les étudiants avec soutenance en attente OU sans soutenance
    const [students] = await db.query(`
      SELECT u.id as etudiant_id, s.id as soutenance_id
      FROM users u
      LEFT JOIN soutenances s ON u.id = s.etudiant_id
      WHERE u.role = 'etudiant' 
        AND (
          s.id IS NULL 
          OR (s.statut = 'en_attente' AND s.date_soutenance IS NULL)
        )
    `);

    if (students.length === 0) {
      return res.json({ message: "Aucun étudiant à affecter" });
    }

    let affectedCount = 0;
    let studentIndex = 0;
    let current = new Date(startDate);
    let salleRotationIndex = 0;
    
    while (studentIndex < students.length && current <= endDate) {
      // Exclure les weekends
      if (current.getDay() === 0 || current.getDay() === 6) {
        current.setDate(current.getDate() + 1);
        continue;
      }
      
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Récupérer les soutenances déjà existantes pour ce jour
      const [existingForDay] = await db.query(
        `SELECT date_soutenance, salle FROM soutenances 
         WHERE DATE(date_soutenance) = ? 
         AND statut != 'annulee'`,
        [dateStr]
      );
      
      // Créneaux déjà utilisés
      const existingTimes = new Set();
      const existingSallesByTime = {};
      
      existingForDay.forEach(s => {
        let timeStr;
        if (s.date_soutenance instanceof Date) {
          const hours = String(s.date_soutenance.getHours()).padStart(2, '0');
          const minutes = String(s.date_soutenance.getMinutes()).padStart(2, '0');
          timeStr = `${hours}:${minutes}`;
        } else {
          timeStr = s.date_soutenance.split(' ')[1]?.substring(0, 5) || s.date_soutenance.substring(11, 16);
        }
        
        existingTimes.add(timeStr);
        if (!existingSallesByTime[timeStr]) {
          existingSallesByTime[timeStr] = [];
        }
        existingSallesByTime[timeStr].push(s.salle);
      });
      
      // Si tous les 4 créneaux sont déjà pris, passer au jour suivant
      if (existingTimes.size >= heures.length) {
        current.setDate(current.getDate() + 1);
        continue;
      }
      
      // Parcourir les créneaux horaires du jour
      for (let heureIndex = 0; heureIndex < heures.length; heureIndex++) {
        if (studentIndex >= students.length) break;
        
        const heure = heures[heureIndex];
        const timeSlot = heure;
        
        if (existingTimes.has(timeSlot)) {
          continue;
        }
        
        const dateTimeStr = `${dateStr} ${heure}:00`;
        
        let salleDisponible = null;
        const sallesOccupees = existingSallesByTime[timeSlot] || [];
        
        for (let i = 0; i < salles.length; i++) {
          const salleIndex = (salleRotationIndex + i) % salles.length;
          const salle = salles[salleIndex];
          if (!sallesOccupees.includes(salle)) {
            salleDisponible = salle;
            salleRotationIndex = (salleIndex + 1) % salles.length;
            break;
          }
        }
        
        if (!salleDisponible) {
          continue;
        }
        
        const st = students[studentIndex];
        
        // MODIFICATION ICI : UPDATE si la soutenance existe déjà, INSERT sinon
        if (st.soutenance_id) {
          // Mettre à jour la soutenance existante
          await db.query(
            'UPDATE soutenances SET date_soutenance=?, salle=?, statut="planifiee" WHERE id=?',
            [dateTimeStr, salleDisponible, st.soutenance_id]
          );
        } else {
          // Créer une nouvelle soutenance
          await db.query(
            'INSERT INTO soutenances (etudiant_id, sujet, date_soutenance, salle, statut) VALUES (?, "", ?, ?, "planifiee")',
            [st.etudiant_id, dateTimeStr, salleDisponible]
          );
        }
        
        affectedCount++;
        studentIndex++;
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    res.json({ 
      message: `${affectedCount} étudiants affectés`,
      details: {
        etudiants_affectes: affectedCount,
        etudiants_restants: students.length - affectedCount,
        periode: `${periode.date_debut} au ${periode.date_fin}`
      }
    });
  } catch (err) {
    console.error("Erreur affecterDatesAuto:", err);
    res.status(500).json({ message: err.message });
  }
};
exports.getReclamations = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, CONCAT(u.prenom,' ',u.nom) as etudiant_nom, u.email as etudiant_email
      FROM reclamations r 
      JOIN users u ON u.id = r.etudiant_id
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.repondreReclamation = async (req, res) => {
  const { id } = req.params;
  const { reponse, affecter_encadreur, encadreur_id, nouvelle_date, nouvelle_salle } = req.body;

  try {
    const [rows] = await db.query(
      `SELECT r.*, u.email, u.nom, u.prenom, u.id as etudiant_id FROM reclamations r JOIN users u ON u.id=r.etudiant_id WHERE r.id=?`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ message: "Non trouvée" });

    const reclamation = rows[0];

    await db.query("START TRANSACTION");

    await db.query(
      'UPDATE reclamations SET reponse=?, statut="traitee", reponse_at=NOW() WHERE id=?',
      [reponse, id]
    );

    if (nouvelle_date) {
      await db.query(
        'UPDATE soutenances SET date_soutenance=?, salle=COALESCE(?, salle), statut="planifiee" WHERE etudiant_id=?',
        [nouvelle_date, nouvelle_salle || null, reclamation.etudiant_id]
      );
    }

    if (affecter_encadreur && encadreur_id) {
      const [sout] = await db.query(
        "SELECT id FROM soutenances WHERE etudiant_id = ?",
        [reclamation.etudiant_id]
      );

      if (sout.length > 0) {
        const soutenance_id = sout[0].id;

        await db.query(
          'INSERT INTO soutenance_jury (soutenance_id, jury_id, role) VALUES (?, ?, "encadreur")',
          [soutenance_id, encadreur_id]
        );

        await db.query(
          "UPDATE soutenances SET encadreur_fige = TRUE WHERE id = ?",
          [soutenance_id]
        );
      }
    }

    await db.query("COMMIT");

    res.json({ message: "Réponse envoyée" });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Erreur répondre réclamation:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.envoyerResultats = async (req, res) => {
  const { soutenance_id } = req.params;
  try {
    const [sout] = await db.query(
      `SELECT s.*, u.nom, u.prenom, u.email FROM soutenances s JOIN users u ON u.id=s.etudiant_id WHERE s.id=?`,
      [soutenance_id]
    );
    if (!sout.length) return res.status(404).json({ message: "Non trouvée" });
    const [jurys] = await db.query(
      `SELECT uj.nom, uj.prenom, sj.role, sj.note, sj.remarques FROM soutenance_jury sj JOIN users uj ON uj.id=sj.jury_id WHERE sj.soutenance_id=?`,
      [soutenance_id]
    );
    await sendResultatEmail(sout[0].email, sout[0], sout[0], jurys);
    res.json({ message: "Email envoyé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadDocument = async (req, res) => {
  const { titre, description, type, publie } = req.body;
  const fichier_path = req.file ? req.file.filename : null;
  if (!fichier_path) return res.status(400).json({ message: "Fichier requis" });
  try {
    await db.query(
      "INSERT INTO documents (titre, description, type, publie, uploaded_by, fichier_path) VALUES (?,?,?,?,?,?)",
      [
        titre,
        description,
        type || "general",
        publie === "true" || publie === true,
        req.user.id,
        fichier_path,
      ]
    );
    res.json({ message: "Document uploadé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT d.*, CONCAT(u.prenom," ",u.nom) as uploaded_by_nom FROM documents d LEFT JOIN users u ON u.id=d.uploaded_by ORDER BY d.created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleDocumentPublie = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("UPDATE documents SET publie = NOT publie WHERE id = ?", [
      id,
    ]);
    res.json({ message: "Statut mis à jour" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSoumissions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ss.*, CONCAT(u.prenom,' ',u.nom) as etudiant_nom FROM stage_soumissions ss JOIN users u ON u.id=ss.etudiant_id ORDER BY ss.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEtudiants = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.nom, u.prenom, u.email, s.id as soutenance_id, s.statut, s.date_soutenance, s.sujet FROM users u LEFT JOIN soutenances s ON s.etudiant_id=u.id WHERE u.role='etudiant'`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.creerSoutenance = async (req, res) => {
  const { etudiant_id } = req.body; // ← PLUS de sujet !
  try {
    await db.query(
      "INSERT INTO soutenances (etudiant_id, sujet, statut) VALUES (?, '', 'en_attente')",
      [etudiant_id]
    );
    res.json({ message: "Soutenance créée sans sujet" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Nouvelle fonction : Valider une soumission et ajouter le sujet à la soutenance et lencadreur
exports.validerSoumission = async (req, res) => {
  const { soumission_id } = req.params;

  try {
    const [soumissions] = await db.query(
      "SELECT * FROM stage_soumissions WHERE id = ?",
      [soumission_id]
    );

    const soumission = soumissions[0];

    // 1. Mettre à jour la soutenance avec le sujet
    await db.query("UPDATE soutenances SET sujet = ? WHERE etudiant_id = ?", [
      soumission.sujet,
      soumission.etudiant_id,
    ]);

    // 2. Récupérer l'ID de la soutenance
    const [sout] = await db.query(
      "SELECT id FROM soutenances WHERE etudiant_id = ?",
      [soumission.etudiant_id]
    );

    let encadreur_id = null;

    if (sout.length > 0) {
      const soutenance_id = sout[0].id;

      // 3. Vérifier si l'encadreur a été renseigné (non vide)
      if (soumission.encadreur && soumission.encadreur.trim() !== "") {
        // Chercher l'encadreur dans la table users
        const [encadreur] = await db.query(
          'SELECT id FROM users WHERE CONCAT(prenom, " ", nom) = ? OR CONCAT(nom, " ", prenom) = ?',
          [soumission.encadreur, soumission.encadreur]
        );

        // 4. Si l'encadreur n'existe pas, le créer
        if (encadreur.length === 0) {
          const [prenom, ...nomParts] = soumission.encadreur.split(" ");
          const nom = nomParts.join(" ") || prenom;

          const [result] = await db.query(
            'INSERT INTO users (nom, prenom, email, password, role) VALUES (?, ?, ?, ?, "jury")',
            [
              nom,
              prenom,
              `${prenom.toLowerCase()}.${nom.toLowerCase()}@gradflow.dz`,
              "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p396omMpEcr5qVmBRSMWhe",
            ]
          );
          encadreur_id = result.insertId;
        } else {
          encadreur_id = encadreur[0].id;
        }

        // 5. Ajouter l'encadreur au jury
        if (encadreur_id) {
          await db.query(
            'INSERT INTO soutenance_jury (soutenance_id, jury_id, role) VALUES (?, ?, "encadreur")',
            [soutenance_id, encadreur_id]
          );

          await db.query(
            "UPDATE soutenances SET encadreur_fige = TRUE WHERE id = ?",
            [soutenance_id]
          );
        }
      } else {
        // L'étudiant n'a pas renseigné d'encadreur
        console.log(`Soumission ${soumission_id} : aucun encadreur renseigné`);
        // encadreur_fige reste FALSE, l'encadreur pourra être ajouté plus tard
      }
    }

    // 6. Marquer la soumission comme traitée
    await db.query(
      'UPDATE stage_soumissions SET statut = "traite" WHERE id = ?',
      [soumission_id]
    );

    res.json({ 
      message: encadreur_id 
        ? "Soumission validée avec encadreur" 
        : "Soumission validée (aucun encadreur spécifié - à compléter ultérieurement)"
    });
  } catch (err) {
    console.error("Erreur validation soumission:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getSallesDisponibles = async (req, res) => {
  const { date, heure } = req.query;
  if (!date || !heure) return res.status(400).json({ message: "Date et heure requises" });

  const toutesLesSalles = ["Salle A101", "Salle B203", "Amphi 1"];

  try {
    const dateTime = `${date} ${heure}:00`;
    const [occupied] = await db.query(
      "SELECT salle FROM soutenances WHERE date_soutenance = ? AND statut != 'annulee'",
      [dateTime]
    );
    const occupiedSet = new Set(occupied.map(r => r.salle));
    const disponibles = toutesLesSalles.filter(s => !occupiedSet.has(s));
    res.json(disponibles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
