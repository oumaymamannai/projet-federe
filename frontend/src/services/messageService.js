import api from './api';

export const messageAPI = {
  // Récupérer toutes les conversations
  getConversations: () => api.get('/messages/conversations'),
  
  // Récupérer les messages d'une soutenance spécifique
  getMessages: (soutenanceId) => api.get(`/messages/${soutenanceId}`),
  
  // Envoyer un message avec fichiers
  envoyerMessage: (soutenanceId, contenu, fichiers = []) => {
    return api.post(`/messages/${soutenanceId}`, { 
      contenu,
      fichiers: fichiers
    });
  },
  
  // Récupérer les messages non lus
  getNonLus: () => api.get('/messages/non-lus'),
  
  // Upload de fichier
  uploadFile: (formData) => {
    return api.post('/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Marquer les messages comme lus
  marquerCommeLu: (soutenanceId) => {
    return api.put(`/messages/${soutenanceId}/read`);
  },
};