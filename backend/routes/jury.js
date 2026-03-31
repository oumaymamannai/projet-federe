const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const juryCtrl = require("../controllers/juryController");

// JURY uniquement
router.use(verifyToken, requireRole("jury"));

// Dashboard jury
router.get("/dashboard", juryCtrl.getDashboard);

// Mes soutenances
router.get("/soutenances", juryCtrl.getMesSoutenances);

// Évaluer une soutenance
router.post("/evaluer/:soutenance_id", juryCtrl.evaluer);

module.exports = router;