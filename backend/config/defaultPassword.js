/**
 * Mot de passe unique pour tous les rôles en environnement de démo / dev.
 * Surchargeable via TEST_PASSWORD dans .env (ex. pour CI).
 */
const DEFAULT_DEV_PASSWORD = process.env.TEST_PASSWORD || "test";

module.exports = { DEFAULT_DEV_PASSWORD };
