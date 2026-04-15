
 // config/defaultPassword.js — Mot de passe unique pour tous les comptes de démo
 
const DEFAULT_DEV_PASSWORD = process.env.TEST_PASSWORD || "test";

module.exports = { DEFAULT_DEV_PASSWORD }; //exporte la variable DEFAULT_DEV_PASSWORD pour qu'elle puisse être utilisée dans d'autres fichiers
