const db = require("../config/db");
const {
  sendResultatEmail,
  sendReclamationReponse,
} = require("../config/email");

exports.getDashboard = async (req, res) => {
  try {
    const [[{ totale }]] = await db.query(
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
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSoutenances = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, CONCAT(u.prenom,' ',u.nom) as etudiant_nom, u.email as etudiant_email,
        -- include jury id and name so frontend can identify encadreur by id
        GROUP_CONCAT(DISTINCT CONCAT(uj.id, '::', uj.prenom, ' ', uj.nom, '|', sj.role) ORDER BY sj.role SEPARATOR ';;') as jury_info
      FROM soutenances s
      JOIN users u ON u.id = s.etudiant_id
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
      WHERE role = 'jury' OR role = 'admin'
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

    // ✅ Plus besoin de JSON.parse() ! C'est déjà parsé automatiquement
    const salles = periode.salles;

    const heures = ["09:00", "10:30", "14:00", "15:30", "17:00"];

    const [students] = await db.query(`
      SELECT s.id FROM soutenances s WHERE s.date_soutenance IS NULL OR s.statut = 'en_attente'
    `);

    const start = new Date(periode.date_debut);
    const end = new Date(periode.date_fin);
    let current = new Date(start);
    let sIdx = 0,
      hIdx = 0;

    for (const st of students) {
      if (current > end) break;
      while (current.getDay() === 0 || current.getDay() === 6) {
        current.setDate(current.getDate() + 1);
      }
      const dateStr = `${current.toISOString().split("T")[0]} ${
        heures[hIdx]
      }:00`;
      await db.query(
        'UPDATE soutenances SET date_soutenance=?, salle=?, statut="planifiee" WHERE id=?',
        [dateStr, salles[sIdx % salles.length], st.id]
      );
      hIdx++;
      sIdx++;
      if (hIdx >= heures.length) {
        hIdx = 0;
        current.setDate(current.getDate() + 1);
      }
    }
    res.json({ message: `${students.length} dates affectées automatiquement` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReclamations = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, CONCAT(u.prenom,' ',u.nom) as etudiant_nom, u.email as etudiant_email
      FROM reclamations r JOIN users u ON u.id = r.etudiant_id
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.repondreReclamation = async (req, res) => {
  const { id } = req.params;
  const { reponse, affecter_encadreur, encadreur_id } = req.body; // ← NOUVEAUX PARAMÈTRES

  try {
    const [rows] = await db.query(
      `SELECT r.*, u.email, u.nom, u.prenom, u.id as etudiant_id FROM reclamations r JOIN users u ON u.id=r.etudiant_id WHERE r.id=?`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ message: "Non trouvée" });

    const reclamation = rows[0];

    // Démarrer une transaction
    await db.query("START TRANSACTION");

    // 1. Mettre à jour la réclamation
    await db.query(
      'UPDATE reclamations SET reponse=?, statut="traitee", reponse_at=NOW() WHERE id=?',
      [reponse, id]
    );

    // 2. Si c'est une affectation d'encadreur
    if (affecter_encadreur && encadreur_id) {
      // Récupérer la soutenance de l'étudiant
      const [sout] = await db.query(
        "SELECT id FROM soutenances WHERE etudiant_id = ?",
        [reclamation.etudiant_id]
      );

      if (sout.length > 0) {
        const soutenance_id = sout[0].id;

        // Ajouter l'encadreur au jury
        await db.query(
          'INSERT INTO soutenance_jury (soutenance_id, jury_id, role) VALUES (?, ?, "encadreur")',
          [soutenance_id, encadreur_id]
        );

        // Marquer l'encadreur comme figé
        await db.query(
          "UPDATE soutenances SET encadreur_fige = TRUE WHERE id = ?",
          [soutenance_id]
        );
      }
    }

    await db.query("COMMIT");

    // Envoyer l'email
    try {
      await sendReclamationReponse(reclamation.email, reclamation, { reponse });
    } catch {}

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
    // Récupérer la soumission
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

    if (sout.length > 0) {
      const soutenance_id = sout[0].id;

      // 3. Chercher l'encadreur dans la table users
      const [encadreur] = await db.query(
        'SELECT id FROM users WHERE CONCAT(prenom, " ", nom) = ? OR CONCAT(nom, " ", prenom) = ?',
        [soumission.encadreur, soumission.encadreur]
      );

      let encadreur_id;

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

      // 5. Ajouter l'encadreur au jury et marquer comme figé
      await db.query(
        'INSERT INTO soutenance_jury (soutenance_id, jury_id, role) VALUES (?, ?, "encadreur")',
        [soutenance_id, encadreur_id]
      );

      await db.query(
        "UPDATE soutenances SET encadreur_fige = TRUE WHERE id = ?",
        [soutenance_id]
      );
    }

    // 6. Marquer la soumission comme traitée
    await db.query(
      'UPDATE stage_soumissions SET statut = "traite" WHERE id = ?',
      [soumission_id]
    );

    res.json({ message: "Soumission validée avec encadreur" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
