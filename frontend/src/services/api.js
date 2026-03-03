import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gradflow_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const adminAPI = {
  getSoutenances: () => api.get('/admin/soutenances'),
  getUsers: (type) => {
    // Only 'jury' expected today — backend exposes /admin/jury
    if (type === 'jury') return api.get('/admin/jury');
    return api.get('/admin/etudiants');
  },
  affecterJury: (soutenance_id, payload) => api.post(`/admin/jury/${soutenance_id}`, payload),
  envoyerResultats: (soutenance_id) => api.post(`/admin/resultat/${soutenance_id}/envoyer`),
  getDashboard: () => api.get('/admin/dashboard'),
};
