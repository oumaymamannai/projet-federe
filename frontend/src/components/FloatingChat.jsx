// src/components/FloatingChat.jsx
import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Minimize2, Maximize2, Paperclip } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getMessageFileUrl } from '../services/messageService';

export default function FloatingChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [soutenanceId, setSoutenanceId] = useState(null);
  const [encadreur, setEncadreur] = useState(null);
  const [nonLus, setNonLus] = useState(0);
  const [fichier, setFichier] = useState(null);
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);

  // Récupérer la soutenance et l'encadreur de l'étudiant
  useEffect(() => {
    if (user?.role === 'etudiant') {
      loadSoutenance();
      loadNonLus();
      
      // Vérifier les nouveaux messages toutes les 10 secondes
      const nonLusInterval = setInterval(loadNonLus, 10000);
      return () => clearInterval(nonLusInterval);
    }
  }, [user]);

  const loadSoutenance = async () => {
    try {
      const res = await api.get('/etudiant/soutenance');
      const data = res.data;
      if (data && data.id) {
        setSoutenanceId(data.id);
        // Trouver l'encadreur dans le jury
        const encad = data.jurys?.find(j => 
          j.role === 'encadreur' || j.role === 'encadrant'
        );
        if (encad) {
          setEncadreur(encad);
        }
      }
    } catch (err) {
      console.error('Erreur chargement soutenance:', err);
    }
  };

  const loadNonLus = async () => {
    if (!soutenanceId) return;
    try {
      const res = await api.get('/messages/non-lus');
      setNonLus(res.data.non_lus || 0);
    } catch (err) {
      console.error('Erreur chargement non lus:', err);
    }
  };

  // Charger les messages quand le chat est ouvert
  useEffect(() => {
    if (isOpen && !isMinimized && soutenanceId) {
      loadMessages();
      
      // Polling toutes les 5 secondes
      intervalRef.current = setInterval(loadMessages, 5000);
      
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isOpen, isMinimized, soutenanceId]);

  // Marquer les messages comme lus quand le chat s'ouvre
  useEffect(() => {
    if (isOpen && nonLus > 0) {
      loadMessages();
      loadNonLus();
    }
  }, [isOpen]);

  // Scroll vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    if (!soutenanceId) return;
    try {
      const res = await api.get(`/messages/${soutenanceId}`);
      setMessages(res.data);
      // Recharger le compteur après avoir lu les messages
      loadNonLus();
    } catch (err) {
      console.error('Erreur chargement messages:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !fichier) || !soutenanceId) return;
    
    setLoading(true);
    try {
      if (fichier) {
        // Envoyer avec fichier
        const formData = new FormData();
        if (newMessage.trim()) formData.append('contenu', newMessage.trim());
        formData.append('fichier', fichier);
        await api.post(`/messages/${soutenanceId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Message texte seul
        await api.post(`/messages/${soutenanceId}`, { contenu: newMessage.trim() });
      }
      setNewMessage('');
      setFichier(null);
      await loadMessages();
    } catch (err) {
      console.error('Erreur envoi message:', err);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setLoading(false);
    }
  };

  // Si pas de soutenance ou pas d'encadreur, ne pas afficher le chat
  if (!soutenanceId || !encadreur) return null;

  return (
    <>
      {/* Bouton flottant avec badge de notification */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="floating-chat-btn"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            transition: 'transform 0.2s',
            zIndex: 1000
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageSquare size={24} />
          {nonLus > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white'
            }}>
              {nonLus > 9 ? '9+' : nonLus}
            </span>
          )}
        </button>
      )}

      {/* Fenêtre de chat */}
      {isOpen && (
        <div
          className="floating-chat-window"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: isMinimized ? '300px' : '540px',
            height: isMinimized ? 'auto' : '500px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1001,
            transition: 'all 0.3s ease'
          }}
        >
          {/* En-tête */}
          <div
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} />
              <span style={{ fontWeight: 600 }}>
                {encadreur?.nom} - Encadreur
              </span>
              {nonLus > 0 && !isMinimized && (
                <span style={{
                  background: '#ef4444',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  {nonLus} nouveau{nonLus > 1 ? 'x' : ''}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Corps du chat - seulement si non minimisé */}
          {!isMinimized && (
            <>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: '#f9fafb'
                }}
              >
                {messages.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: '#9ca3af',
                    padding: '40px 20px'
                  }}>
                    <MessageSquare size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p>Aucun message</p>
                    <p style={{ fontSize: '12px' }}>Envoyez un message à votre encadreur</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.user_id === user?.id;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: isMe ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '80%',
                            padding: '8px 12px',
                            borderRadius: '12px',
                            background: isMe ? '#7c3aed' : 'white',
                            color: isMe ? 'white' : '#1f2937',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
                            {isMe ? 'Moi' : `${msg.prenom} ${msg.nom}`}
                          </div>
                          <div style={{ fontSize: '14px', wordBreak: 'break-word' }}>
                            {msg.contenu}
                          </div>
                          {msg.piece_jointe && (
                            <div style={{ marginTop: '6px' }}>
                              <a
                                href={getMessageFileUrl(msg.piece_jointe)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '12px',
                                  color: isMe ? '#e0e7ff' : '#7c3aed',
                                  textDecoration: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  background: isMe ? 'rgba(255,255,255,0.1)' : 'rgba(124,58,237,0.1)',
                                  border: `1px solid ${isMe ? 'rgba(255,255,255,0.2)' : 'rgba(124,58,237,0.2)'}`,
                                }}
                                onMouseEnter={(e) => e.target.style.background = isMe ? 'rgba(255,255,255,0.2)' : 'rgba(124,58,237,0.2)'}
                                onMouseLeave={(e) => e.target.style.background = isMe ? 'rgba(255,255,255,0.1)' : 'rgba(124,58,237,0.1)'}
                              >
                                <Paperclip size={12} />
                                {msg.piece_jointe}
                              </a>
                            </div>
                          )}
                          <div style={{
                            fontSize: '10px',
                            marginTop: '4px',
                            opacity: 0.7,
                            textAlign: 'right'
                          }}>
                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Formulaire d'envoi */}
              <div style={{ background: 'white', borderTop: '1px solid #e5e7eb' }}>
                {fichier && (
                  <div style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f9fafb'
                  }}>
                    <span>📎 {fichier.name}</span>
                    <button
                      type="button"
                      onClick={() => setFichier(null)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
                <form
                  onSubmit={sendMessage}
                  style={{
                    padding: '12px',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}
                >
                  <label
                    htmlFor="chat-file-input"
                    style={{
                      cursor: 'pointer',
                      color: '#7c3aed',
                      padding: '6px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Joindre un fichier"
                  >
                    <Paperclip size={16} />
                  </label>
                  <input
                    id="chat-file-input"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
                  />
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={fichier ? "Ajouter un message..." : "Écrivez votre message..."}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none',
                      fontSize: '14px'
                    }}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || (!newMessage.trim() && !fichier)}
                    style={{
                      background: '#7c3aed',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: 'white',
                      cursor: loading || (!newMessage.trim() && !fichier) ? 'not-allowed' : 'pointer',
                      opacity: loading || (!newMessage.trim() && !fichier) ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Send size={16} />
                  </button>
                </form>
                <div style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  textAlign: 'center',
                  padding: '0 12px 8px',
                  marginTop: '-4px'
                }}>
                  L'envoi d'une pièce jointe est obligatoirement accompagné d'un message
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}