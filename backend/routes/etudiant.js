const express = require("express");
const router = express.Router();
// Importation des middlewares d'authentification et de vérification des rôles
const { verifyToken, requireRole } = require("../middleware/auth");
// Middleware pour la gestion des fichiers uploadés (multer)
const upload = require("../middleware/upload");
// Importation du contrôleur étudiant (logique métier)
const ctrl = require("../controllers/etudiantController");
// Toutes les routes ci-dessous nécessitent :
//   1. Un token JWT valide (verifyToken)
//   2. Que l'utilisateur ait le rôle "etudiant" (requireRole)
router.use(verifyToken, requireRole("etudiant"));
// Route pour récupérer les informations de la soutenance de l'étudiant
router.get("/soutenance", ctrl.getMaSoutenance);
// Route pour soumettre un stage (avec gestion des fichiers uploadés)
router.post("/stage", upload.array("fichiers", 5), ctrl.soumettreStage);
// Route pour récupérer les soumissions de stage de l'étudiant
router.get("/stage/soumissions", ctrl.getMesSoumissions);
// Route pour créer une réclamation (avec gestion du fichier uploadé)
router.post("/reclamation", upload.single("piece_jointe"), ctrl.creerReclamation);
// Route pour récupérer les réclamations de l'étudiant
router.get("/reclamations", ctrl.getMesReclamations);
// Route pour récupérer les documents de l'étudiant
router.get("/documents", ctrl.getDocuments);
// Route pour demander un encadreur
router.post("/demander-encadreur", ctrl.demanderEncadreur);
// Route pour vérifier le statut de l'encadreur
router.get("/statut-encadreur", ctrl.verifierStatutEncadreur);
// Route pour vérifier si l'étudiant a déjà soumis un stage
router.get("/a-deja-soumis", ctrl.aDejaSoumis); // ← NOUVEAU
// Route pour récupérer les membres du jury
// Ajoutez cette ligne après les autres routes GET
router.get("/jury/membres", ctrl.getJuryMembers);
module.exports = router;