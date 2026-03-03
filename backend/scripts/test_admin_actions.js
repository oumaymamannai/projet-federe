const axios = require('axios');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: __dirname + '/../.env' });

async function main() {
  const db = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
  });

  // 1) Trouver ou créer un admin
  let [rows] = await db.query("SELECT id, email FROM users WHERE role='admin' LIMIT 1");
  let admin;
  if (!rows.length) {
    const pw = await bcrypt.hash('admin123', 10);
    const [res] = await db.query("INSERT INTO users (nom, prenom, email, password, role) VALUES (?, ?, ?, ?, 'admin')", ['Admin', 'Local', 'admin.local@gradflow.test', pw]);
    admin = { id: res.insertId, email: 'admin.local@gradflow.test' };
    console.log('Admin créé:', admin.id);
  } else {
    admin = rows[0];
    console.log('Admin trouvé:', admin.id);
  }

  // 2) Générer token JWT
  const token = jwt.sign({ id: admin.id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

  const base = 'http://localhost:' + (process.env.PORT || 5001) + '/api/admin';

  // 3) Chercher une soumission non traitée
  const [soums] = await db.query("SELECT * FROM stage_soumissions WHERE statut <> 'traite' LIMIT 1");
  if (!soums.length) {
    console.log('Aucune soumission non traitée trouvée. Rien à tester.');
    process.exit(0);
  }
  const soum = soums[0];
  console.log('Soumission trouvée:', soum.id, 'étudiant:', soum.etudiant_id);

  // 4) Valider la soumission via l'API
  try {
    const val = await axios.post(`${base}/soumissions/${soum.id}/valider`, {}, { headers: { Authorization: 'Bearer ' + token } });
    console.log('Valider soumission réponse:', val.data.message || val.status);
  } catch (err) {
    console.error('Erreur valider soumission:', err.response?.data || err.message);
    process.exit(1);
  }

  // 5) Récupérer la soutenance créée/mise à jour
  const [sout] = await db.query('SELECT id FROM soutenances WHERE etudiant_id = ? LIMIT 1', [soum.etudiant_id]);
  if (!sout.length) {
    console.error('Soutenance introuvable après validation');
    process.exit(1);
  }
  const soutId = sout[0].id;
  console.log('Soutenance ID:', soutId);

  // 6) Trouver deux jurys disponibles (ou créer si nécessaire)
  let [jurys] = await db.query("SELECT id FROM users WHERE role='jury' LIMIT 2");
  if (jurys.length < 2) {
    // Créer utilisateurs jury
    const pw = await bcrypt.hash('jury123', 10);
    const names = [['Jean','Dupont'],['Marie','Curie']];
    for (const n of names) {
      const [r] = await db.query('INSERT INTO users (nom, prenom, email, password, role) VALUES (?,?,?,?,"jury")', [n[1], n[0], `${n[0].toLowerCase()}.${n[1].toLowerCase()}@gradflow.test`, pw]);
      jurys.push({ id: r.insertId });
    }
    console.log('Créés jurys, ids:', jurys.map(j=>j.id));
  }

  const president_id = jurys[0].id;
  const membre3_id = jurys[1].id;

  // 7) Affecter président + 3ème membre (sans toucher à l'encadreur)
  try {
    const res = await axios.post(`${base}/jury/${soutId}`, { president_id, membre3_id }, { headers: { Authorization: 'Bearer ' + token } });
    console.log('Affecter jury réponse:', res.data.message || res.status);
  } catch (err) {
    console.error('Erreur affecter jury:', err.response?.data || err.message);
    process.exit(1);
  }

  // 8) Vérifier en DB la présence des rôles
  const [assigned] = await db.query('SELECT jury_id, role FROM soutenance_jury WHERE soutenance_id = ?', [soutId]);
  console.log('Membres affectés pour la soutenance:', assigned);

  console.log('Test terminé avec succès.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
