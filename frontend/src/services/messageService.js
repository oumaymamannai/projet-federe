import api from './api';
// Importation de l'API

// Exportation de l'API des messages  --> exportation de l'API des messages pour être utilisé dans les composants
export const messageAPI = {
  // Récupérer toutes les conversations
  getConversations: () => api.get('/messages/conversations'), // Route pour récupérer les conversations
  
  // Récupérer les messages d'une soutenance spécifique
  getMessages: (soutenanceId) => api.get(`/messages/${soutenanceId}`), // Route pour récupérer les messages par soutenance  
  
  // Envoyer un message (texte seul) + metadata fichiers
  envoyerMessage: (soutenanceId, contenu, fichiers = []) => { // Route pour envoyer un message (texte seul) + metadata fichiers
    return api.post(`/messages/${soutenanceId}`, {
      contenu,
      fichiers,
    });
  },

  // Envoyer un message avec une pièce jointe (multer)
  envoyerMessageAvecFichier: (soutenanceId, contenu, fichier) => { // Route pour envoyer un message avec une pièce jointe (multer)
    const formData = new FormData();
    if (contenu) formData.append('contenu', contenu);
    if (fichier) formData.append('fichier', fichier);
    return api.post(`/messages/${soutenanceId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Récupérer les messages non lus
  getNonLus: () => api.get('/messages/non-lus'), // Route pour récupérer les messages non lus par l'utilisateur
  
  // Upload de fichier
  uploadFile: (formData) => { // Route pour upload de fichier
    return api.post('/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Marquer les messages comme lus
  marquerCommeLu: (soutenanceId) => { // Route pour marquer les messages comme lus
    return api.put(`/messages/${soutenanceId}/read`);
  },
};

// Aide pour construire l'URL de la pièce jointe (backend uploads static)
export const getMessageFileUrl = (pieceJointe) => { // Aide pour construire l'URL de la pièce jointe (backend uploads static) 
  if (!pieceJointe) return null;

  // Si c'est déjà une URL complète, la retourner telle quelle
  if (pieceJointe.startsWith('http://') || pieceJointe.startsWith('https://')) {
    return pieceJointe; // Si c'est déjà une URL complète, la retourner telle quelle
  }

  // Supprimer le slash initial si présent
  let normalized = pieceJointe.startsWith('/') ? pieceJointe.slice(1) : pieceJointe; // Supprimer le slash initial si présent

  // Gérer les anciens chemins absolus (contiennent des backslashes ou des chemins Windows)
  if (normalized.includes('\\') || normalized.includes(':\\') || normalized.includes('C:') || normalized.includes('Users')) { // Gérer les anciens chemins absolus (contiennent des backslashes ou des chemins Windows)
    // Extraire juste le nom du fichier depuis le chemin absolu
    const parts = normalized.split(/[/\\]/);
    const filename = parts[parts.length - 1];
    normalized = `messages/${filename}`; // Extraire juste le nom du fichier depuis le chemin absolu
  }

  // Utiliser l'URL complète du serveur pour les fichiers statiques
  return `${window.location.origin}/uploads/${normalized}`; // Utiliser l'URL complète du serveur pour les fichiers statiques
};