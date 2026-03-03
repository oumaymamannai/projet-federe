const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");
const ctrl = require("../controllers/adminController");

router.use(verifyToken, requireRole("admin"));
router.get("/dashboard", ctrl.getDashboard);
router.get("/soutenances", ctrl.getSoutenances);
router.post("/soutenances", ctrl.creerSoutenance);
router.get("/jury", ctrl.getJuryMembers);
router.post("/jury/:soutenance_id", ctrl.affecterJury);
router.post("/periode", ctrl.setPeriode);
router.post("/affecter-dates", ctrl.affecterDatesAuto);
router.get("/reclamations", ctrl.getReclamations);
router.post("/reclamations/:id/repondre", ctrl.repondreReclamation);
router.post("/resultat/:soutenance_id/envoyer", ctrl.envoyerResultats);
router.post("/documents", upload.single("fichier"), ctrl.uploadDocument);
router.get("/documents", ctrl.getDocuments);
router.patch("/documents/:id/toggle", ctrl.toggleDocumentPublie);
router.get("/soumissions", ctrl.getSoumissions);
router.get("/etudiants", ctrl.getEtudiants);

// ===== NOUVELLES ROUTES À AJOUTER ICI =====
// 1. Traiter une réclamation et affecter tout le jury (cas sans encadreur)
router.post("/reclamations/traiter-avec-jury", ctrl.traiterReclamationAvecJury);

// 2. Compléter un jury (cas avec encadreur figé)
router.post("/soutenances/completer-jury", ctrl.completerJury);

// 3. Obtenir la liste des soutenances à compléter
router.get("/soutenances/a-completer", ctrl.getSoutenancesACompleter);
router.post("/soumissions/:soumission_id/valider", ctrl.validerSoumission);

module.exports = router;
