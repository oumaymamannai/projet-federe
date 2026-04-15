const express = require("express");
const router = express.Router();
// Middleware d'authentification et de gestion des fichiers
const { verifyToken, requireRole } = require("../middleware/auth");
// Middleware pour gérer les uploads de fichiers (documents de soutenance)
const upload = require("../middleware/upload");
// Contrôleur pour les routes admin
const ctrl = require("../controllers/adminController");

// ============================================================
// Ce fichier définit les routes accessibles uniquement par les administrateurs
// MIDDLEWARE GLOBAL — toutes les routes ci-dessous exigent :
//   1. Un token JWT valide (verifyToken)
//   2. Le rôle "admin" (requireRole)
// ============================================================

router.use(verifyToken, requireRole("admin"));
// Routes pour la gestion des soutenances, du jury, des périodes, des réclamations, etc.
router.get("/dashboard", ctrl.getDashboard);// GET  /api/admin/dashboard
// Route pour obtenir la liste des soutenances (avec détails du jury, étudiants, etc.)
router.get("/soutenances", ctrl.getSoutenances);
// Route pour créer une soutenance (ex: via une soumission validée)
router.post("/soutenances", ctrl.creerSoutenance);
router.get("/jury/members", ctrl.getJuryMembers);
// ========== GESTION DES MEMBRES DU JURY ==========       // GET /api/admin/jury/members
router.post("/jury/contact", ctrl.sendEmailToMember);       // POST /api/admin/jury/contact
router.post("/jury/contact-all", ctrl.sendEmailToAllJury);  // POST /api/admin/jury/contact-all

router.post("/jury/:soutenance_id", ctrl.affecterJury);
router.post("/periode", ctrl.setPeriode);
router.get('/periode', ctrl.getPeriode);
router.post("/affecter-dates", ctrl.affecterDatesAuto);
router.post("/affecter-dates-auto", ctrl.affecterDatesAuto); // alias pour compatibilité frontend
router.get("/reclamations", ctrl.getReclamations);
router.post("/reclamations/:id/repondre", ctrl.repondreReclamation);
router.post("/resultat/:soutenance_id/envoyer", ctrl.envoyerResultats);
router.post("/documents", upload.single("fichier"), ctrl.uploadDocument);
router.get("/documents", ctrl.getDocuments);
router.patch("/documents/:id/toggle", ctrl.toggleDocumentPublie);// PATCH /api/admin/documents/:id/toggle — Bascule la visibilité publié/non publié
router.get("/soumissions", ctrl.getSoumissions);
router.get("/etudiants", ctrl.getEtudiants);

//Traiter une réclamation et affecter tout le jury (cas sans encadreur)
router.post("/reclamations/traiter-avec-jury", ctrl.traiterReclamationAvecJury);

//Compléter un jury (cas avec encadreur figé)
router.post("/soutenances/completer-jury", ctrl.completerJury);

//Obtenir la liste des soutenances à compléter
router.get("/soutenances/a-completer", ctrl.getSoutenancesACompleter);
router.post("/soumissions/:soumission_id/valider", ctrl.validerSoumission);
router.get("/salles-disponibles", ctrl.getSallesDisponibles);

// Pour la suppression d'un document
router.delete("/documents/:id", ctrl.deleteDocument);


module.exports = router;

