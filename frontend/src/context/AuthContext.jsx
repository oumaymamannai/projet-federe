// AuthContext.jsx — Gestion globale de l'authentification dans l'application React
// Rôle : Stocker l'utilisateur connecté et fournir les fonctions login/logout à TOUS les composants
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
// Créer un contexte d'authentification (AuthContext) pour partager les données d'authentification dans toute l'application
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Stocke les infos de l'utilisateur connecté ou null si pas connecté
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    // Au chargement de l'application, vérifier si un token est présent dans localStorage
    const token = localStorage.getItem('gradflow_token');
    if (token) {
      // Si un token existe, le définir dans les headers par défaut de l'instance axios pour les requêtes suivantes
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me') // Appel à l'endpoint /api/auth/me pour récupérer les infos de l'utilisateur connecté (si le token est valide)
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('gradflow_token');
          delete api.defaults.headers.common['Authorization']; // En cas d'erreur (token invalide ou expiré), supprimer le token et réinitialiser l'état user
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false); // Pas de token, rien à vérifier
    }
  }, []);
  // Fonction de connexion : envoie les identifiants au backend, reçoit le token et les infos utilisateur, et les stocke
  const login = async (email, password, expectedRole) => {
    const res = await api.post('/auth/login', { email, password, expectedRole }); 
    localStorage.setItem('gradflow_token', res.data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setUser(res.data.user);
    return res.data.user;
  };
// Fonction de déconnexion : supprime le token et réinitialise l'état user
  const logout = () => {
    localStorage.removeItem('gradflow_token'); // Supprimer le token du localStorage
    delete api.defaults.headers.common['Authorization']; 
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}> 
      {children}
    </AuthContext.Provider> 
  );
}

export const useAuth = () => useContext(AuthContext); //Hook raccourci utilisé dans les composants
