import api from './api';

export const messageAPI = {
  // Récupérer toutes les conversations
  getConversations: () => api.get('/messages/conversations'),
  
  // Récupérer les messages d'une soutenance spécifique
  getMessages: (soutenanceId) => api.get(`/messages/${soutenanceId}`),
  
  // Envoyer un message (texte seul) + metadata fichiers
  envoyerMessage: (soutenanceId, contenu, fichiers = []) => {
    return api.post(`/messages/${soutenanceId}`, {
      contenu,
      fichiers,
    });
  },

  // Envoyer un message avec une pièce jointe (multer)
  envoyerMessageAvecFichier: (soutenanceId, contenu, fichier) => {
    const formData = new FormData();
    if (contenu) formData.append('contenu', contenu);
    if (fichier) formData.append('fichier', fichier);
    return api.post(`/messages/${soutenanceId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
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

// Aide pour construire l'URL de la pièce jointe (backend uploads static)
export const getMessageFileUrl = (pieceJointe) => {
  if (!pieceJointe) return null;

  // Si c'est déjà une URL complète, la retourner telle quelle
  if (pieceJointe.startsWith('http://') || pieceJointe.startsWith('https://')) {
    return pieceJointe;
  }

  // Supprimer le slash initial si présent
  let normalized = pieceJointe.startsWith('/') ? pieceJointe.slice(1) : pieceJointe;

  // Gérer les anciens chemins absolus (contiennent des backslashes ou des chemins Windows)
  if (normalized.includes('\\') || normalized.includes(':\\') || normalized.includes('C:') || normalized.includes('Users')) {
    // Extraire juste le nom du fichier depuis le chemin absolu
    const parts = normalized.split(/[/\\]/);
    const filename = parts[parts.length - 1];
    normalized = `messages/${filename}`;
  }

  // Utiliser l'URL complète du serveur pour les fichiers statiques
  return `${window.location.origin}/uploads/${normalized}`;
};