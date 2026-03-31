const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/adminController"); // Utilise le même contrôleur

// Appliquer les middlewares (admin uniquement pour ces routes)
router.use(verifyToken, requireRole("admin"));

// Routes pour la gestion des membres du jury
router.get("/members", ctrl.getAllJuryMembers);           // GET /api/jury/members
router.post("/contact", ctrl.sendEmailToMember);          // POST /api/jury/contact
router.post("/contact-all", ctrl.sendEmailToAllJury);     // POST /api/jury/contact-all

// Route pour affecter un jury à une soutenance (déplacée de admin.js)
router.post("/:soutenance_id/affecter", ctrl.affecterJury);  // POST /api/jury/:soutenance_id/affecter

// Route pour récupérer les membres du jury (simple liste)
router.get("/list", ctrl.getJuryMembers);                 // GET /api/jury/list

module.exports = router;