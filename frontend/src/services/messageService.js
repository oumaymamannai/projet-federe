import api from './api';

export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (soutenanceId) => api.get(`/messages/${soutenanceId}`),
  envoyerMessage: (soutenanceId, contenu) => api.post(`/messages/${soutenanceId}`, { contenu }),
  getNonLus: () => api.get('/messages/non-lus'),
};