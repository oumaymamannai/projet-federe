import { useState, useEffect, useRef } from 'react';
import { messageAPI } from '../../services/messageService';
const token = localStorage.getItem('gradflow_token');
const userId = token ? JSON.parse(atob(token.split('.')[1])).id : null;

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [soutenanceActive, setSoutenanceActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contenu, setContenu] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const res = await messageAPI.getConversations();
      setConversations(res.data);
    } catch (err) {
      console.error('Erreur conversations:', err);
    }
  };

  const fetchMessages = async (soutenanceId) => {
    setLoading(true);
    try {
      const res = await messageAPI.getMessages(soutenanceId);
      setMessages(res.data);
    } catch (err) {
      console.error('Erreur messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnvoyer = async (e) => {
    e.preventDefault();
    if (!contenu.trim() || !soutenanceActive) return;
    try {
      await messageAPI.envoyerMessage(soutenanceActive.soutenance_id, contenu);
      setContenu('');
      await fetchMessages(soutenanceActive.soutenance_id);
      await fetchConversations();
    } catch (err) {
      console.error('Erreur envoi:', err);
    }
  };

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    if (soutenanceActive) fetchMessages(soutenanceActive.soutenance_id);
  }, [soutenanceActive]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatHeure = (d) => d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>

      {/* Liste conversations */}
      <div style={{ width: 280, borderRight: '1px solid #e5e7eb', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Messages</h2>
        </div>
        {conversations.length === 0 && (
          <p style={{ padding: 16, color: '#6b7280', fontSize: 14 }}>Aucune conversation</p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.soutenance_id}
            onClick={() => setSoutenanceActive(conv)}
            style={{
              padding: '12px 16px', cursor: 'pointer',
              borderBottom: '1px solid #f3f4f6',
              background: soutenanceActive?.soutenance_id === conv.soutenance_id ? '#f5f3ff' : 'white',
              borderLeft: soutenanceActive?.soutenance_id === conv.soutenance_id
                ? '3px solid #7c3aed' : '3px solid transparent',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{conv.prenom} {conv.nom}</span>
              {conv.non_lus > 0 && (
                <span style={{ background: '#7c3aed', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                  {conv.non_lus}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{conv.sujet || 'Soutenance'}</div>
            {conv.dernier_message && (
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {conv.dernier_message}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Zone chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!soutenanceActive ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
            Sélectionnez une conversation
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#E1F5EE', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 600, fontSize: 13, color: '#0F6E56'
              }}>
                {soutenanceActive.prenom?.[0]}{soutenanceActive.nom?.[0]}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {soutenanceActive.prenom} {soutenanceActive.nom}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {soutenanceActive.sujet}
                  {soutenanceActive.date_soutenance ? ` · ${formatDate(soutenanceActive.date_soutenance)}` : ''}
                  {soutenanceActive.salle ? ` · ${soutenanceActive.salle}` : ''}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {loading && <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>Chargement...</p>}
              {messages.map((msg) => {
                const estMoi = msg.user_id === userId;
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: estMoi ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                    <div style={{ maxWidth: '65%' }}>
                      {!estMoi && (
                        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2, marginLeft: 4 }}>
                          {msg.prenom} {msg.nom}
                        </div>
                      )}
                      <div style={{
                        padding: '9px 13px',
                        borderRadius: estMoi ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: estMoi ? '#7c3aed' : '#f3f4f6',
                        color: estMoi ? '#fff' : '#111',
                        fontSize: 14, lineHeight: 1.5,
                      }}>
                        {msg.contenu}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, textAlign: estMoi ? 'right' : 'left' }}>
                        {formatHeure(msg.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleEnvoyer} style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid #e5e7eb', alignItems: 'center' }}>
              <input
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                placeholder="Écrire un message..."
                style={{ flex: 1, borderRadius: 20, border: '1px solid #e5e7eb', padding: '9px 16px', fontSize: 14, outline: 'none', background: '#f9fafb' }}
              />
              <button
                type="submit"
                disabled={!contenu.trim()}
                style={{
                  background: contenu.trim() ? '#7c3aed' : '#e5e7eb',
                  color: contenu.trim() ? '#fff' : '#9ca3af',
                  border: 'none', borderRadius: '50%', width: 38, height: 38,
                  cursor: contenu.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}