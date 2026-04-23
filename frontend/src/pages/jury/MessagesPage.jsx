import { useState, useEffect, useRef, useCallback } from 'react';
import { messageAPI, getMessageFileUrl } from '../../services/messageService';
import { Search, X, ArrowLeft, MessageSquare } from 'lucide-react';

const token = localStorage.getItem('gradflow_token');
const userId = token ? JSON.parse(atob(token.split('.')[1])).id : null;
const userRole = token ? JSON.parse(atob(token.split('.')[1])).role : null;

const C = {
  bg:            '#f8f3ff',
  surface:       '#ffffff',
  surfaceHover:  '#faf5ff',
  surfaceActive: '#f3e8ff',
  border:        '#e9dfff',
  borderLight:   '#f0e6ff',
  accent:        '#8b5cf6',
  accentGlow:    'rgba(139,92,246,0.15)',
  accentSoft:    'rgba(139,92,246,0.08)',
  text:          '#1a1033',
  textMuted:     '#6b5b7e',
  textFaint:     '#b4a5d0',
  bubble:        '#f5efff',
  green:         '#10b981',
};

const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
  .msg-root, .msg-root * { box-sizing: border-box; }
  .msg-root { font-family: 'DM Sans', sans-serif; }
  .msg-scroller::-webkit-scrollbar { width: 4px; }
  .msg-scroller::-webkit-scrollbar-track { background: transparent; }
  .msg-scroller::-webkit-scrollbar-thumb { background: ${C.borderLight}; border-radius: 4px; }
  .conv-row { transition: background 0.12s ease, border-color 0.12s ease; }
  .conv-row:hover { background: ${C.surfaceHover} !important; }
  .send-btn { transition: background 0.18s ease, transform 0.12s ease, box-shadow 0.18s ease; }
  .send-btn:hover:not(:disabled) { filter: brightness(1.05); transform: scale(1.06); box-shadow: 0 0 24px rgba(139,92,246,0.35) !important; }
  .send-btn:active:not(:disabled) { transform: scale(0.95); }
  .msg-textarea { transition: border-color 0.18s ease, box-shadow 0.18s ease; }
  .msg-textarea:focus { outline: none; border-color: ${C.accent} !important; box-shadow: 0 0 0 3px ${C.accentGlow} !important; }
  .msg-textarea::placeholder { color: ${C.textFaint}; }
  @keyframes bubbleIn { from { opacity: 0; transform: translateY(6px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
  .bubble-anim { animation: bubbleIn 0.2s cubic-bezier(0.34,1.4,0.64,1) both; }
  @keyframes fadeSlide { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }
  .conv-anim { animation: fadeSlide 0.22s ease both; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 0.65s linear infinite; }
  @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.35); } 60% { box-shadow: 0 0 0 5px rgba(16,185,129,0); } }
  .online-dot { animation: pulse 2.2s infinite; }
  @keyframes badgePop { 0% { transform: scale(0.6); opacity: 0; } 70% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
  .badge-pop { animation: badgePop 0.25s cubic-bezier(0.34,1.4,0.64,1) both; }
  .msg-chat { display: flex; flex-direction: column; flex: 1; overflow: hidden; min-width: 0; }
  /* ── MOBILE ── */
  .msg-back-btn { display: none; }

  @media (max-width: 768px) {
    .msg-layout {
      flex-direction: column !important;
      height: calc(100vh - 60px) !important;
    }
    .msg-sidebar {
      width: 100% !important;
      flex-shrink: 0 !important;
      border-right: none !important;
      border-bottom: 1px solid ${C.border};
    }
    .msg-sidebar.hidden { display: none !important; }
    .msg-chat { display: none; flex-direction: column; overflow: hidden; }
    .msg-chat.visible { display: flex !important; flex: 1; overflow: hidden; }
    .msg-back-btn {
      display: flex !important;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: ${C.surface};
      border: none;
      border-bottom: 1px solid ${C.border};
      color: ${C.accent};
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      flex-shrink: 0;
      width: 100%;
      font-family: 'DM Sans', sans-serif;
    }
  }
`;

function emitUnreadCount(count) {
  window.dispatchEvent(new CustomEvent('messages-non-lus-updated', { detail: { count } }));
}

function Avatar({ prenom, nom, size = 36, accent = false, online = false }) {
  const initials = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
  const h = ((prenom?.charCodeAt(0) || 72) * 41 + (nom?.charCodeAt(0) || 65) * 19) % 360;
  const bg = accent
    ? `linear-gradient(135deg, ${C.accent}, #a78bfa)`
    : `linear-gradient(135deg, hsl(${h},65%,65%), hsl(${(h+45)%360},60%,60%))`;
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.36, fontWeight: 700, color: '#fff', letterSpacing: '0.01em',
        boxShadow: accent ? `0 0 0 2px ${C.accent}55` : 'none',
      }}>{initials}</div>
      {online && (
        <div className="online-dot" style={{
          position: 'absolute', bottom: 0, right: 0,
          width: Math.round(size * 0.28), height: Math.round(size * 0.28),
          borderRadius: '50%', background: C.green, border: `2px solid ${C.surface}`,
        }} />
      )}
    </div>
  );
}

function DateDivider({ date }) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const label = d.toDateString() === today.toDateString()     ? "Aujourd'hui"
              : d.toDateString() === yesterday.toDateString() ? 'Hier'
              : d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, margin:'24px 0 14px' }}>
      <div style={{ flex:1, height:1, background:C.border }} />
      <span style={{
        fontSize:11, color:C.textMuted, fontWeight:600,
        textTransform:'uppercase', letterSpacing:'0.07em',
        padding:'3px 12px', background:C.surface,
        border:`1px solid ${C.border}`, borderRadius:20,
      }}>{label}</span>
      <div style={{ flex:1, height:1, background:C.border }} />
    </div>
  );
}

function Badge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <div key={count} className="badge-pop" style={{
      background: C.accent, color: '#fff',
      fontSize: 10, fontWeight: 700,
      fontFamily: "'DM Mono', monospace",
      padding: '2px 7px', borderRadius: 10,
      minWidth: 20, textAlign: 'center',
      boxShadow: `0 0 8px ${C.accentGlow}`,
    }}>
      {count > 99 ? '99+' : count}
    </div>
  );
}

export default function MessagesPage() {
  const [conversations, setConversations]       = useState([]);
  const [soutenanceActive, setSoutenanceActive] = useState(null);
  const [messages, setMessages]                 = useState([]);
  const [contenu, setContenu]                   = useState('');
  const [fichier, setFichier]                   = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [sending, setSending]                   = useState(false);
  const [searchTerm, setSearchTerm]             = useState('');

  const messagesEndRef      = useRef(null);
  const inputRef            = useRef(null);
  const prevCount           = useRef(0);
  const soutenanceActiveRef = useRef(null);
  useEffect(() => { soutenanceActiveRef.current = soutenanceActive; }, [soutenanceActive]);

  const totalUnread = conversations.reduce((s, c) => s + (c.non_lus || 0), 0);
  useEffect(() => { emitUnreadCount(totalUnread); }, [totalUnread]);

  const filteredConversations = conversations.filter(conv =>
    `${conv.prenom} ${conv.nom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchConvs = useCallback(async () => {
    try {
      const r = await messageAPI.getConversations();
      setConversations(() => {
        const activeId = soutenanceActiveRef.current?.soutenance_id;
        return r.data.map(sc =>
          activeId && sc.soutenance_id === activeId ? { ...sc, non_lus: 0 } : sc
        );
      });
    } catch {}
  }, []);

  const fetchMsgs = useCallback(async (id, silent = false) => {
    if (!silent) setLoading(true);
    try { const r = await messageAPI.getMessages(id); setMessages(r.data); }
    catch {} finally { if (!silent) setLoading(false); }
  }, []);

  const selectConv = useCallback(async (conv) => {
    setSoutenanceActive(conv);
    if (conv.non_lus > 0) {
      setConversations(prev =>
        prev.map(c => c.soutenance_id === conv.soutenance_id ? { ...c, non_lus: 0 } : c)
      );
      messageAPI.marquerCommeLu(conv.soutenance_id).catch(console.error);
    }
    await fetchMsgs(conv.soutenance_id);
  }, [fetchMsgs]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!contenu.trim() && !fichier) || !soutenanceActive || sending) return;
    setSending(true);
    const txt = contenu.trim();
    setContenu('');
    setFichier(null);
    if (inputRef.current) inputRef.current.style.height = 'auto';
    try {
      if (fichier) {
        await messageAPI.envoyerMessageAvecFichier(soutenanceActive.soutenance_id, txt, fichier);
      } else {
        await messageAPI.envoyerMessage(soutenanceActive.soutenance_id, txt);
      }
      await fetchMsgs(soutenanceActive.soutenance_id, true);
      await fetchConvs();
      inputRef.current?.focus();
    } catch {
      setContenu(txt);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  useEffect(() => { fetchConvs(); }, [fetchConvs]);

  useEffect(() => {
    if (messages.length > prevCount.current)
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    prevCount.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (!soutenanceActive) return;
    const id = setInterval(async () => {
      await fetchMsgs(soutenanceActive.soutenance_id, true);
      await fetchConvs();
    }, 8000);
    return () => clearInterval(id);
  }, [soutenanceActive, fetchMsgs, fetchConvs]);

  const grouped = messages.reduce((acc, msg) => {
    const k = new Date(msg.created_at).toDateString();
    if (!acc[k]) acc[k] = [];
    acc[k].push(msg);
    return acc;
  }, {});

  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }) : '';
  const fmtShort = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const today = new Date();
    return date.toDateString() === today.toDateString()
      ? date.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })
      : date.toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
  };

  return (
    <>
      <style>{globalCss}</style>
      <div className="msg-root msg-layout" style={{
        display: 'flex',
        height: '100vh',
        background: C.bg,
        color: C.text,
        overflow: 'hidden',
      }}>

        {/* ── SIDEBAR CONVERSATIONS ── */}
        <aside className={`msg-sidebar msg-scroller${soutenanceActive ? ' hidden' : ''}`} style={{
          width: 320,
          flexShrink: 0,
          background: C.surface,
          borderRight: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}>
          <div style={{
            padding: '22px 20px 16px',
            borderBottom: `1px solid ${C.border}`,
            position: 'sticky', top: 0, zIndex: 2,
            background: C.surface,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize:18, fontWeight:700, color:C.text, letterSpacing:'-0.025em', lineHeight:1.2 }}>Messages</h2>
                <p style={{ fontSize:12, color:C.textMuted, marginTop:3 }}>
                  {userRole === 'etudiant' ? 'Votre encadreur' : 'Vos étudiants encadrés'}
                </p>
              </div>
              {totalUnread > 0 && (
                <div key={totalUnread} className="badge-pop" style={{
                  background: C.accent, color:'#fff',
                  fontSize:11, fontWeight:700, fontFamily:"'DM Mono', monospace",
                  padding:'3px 9px', borderRadius:20, boxShadow:`0 0 12px ${C.accentGlow}`,
                }}>
                  {totalUnread}
                </div>
              )}
            </div>
            <div style={{
              display:'flex', alignItems:'center', gap:8, background:C.bg,
              borderRadius:12, padding:'6px 12px', border:`1px solid ${C.border}`,
            }}>
              <Search size={16} color={C.textMuted} />
              <input
                type="text" placeholder="Rechercher un étudiant..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:13, color:C.text, fontFamily:"'DM Sans', sans-serif" }}
                autoComplete="off"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{ background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', padding:2, borderRadius:'50%', color:C.textMuted }}>
                  <X size={14} />
                </button>
              )}
            </div>
            {searchTerm && filteredConversations.length === 0 && (
              <div style={{ marginTop:12, fontSize:12, color:C.textMuted, textAlign:'center', padding:'8px', background:C.accentSoft, borderRadius:8 }}>
                Aucun étudiant trouvé pour "{searchTerm}"
              </div>
            )}
          </div>

          <div style={{ flex:1 }}>
            {filteredConversations.length === 0 && !searchTerm ? (
              <div style={{ padding:'44px 24px', textAlign:'center', color:C.textMuted }}>
                <div style={{ width:52, height:52, borderRadius:16, background:C.accentSoft, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, margin:'0 auto 12px' }}>💬</div>
                <p style={{ fontSize:13, lineHeight:1.65 }}>
                  {userRole === 'etudiant' ? 'Aucune conversation avec votre encadreur' : 'Aucun étudiant encadré pour le moment'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv, i) => {
                const isActive  = soutenanceActive?.soutenance_id === conv.soutenance_id;
                const hasUnread = conv.non_lus > 0;
                return (
                  <div
                    key={conv.soutenance_id}
                    className="conv-row conv-anim"
                    onClick={() => selectConv(conv)}
                    style={{
                      padding:'14px 18px', cursor:'pointer',
                      borderBottom:`1px solid ${C.border}`,
                      background: isActive ? C.surfaceActive : 'transparent',
                      borderLeft:`3px solid ${isActive ? C.accent : 'transparent'}`,
                      animationDelay:`${i * 0.045}s`,
                    }}
                  >
                    <div style={{ display:'flex', gap:11, alignItems:'flex-start' }}>
                      <Avatar prenom={conv.prenom} nom={conv.nom} size={42} accent={isActive} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                          <span style={{ fontWeight: hasUnread ? 700 : 600, fontSize:14, color: isActive ? C.accent : C.text }}>
                            {conv.prenom} {conv.nom}
                          </span>
                          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                            {conv.dernier_message_at && (
                              <span style={{ fontSize:10, color:C.textMuted, fontFamily:"'DM Mono', monospace" }}>
                                {fmtShort(conv.dernier_message_at)}
                              </span>
                            )}
                            <Badge count={conv.non_lus} />
                          </div>
                        </div>
                        <div style={{ fontSize:11, color:C.accent, fontWeight:600, marginBottom:4, letterSpacing:'0.02em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {conv.sujet || 'Soutenance'}
                        </div>
                        {conv.dernier_message && (
                          <div style={{ fontSize:12, color: hasUnread ? C.text : C.textMuted, fontWeight: hasUnread ? 600 : 500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {conv.dernier_message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ── ZONE CHAT ── */}
        <div className={`msg-chat${soutenanceActive ? ' visible' : ''}`}>
          {soutenanceActive && (
    <button className="msg-back-btn" onClick={() => setSoutenanceActive(null)}>
      <ArrowLeft size={16} />
      Retour aux conversations
    </button>)}

          {!soutenanceActive ? (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:40 }}>
              <div style={{ width:80, height:80, borderRadius:24, background:C.accentSoft, border:`1px solid ${C.accentGlow}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, boxShadow:`0 0 50px ${C.accentGlow}` }}>💬</div>
              <div style={{ textAlign:'center' }}>
                <p style={{ fontSize:17, fontWeight:700, color:C.text, marginBottom:6 }}>Sélectionnez une conversation</p>
                <p style={{ fontSize:13, color:C.textMuted, lineHeight:1.65 }}>
                  {userRole === 'etudiant' ? 'Échangez avec votre encadreur de soutenance' : 'Échangez avec vos étudiants encadrés'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header chat */}
              <div style={{ padding:'14px 24px', borderBottom:`1px solid ${C.border}`, background:C.surface, display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
                <Avatar prenom={soutenanceActive.prenom} nom={soutenanceActive.nom} size={44} online />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:C.text, letterSpacing:'-0.015em', marginBottom:4 }}>
                    {soutenanceActive.prenom} {soutenanceActive.nom}
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
                    <span style={{ fontSize:11, fontWeight:600, color:C.accent, background:C.accentSoft, padding:'2px 9px', borderRadius:6, border:`1px solid ${C.accentGlow}` }}>
                      {userRole === 'etudiant' ? 'Encadreur' : 'Étudiant'}
                    </span>
                    {[
                      soutenanceActive.sujet,
                      soutenanceActive.date_soutenance ? new Date(soutenanceActive.date_soutenance).toLocaleDateString('fr-FR', { day:'numeric', month:'short' }) : null,
                      soutenanceActive.salle ? `Salle ${soutenanceActive.salle}` : null,
                    ].filter(Boolean).map((s, i) => (
                      <span key={i} style={{ fontSize:12, color:C.textMuted }}>· {s}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 13px', background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:20, flexShrink:0 }}>
                  <div className="online-dot" style={{ width:7, height:7, borderRadius:'50%', background:C.green, flexShrink:0 }} />
                  <span style={{ fontSize:11, color:C.green, fontWeight:600 }}>En ligne</span>
                </div>
              </div>

              {/* Messages */}
              <div className="msg-scroller" style={{ flex:1, overflowY:'auto', padding:'8px 24px 20px', background:C.bg }}>
                {loading ? (
                  <div style={{ textAlign:'center', paddingTop:64 }}>
                    <div className="spin" style={{ width:28, height:28, margin:'0 auto 12px', border:`2px solid ${C.border}`, borderTopColor:C.accent, borderRadius:'50%' }} />
                    <p style={{ fontSize:13, color:C.textMuted }}>Chargement…</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign:'center', paddingTop:64, color:C.textMuted }}>
                    <div style={{ fontSize:42, marginBottom:12 }}>✉️</div>
                    <p style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Aucun message</p>
                    <p style={{ fontSize:12, color:C.textFaint }}>Lancez la conversation !</p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([dateKey, msgs]) => (
                    <div key={dateKey}>
                      <DateDivider date={msgs[0].created_at} />
                      {msgs.map((msg, idx) => {
                        const isMe     = msg.user_id === userId;
                        const prevSame = idx > 0 && msgs[idx-1].user_id === msg.user_id;
                        const nextSame = idx < msgs.length-1 && msgs[idx+1].user_id === msg.user_id;
                        const bRadius  = isMe
                          ? `18px 18px ${nextSame ? '16px' : '4px'} 18px`
                          : `18px 18px 18px ${nextSame ? '16px' : '4px'}`;
                        return (
                          <div key={msg.id} className="bubble-anim" style={{ display:'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: nextSame ? 3 : 10, alignItems:'flex-end', gap:8 }}>
                            {!isMe && (
                              <div style={{ width:32, flexShrink:0 }}>
                                {!nextSame ? <Avatar prenom={msg.prenom} nom={msg.nom} size={32} /> : <div style={{width:32}}/>}
                              </div>
                            )}
                            <div style={{ maxWidth:'75%' }}>
                              {!isMe && !prevSame && (
                                <div style={{ fontSize:11, color:C.textMuted, fontWeight:600, marginBottom:4, marginLeft:3 }}>
                                  {msg.prenom} {msg.nom}
                                </div>
                              )}
                              <div style={{
                                padding:'10px 15px', borderRadius: bRadius,
                                background: isMe ? `linear-gradient(135deg, ${C.accent}, #a78bfa)` : C.bubble,
                                color: isMe ? '#fff' : C.text, fontSize:14, lineHeight:1.58,
                                border: isMe ? 'none' : `1px solid ${C.border}`,
                                boxShadow: isMe ? '0 4px 20px rgba(139,92,246,0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
                                wordBreak:'break-word', whiteSpace:'pre-wrap',
                              }}>
                                {msg.contenu}
                                {msg.piece_jointe && (
                                  <div style={{ marginTop: msg.contenu ? 8 : 0 }}>
                                    <a href={getMessageFileUrl(msg.piece_jointe)} target="_blank" rel="noopener noreferrer" style={{
                                      display:'inline-flex', alignItems:'center', gap:6,
                                      color: isMe ? '#fff' : C.accent, textDecoration:'none',
                                      border: isMe ? '1px solid rgba(255,255,255,0.45)' : '1px solid rgba(139,92,246,0.25)',
                                      padding:'6px 8px', borderRadius:8, fontSize:12, fontWeight:600,
                                      background: isMe ? 'rgba(255,255,255,0.12)' : '#fff',
                                    }}>
                                      📎 {msg.piece_jointe.split('/').pop()}
                                    </a>
                                  </div>
                                )}
                              </div>
                              {!nextSame && (
                                <div style={{ fontSize:10, color:C.textFaint, marginTop:4, fontFamily:"'DM Mono', monospace", textAlign: isMe ? 'right' : 'left', paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0, display:'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems:'center', gap:4 }}>
                                  {fmtTime(msg.created_at)}
                                  {isMe && <span style={{ color: msg.lu ? C.accent : C.textFaint, fontSize:12 }}>{msg.lu ? '✓✓' : '✓'}</span>}
                                </div>
                              )}
                            </div>
                            {isMe && (
                              <div style={{ width:32, flexShrink:0 }}>
                                {!nextSame ? <Avatar prenom={msg.prenom} nom={msg.nom} size={32} accent /> : <div style={{width:32}}/>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding:'14px 16px', borderTop:`1px solid ${C.border}`, background:C.surface, display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                <label htmlFor="file-input" style={{ cursor:'pointer', color:C.accent, fontSize:12, fontWeight:600, border:'1px dashed '+C.accent, padding:'8px 10px', borderRadius:10, display:'flex', alignItems:'center', gap:4, flexShrink:0, whiteSpace:'nowrap' }}>
                  📎
                </label>
                <input id="file-input" type="file" style={{ display:'none' }} onChange={(e) => setFichier(e.target.files?.[0] ?? null)} />
                <textarea
                  ref={inputRef}
                  value={contenu}
                  onChange={(e) => {
                    setContenu(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrire un message…"
                  rows={1}
                  className="msg-textarea"
                  style={{ flex:1, background:C.bg, border:`1px solid ${C.border}`, borderRadius:16, padding:'12px 14px', fontSize:14, color:C.text, resize:'none', maxHeight:120, lineHeight:1.58, fontFamily:"'DM Sans', sans-serif", overflowY:'auto' }}
                />
                <button className="send-btn" onClick={handleSend}
                  disabled={(!contenu || !contenu.trim()) && !fichier || sending}
                  style={{
                    width:44, height:44, flexShrink:0, borderRadius:14, border:'none',
                    background: (!contenu.trim() && !fichier) || sending ? C.border : `linear-gradient(135deg, ${C.accent}, #a78bfa)`,
                    color: (!contenu.trim() && !fichier) || sending ? C.textMuted : '#fff',
                    cursor: (!contenu.trim() && !fichier) || sending ? 'default' : 'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow: (!contenu.trim() && !fichier) || sending ? 'none' : '0 4px 16px rgba(139,92,246,0.3)',
                  }}
                >
                  {sending
                    ? <div className="spin" style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.25)', borderTopColor:'#fff', borderRadius:'50%' }} />
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  }
                </button>
              </div>
              {fichier && (
                <div style={{ padding:'0 16px 10px', fontSize:12, color:C.textMuted, display:'flex', alignItems:'center', gap:8, background:C.surface }}>
                  <span>📎 {fichier.name}</span>
                  <button type="button" onClick={() => setFichier(null)} style={{ border:'none', background:'transparent', color:C.accent, cursor:'pointer', fontWeight:700 }}>✕</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}