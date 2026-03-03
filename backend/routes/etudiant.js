const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");
const ctrl = require("../controllers/etudiantController");

router.use(verifyToken, requireRole("etudiant"));
router.get("/soutenance", ctrl.getMaSoutenance);
router.post("/stage", upload.array("fichiers", 5), ctrl.soumettreStage); //5 est le nombre maximum de fichiers
router.get("/stage/soumissions", ctrl.getMesSoumissions);
router.post("/reclamation", ctrl.creerReclamation);
router.get("/reclamations", ctrl.getMesReclamations);
router.get("/documents", ctrl.getDocuments);
// 1. Demander un encadreur (spécifique)
router.post("/demander-encadreur", ctrl.demanderEncadreur);

// 2. Vérifier le statut de l'encadreur
router.get("/statut-encadreur", ctrl.verifierStatutEncadreur);
module.exports = router;
