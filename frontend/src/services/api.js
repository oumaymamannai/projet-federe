import axios from 'axios'; // Importation de axios pour faire des requêtes HTTP

const api = axios.create({ // Création de l'instance axios
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use( // Intercepte les réponses de l'API et gère les erreurs
  res => res, // Retourne la réponse
  err => {
    const url = err.config?.url || ''; // Récupère l'URL de la requête  
    // Ne pas recharger la page sur un échec de connexion (afficher le message d'erreur)  
    if (err.response?.status === 401 && !url.includes('/auth/login')) { // Si l'erreur est due à une authentification invalide et que l'URL n'est pas '/auth/login'
      localStorage.removeItem('gradflow_token'); // Supprime le token JWT de localStorage
      window.location.href = '/login'; // Redirige vers la page de connexion
    }
    return Promise.reject(err); // Rejette l'erreur
  }
);

export default api;

export const adminAPI = {
  getSoutenances: () => api.get('/admin/soutenances'), // Route pour récupérer les soutenances
  getUsers: (type) => { // Route pour récupérer les utilisateurs
    // Only 'jury' expected today — backend exposes /admin/jury
    if (type === 'jury') return api.get('/admin/jury'); // Route pour récupérer les jurys
    return api.get('/admin/etudiants'); // Route pour récupérer les étudiants
  },
  affecterJury: (soutenance_id, payload) => api.post(`/admin/jury/${soutenance_id}`, payload), // Route pour affecter un jury à une soutenance
  envoyerResultats: (soutenance_id) => api.post(`/admin/resultat/${soutenance_id}/envoyer`), // Route pour envoyer les résultats
  getDashboard: () => api.get('/admin/dashboard'), // Route pour récupérer le dashboard
  getPeriode: () => api.get('/admin/periode'), // Route pour récupérer la période
  setPeriode: (data) => api.post('/admin/periode', data), // Route pour définir la période
  affecterDatesAuto: () => api.post('/admin/affecter-dates'), // route principale déjà en backend
}; // Exportation de l'API des administrateurs  
