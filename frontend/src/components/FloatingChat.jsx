// src/components/FloatingChat.jsx
import { useState, useEffect, useRef } from 'react'; // Importation des hooks de React    
import { MessageSquare, X, Send, Minimize2, Maximize2, Paperclip } from 'lucide-react'; // Importation des icônes de Lucide React
import api from '../services/api'; // Importation de l'API
import { useAuth } from '../context/AuthContext'; // Importation du contexte d'authentification
import { getMessageFileUrl } from '../services/messageService'; // Importation de la fonction pour construire l'URL de la pièce jointe
import toast from 'react-hot-toast';
export default function FloatingChat() {
  const { user } = useAuth(); // Récupération de l'utilisateur connecté
  const [isOpen, setIsOpen] = useState(false); // État pour ouvrir/fermer le chat 
  const [isMinimized, setIsMinimized] = useState(false); // État pour minimiser/maximiser le chat
  const [messages, setMessages] = useState([]); // État pour les messages
  const [newMessage, setNewMessage] = useState(''); // État pour le nouveau message
  const [loading, setLoading] = useState(false); // État pour le chargement
  const [soutenanceId, setSoutenanceId] = useState(null); // État pour l'ID de la soutenance
  const [encadreur, setEncadreur] = useState(null); // État pour l'encadreur
  const [nonLus, setNonLus] = useState(0); // État pour les messages non lus
  const [fichier, setFichier] = useState(null); // État pour le fichier
  const messagesEndRef = useRef(null); // Référence pour le messagesEndRef 
  const intervalRef = useRef(null); // Référence pour le intervalle

  // Récupérer la soutenance et l'encadreur de l'étudiant
  useEffect(() => {
    if (user?.role === 'etudiant') {
      loadSoutenance(); // Charger la soutenance
    }
  }, [user]);

  // Vérifier les nouveaux messages toutes les 3 secondes
  useEffect(() => {
    if (soutenanceId) {
      loadNonLus(); // Charger les messages non lus
      const interval = setInterval(() => {
        loadNonLus(); // Charger les messages non lus toutes les 3 secondes
      }, 3000);
      return () => clearInterval(interval); // Nettoyer l'intervalle
    }
  }, [soutenanceId]);

  const loadSoutenance = async () => { // Fonction pour charger la soutenance
    try {
      const res = await api.get('/etudiant/soutenance'); // Récupérer la soutenance
      const data = res.data; // Récupérer les données de la soutenance
      if (data && data.id) {
        setSoutenanceId(data.id); // Définir l'ID de la soutenance
        const encad = data.jurys?.find(j => 
          j.role === 'encadreur' || j.role === 'encadrant'
        );
        if (encad) {
          setEncadreur(encad); // Définir l'encadreur
        }
        await loadMessages(); // Charger les messages
      }
    } catch (err) {
      console.error('Erreur chargement soutenance:', err); // Afficher l'erreur
    }
  };

  const loadNonLus = async () => { // Fonction pour charger les messages non lus
    if (!soutenanceId) return;
    try {
      const res = await api.get(`/messages/${soutenanceId}/non-lus`); // Récupérer les messages non lus
      const count = res.data.count || 0;
      setNonLus(count); // Définir le nombre de messages non lus
      console.log('Messages non lus:', count);
    } catch (err) {
      console.error('Erreur chargement non lus:', err); // Afficher l'erreur
    }
  };

  // Charger les messages quand le chat est ouvert
  useEffect(() => {
    if (isOpen && !isMinimized && soutenanceId) {
      loadMessages(); // Charger les messages quand le chat est ouvert
      intervalRef.current = setInterval(loadMessages, 3000); // Charger les messages toutes les 3 secondes
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current); // Nettoyer l'intervalle
      };
    }
  }, [isOpen, isMinimized, soutenanceId]);

  // Marquer comme lus quand le chat s'ouvre
  useEffect(() => {
    if (isOpen && nonLus > 0) {
      markAsRead(); // Marquer comme lus quand le chat s'ouvre
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); // Faire défiler les messages
  }, [messages]);

  const loadMessages = async () => { // Fonction pour charger les messages  
    if (!soutenanceId) return;
    try {
      const res = await api.get(`/messages/${soutenanceId}`); // Récupérer les messages
      setMessages(res.data); // Définir les messages
      await loadNonLus();
    } catch (err) {
      console.error('Erreur chargement messages:', err); // Afficher l'erreur
    }
  };

  const markAsRead = async () => { // Fonction pour marquer comme lus
    if (!soutenanceId) return;
    try {
      await api.put(`/messages/${soutenanceId}/read`); // Marquer comme lus
      setNonLus(0); // Définir le nombre de messages non lus à 0
    } catch (err) {
      console.error('Erreur marquage lu:', err); // Afficher l'erreur
    }
  };

  const sendMessage = async (e) => { // Fonction pour envoyer un message
    e.preventDefault();
    if ((!newMessage.trim() && !fichier) || !soutenanceId) return;
    
    setLoading(true); // Définir le chargement à true pour éviter les doublons
    try {
      if (fichier) {
        const formData = new FormData(); // Créer un objet FormData pour envoyer le message avec la pièce jointe
        if (newMessage.trim()) formData.append('contenu', newMessage.trim());
        formData.append('fichier', fichier); // Ajouter la pièce jointe au formData
        await api.post(`/messages/${soutenanceId}`, formData, { // Envoyer le message avec la pièce jointe
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post(`/messages/${soutenanceId}`, { contenu: newMessage.trim() }); // Envoyer le message sans pièce jointe
      }
      setNewMessage(''); // Définir le nouveau message à vide pour éviter les doublons
      setFichier(null); // Définir le fichier à null
      await loadMessages(); // Charger les messages
    } catch (err) {
      console.error('Erreur envoi message:', err); // Afficher l'erreur
      toast.error('Erreur lors de l\'envoi du message'); // Afficher l'erreur
    } finally {
      setLoading(false); // Définir le chargement à false pour éviter les doublons
    }
  };

  if (!soutenanceId || !encadreur) return null; // Si il n'y a pas de soutenance ou d'encadreur, retourner null

  return (
    <>
      {!isOpen && ( // Si le chat n'est pas ouvert, afficher le bouton pour ouvrir le chat
        <button
          onClick={() => setIsOpen(true)} // Ouvrir le chat
          style={{
            position: 'fixed', // Position fixe
            bottom: '24px',
            right: '24px',
            width: '56px', // Largeur du bouton
            height: '56px', // Hauteur du bouton
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', // Gradient de couleur
            border: 'none',
            cursor: 'pointer', // Cursor de pointeur
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', // Ombre
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            zIndex: 1000 // Z-index
          }}
        >
          <MessageSquare size={24} /> 
          {nonLus > 0 && (
            <span style={{
              position: 'absolute', // Position absolue
              top: '-8px',
              right: '-8px',
              background: '#ef4444', // Couleur de fond     
              color: 'white', // Couleur du texte
              fontSize: '12px', // Taille de la police
              fontWeight: 'bold',
              minWidth: '20px', // Largeur minimale
              height: '20px', // Hauteur
              borderRadius: '20px',
              display: 'flex', // Afficher en flex
              alignItems: 'center',
              justifyContent: 'center', // Centrer le texte
              border: '2px solid white',
              padding: '0 6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)' // Ombre
            }}>
              {nonLus > 99 ? '99+' : nonLus} 
            </span>
          )}
        </button>
      )}

      {isOpen && ( // Si le chat est ouvert, afficher le chat
        <div style={{
          position: 'fixed', // Position fixe 
          bottom: '24px', // Bas
          right: '24px', // Droite
          width: isMinimized ? '260px' : '380px', // Largeur
          height: isMinimized ? 'auto' : '500px', // Hauteur
          background: 'white', // Couleur de fond
          borderRadius: '12px', // Bords arrondis   
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
          display: 'flex', // Afficher en flex
          flexDirection: 'column', // Direction de flex
          overflow: 'hidden', // Masquer le débordement
          zIndex: 1001, // Z-index
        }}>
          <div style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            color: 'white',
            display: 'flex', // Afficher en flex
            justifyContent: 'space-between', // Espacer les éléments
            alignItems: 'center', // Centrer les éléments     
            cursor: 'pointer', // Cursor de pointeur
          }}
          onClick={() => setIsMinimized(!isMinimized)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} />
              <span style={{ fontWeight: 600 }}>{encadreur?.nom} - Encadrant</span>
              {nonLus > 0 && !isMinimized && (
                <span style={{
                  background: '#ef4444', // Couleur de fond
                  padding: '2px 8px',
                  borderRadius: '20px', // Bords arrondis
                  fontSize: '11px', // Taille de la police
                  fontWeight: 'bold', // Gras
                }}>
                  {nonLus} nouveau{nonLus > 1 ? 'x' : ''}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {!isMinimized && ( // Si le chat n'est pas minimisé, afficher le chat
            <>
              <div style={{
                flex: 1,
                overflowY: 'auto', // Défiler les messages
                padding: '16px',
                display: 'flex', // Afficher en flex  
                flexDirection: 'column', // Direction de flex
                gap: '12px', // Espacer les éléments
                background: '#f9fafb', // Couleur de fond
              }}>
                {messages.length === 0 ? ( // Si il n'y a pas de messages, afficher le message "Aucun message"
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 20px' }}>
                    <MessageSquare size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p>Aucun message</p>
                    <p style={{ fontSize: '12px' }}>Envoyez un message à votre encadrant</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.user_id === user?.id;
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '80%',
                          padding: '8px 12px',
                          borderRadius: '12px',
                          background: isMe ? '#7c3aed' : 'white',
                          color: isMe ? 'white' : '#1f2937',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
                            {isMe ? 'Moi' : `${msg.prenom} ${msg.nom}`}
                          </div>
                          <div style={{ fontSize: '14px', wordBreak: 'break-word' }}>{msg.contenu}</div>
                          {msg.piece_jointe && (
                            <div style={{ marginTop: '6px' }}>
                              <a href={getMessageFileUrl(msg.piece_jointe)} target="_blank" rel="noopener noreferrer" style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                color: isMe ? '#e0e7ff' : '#7c3aed',
                                textDecoration: 'none',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: isMe ? 'rgba(255,255,255,0.1)' : 'rgba(124,58,237,0.1)'
                              }}>
                                <Paperclip size={12} /> {msg.piece_jointe.split('/').pop()}
                              </a>
                            </div>
                          )}
                          <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7, textAlign: 'right' }}>
                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ background: 'white', borderTop: '1px solid #e5e7eb' }}>
                {fichier && (
                  <div style={{ padding: '8px 12px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', background: '#f9fafb' }}>
                    <span>📎 {fichier.name}</span>
                    <button onClick={() => setFichier(null)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                  </div>
                )}
                <form onSubmit={sendMessage} style={{ padding: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label htmlFor="chat-file-input" style={{ cursor: 'pointer', color: '#7c3aed' }}>
                    <Paperclip size={16} />
                  </label>
                  <input id="chat-file-input" type="file" style={{ display: 'none' }} onChange={(e) => setFichier(e.target.files?.[0] ?? null)} />
                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} 
                    placeholder={fichier ? "Ajouter un message..." : "Écrivez votre message..."}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', fontSize: '14px' }}
                    disabled={loading} />
                  <button type="submit" disabled={loading || (!newMessage.trim() && !fichier)}
                    style={{ background: '#7c3aed', border: 'none', borderRadius: '8px', padding: '8px 12px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}