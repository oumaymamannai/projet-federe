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
    }
  }, [user]);

  // Vérifier les nouveaux messages toutes les 3 secondes
  useEffect(() => {
    if (soutenanceId) {
      loadNonLus();
      const interval = setInterval(() => {
        loadNonLus();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [soutenanceId]);

  const loadSoutenance = async () => {
    try {
      const res = await api.get('/etudiant/soutenance');
      const data = res.data;
      if (data && data.id) {
        setSoutenanceId(data.id);
        const encad = data.jurys?.find(j => 
          j.role === 'encadreur' || j.role === 'encadrant'
        );
        if (encad) {
          setEncadreur(encad);
        }
        await loadMessages();
      }
    } catch (err) {
      console.error('Erreur chargement soutenance:', err);
    }
  };

  const loadNonLus = async () => {
    if (!soutenanceId) return;
    try {
      const res = await api.get(`/messages/${soutenanceId}/non-lus`);
      const count = res.data.count || 0;
      setNonLus(count);
      console.log('Messages non lus:', count);
    } catch (err) {
      console.error('Erreur chargement non lus:', err);
    }
  };

  // Charger les messages quand le chat est ouvert
  useEffect(() => {
    if (isOpen && !isMinimized && soutenanceId) {
      loadMessages();
      intervalRef.current = setInterval(loadMessages, 3000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isOpen, isMinimized, soutenanceId]);

  // Marquer comme lus quand le chat s'ouvre
  useEffect(() => {
    if (isOpen && nonLus > 0) {
      markAsRead();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    if (!soutenanceId) return;
    try {
      const res = await api.get(`/messages/${soutenanceId}`);
      setMessages(res.data);
      await loadNonLus();
    } catch (err) {
      console.error('Erreur chargement messages:', err);
    }
  };

  const markAsRead = async () => {
    if (!soutenanceId) return;
    try {
      await api.post(`/messages/${soutenanceId}/read`);
      setNonLus(0);
    } catch (err) {
      console.error('Erreur marquage lu:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !fichier) || !soutenanceId) return;
    
    setLoading(true);
    try {
      if (fichier) {
        const formData = new FormData();
        if (newMessage.trim()) formData.append('contenu', newMessage.trim());
        formData.append('fichier', fichier);
        await api.post(`/messages/${soutenanceId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
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

  if (!soutenanceId || !encadreur) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
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
            zIndex: 1000
          }}
        >
          <MessageSquare size={24} />
          {nonLus > 0 && (
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: '#ef4444',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              minWidth: '20px',
              height: '20px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
              padding: '0 6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              {nonLus > 99 ? '99+' : nonLus}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: isMinimized ? '300px' : '540px',
          height: isMinimized ? 'auto' : '500px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1001,
        }}>
          <div style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={() => setIsMinimized(!isMinimized)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} />
              <span style={{ fontWeight: 600 }}>{encadreur?.nom} - Encadrant</span>
              {nonLus > 0 && !isMinimized && (
                <span style={{
                  background: '#ef4444',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 'bold'
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

          {!isMinimized && (
            <>
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: '#f9fafb'
              }}>
                {messages.length === 0 ? (
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