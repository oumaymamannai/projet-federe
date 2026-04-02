import { useState, useEffect, useRef, useCallback } from 'react';
import { messageAPI, getMessageFileUrl } from '../../services/messageService';

const token = localStorage.getItem('gradflow_token');
const userId = token ? JSON.parse(atob(token.split('.')[1])).id : null;
const userRole = token ? JSON.parse(atob(token.split('.')[1])).role : null;

const C = {
  bg:            '#f8f3ff',      // violet clair
  surface:       '#ffffff',      // blanc
  surfaceHover:  '#faf5ff',      // violet très clair
  surfaceActive: '#f3e8ff',      // violet clair actif
  border:        '#e9dfff',      // bordure violet pâle
  borderLight:   '#f0e6ff',      // bordure plus claire
  accent:        '#8b5cf6',      // violet vif
  accentGlow:    'rgba(139,92,246,0.15)',
  accentSoft:    'rgba(139,92,246,0.08)',
  text:          '#1a1a2e',      // texte foncé
  textMuted:     '#6b5b7e',      // texte gris-violet
  textFaint:     '#b4a5d0',      // texte très clair
  bubble:        '#f5efff',      // bulle violet clair
  green:         '#10b981',      // vert
  white:         '#ffffff',
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
  .send-btn:hover:not(:disabled) {
    filter: brightness(1.05);
    transform: scale(1.06);
    box-shadow: 0 0 24px rgba(139,92,246,0.35) !important;
  }
  .send-btn:active:not(:disabled) { transform: scale(0.95); }

  .msg-textarea { transition: border-color 0.18s ease, box-shadow 0.18s ease; }
  .msg-textarea:focus { outline: none; border-color: ${C.accent} !important; box-shadow: 0 0 0 3px ${C.accentGlow} !important; }
  .msg-textarea::placeholder { color: ${C.textFaint}; }

  @keyframes bubbleIn {
    from { opacity: 0; transform: translateY(6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .bubble-anim { animation: bubbleIn 0.2s cubic-bezier(0.34,1.4,0.64,1) both; }

  @keyframes fadeSlide {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .conv-anim { animation: fadeSlide 0.22s ease both; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 0.65s linear infinite; }

  @keyframes pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.35); }
    60%      { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
  }
  .online-dot { animation: pulse 2.2s infinite; }

  @keyframes typeBounce {
    0%,60%,100% { transform: translateY(0); }
    30% { transform: translateY(-4px); }
  }
  .td1 { animation: typeBounce 1.2s infinite ease-in-out; }
  .td2 { animation: typeBounce 1.2s 0.18s infinite ease-in-out; }
  .td3 { animation: typeBounce 1.2s 0.36s infinite ease-in-out; }
`;

/* ─── Avatar ─── */
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
          borderRadius: '50%', background: C.green,
          border: `2px solid ${C.surface}`,
        }} />
      )}
    </div>
  );
}

/* ─── Date Divider ─── */
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
        fontSize:11, color:C.textMuted, fontWeight:500,
        textTransform:'uppercase', letterSpacing:'0.07em',
        padding:'3px 12px', background:C.surface,
        border:`1px solid ${C.border}`, borderRadius:20,
      }}>{label}</span>
      <div style={{ flex:1, height:1, background:C.border }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function MessagesPage() {
  const [conversations, setConversations]     = useState([]);
  const [soutenanceActive, setSoutenanceActive] = useState(null);
  const [messages, setMessages]               = useState([]);
  const [contenu, setContenu]                 = useState('');
  const [fichier, setFichier]                 = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [sending, setSending]                 = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const prevCount      = useRef(0);

  const fetchConvs = useCallback(async () => {
    try { const r = await messageAPI.getConversations(); setConversations(r.data); }
    catch {}
  }, []);

  const fetchMsgs = useCallback(async (id, silent = false) => {
    if (!silent) setLoading(true);
    try { const r = await messageAPI.getMessages(id); setMessages(r.data); }
    catch {} finally { if (!silent) setLoading(false); }
  }, []);

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!contenu.trim() && !fichier) || !soutenanceActive || sending) return;

    setSending(true);
    const txt = contenu.trim();
    setContenu('');
    setFichier(null);

    if (inputRef.current) { inputRef.current.style.height = 'auto'; }

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
      setFichier(fichier);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const selectConv = (conv) => {
    setSoutenanceActive(conv);
    setConversations(prev =>
      prev.map(c => c.soutenance_id === conv.soutenance_id ? { ...c, non_lus: 0 } : c)
    );
  };

  useEffect(() => { fetchConvs(); }, [fetchConvs]);

  useEffect(() => {
    if (soutenanceActive) fetchMsgs(soutenanceActive.soutenance_id);
  }, [soutenanceActive, fetchMsgs]);

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

  /* Grouper par date */
  const grouped = messages.reduce((acc, msg) => {
    const k = new Date(msg.created_at).toDateString();
    if (!acc[k]) acc[k] = [];
    acc[k].push(msg);
    return acc;
  }, {});

  const fmtTime = (d) => d
    ? new Date(d).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })
    : '';

  const fmtShort = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const today = new Date();
    return date.toDateString() === today.toDateString()
      ? date.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })
      : date.toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
  };

  const totalUnread = conversations.reduce((s, c) => s + (c.non_lus || 0), 0);

  /* ═══════════ RENDER ═══════════ */
  return (
    <>
      <style>{globalCss}</style>
      <div className="msg-root" style={{
        display:'flex', height:'calc(100vh - 80px)',
        background: C.bg, color: C.text, overflow:'hidden',
      }}>

        {/* ══════ SIDEBAR ══════ */}
        <aside className="msg-scroller" style={{
          width: 300, flexShrink: 0,
          background: C.surface,
          borderRight: `1px solid ${C.border}`,
          display:'flex', flexDirection:'column', overflowY:'auto',
        }}>
          {/* Header */}
          <div style={{
            padding:'22px 20px 16px',
            borderBottom:`1px solid ${C.border}`,
            position:'sticky', top:0, zIndex:2,
            background: C.surface,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <h2 style={{
                  fontSize:18, fontWeight:700, color:C.text,
                  letterSpacing:'-0.025em', lineHeight:1.2,
                }}>Messages</h2>
                <p style={{ fontSize:12, color:C.textMuted, marginTop:3 }}>
                  {userRole === 'etudiant' ? 'Votre encadreur' : 'Vos étudiants encadrés'}
                </p>
              </div>
              {totalUnread > 0 && (
                <div style={{
                  background: C.accent, color:'#fff',
                  fontSize:11, fontWeight:700,
                  fontFamily:"'DM Mono', monospace",
                  padding:'3px 9px', borderRadius:20,
                  boxShadow:`0 0 12px ${C.accentGlow}`,
                }}>
                  {totalUnread}
                </div>
              )}
            </div>
          </div>

          {/* Liste */}
          <div style={{ flex:1 }}>
            {conversations.length === 0 ? (
              <div style={{ padding:'44px 24px', textAlign:'center', color:C.textMuted }}>
                <div style={{
                  width:52, height:52, borderRadius:16,
                  background:C.accentSoft,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:22, margin:'0 auto 12px',
                }}>💬</div>
                <p style={{ fontSize:13, lineHeight:1.65 }}>
                  {userRole === 'etudiant'
                    ? 'Aucune conversation avec votre encadreur'
                    : 'Aucun étudiant encadré pour le moment'}
                </p>
              </div>
            ) : conversations.map((conv, i) => {
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
                      <div style={{
                        display:'flex', justifyContent:'space-between',
                        alignItems:'center', marginBottom:3,
                      }}>
                        <span style={{
                          fontWeight: hasUnread ? 700 : 500,
                          fontSize:14,
                          color: isActive ? C.accent : C.text,
                        }}>
                          {conv.prenom} {conv.nom}
                        </span>
                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                          {conv.dernier_message_at && (
                            <span style={{
                              fontSize:10, color:C.textMuted,
                              fontFamily:"'DM Mono', monospace",
                            }}>{fmtShort(conv.dernier_message_at)}</span>
                          )}
                          {hasUnread && (
                            <div style={{
                              background:C.accent, color:'#fff',
                              fontSize:10, fontWeight:700,
                              fontFamily:"'DM Mono', monospace",
                              padding:'2px 7px', borderRadius:10,
                              minWidth:20, textAlign:'center',
                            }}>{conv.non_lus > 99 ? '99+' : conv.non_lus}</div>
                          )}
                        </div>
                      </div>
                      <div style={{
                        fontSize:11, color:C.accent,
                        fontWeight:600, marginBottom:4,
                        letterSpacing:'0.02em',
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                      }}>{conv.sujet || 'Soutenance'}</div>
                      {conv.dernier_message && (
                        <div style={{
                          fontSize:12,
                          color: hasUnread ? C.text : C.textMuted,
                          fontWeight: hasUnread ? 500 : 400,
                          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                        }}>{conv.dernier_message}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ══════ ZONE CHAT ══════ */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {!soutenanceActive ? (
            /* État vide */
            <div style={{
              flex:1, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:16, padding:40,
            }}>
              <div style={{
                width:80, height:80, borderRadius:24,
                background:C.accentSoft,
                border:`1px solid ${C.accentGlow}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:36,
                boxShadow:`0 0 50px ${C.accentGlow}`,
              }}>💬</div>
              <div style={{ textAlign:'center' }}>
                <p style={{ fontSize:17, fontWeight:600, color:C.text, marginBottom:6, letterSpacing:'-0.01em' }}>
                  Sélectionnez une conversation
                </p>
                <p style={{ fontSize:13, color:C.textMuted, lineHeight:1.65 }}>
                  {userRole === 'etudiant'
                    ? 'Échangez avec votre encadreur de mémoire'
                    : 'Échangez avec vos étudiants encadrés'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Header ── */}
              <div style={{
                padding:'14px 24px',
                borderBottom:`1px solid ${C.border}`,
                background:C.surface,
                display:'flex', alignItems:'center', gap:14,
                flexShrink:0,
              }}>
                <Avatar
                  prenom={soutenanceActive.prenom}
                  nom={soutenanceActive.nom}
                  size={44} online
                />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{
                    fontWeight:700, fontSize:15, color:C.text,
                    letterSpacing:'-0.015em', marginBottom:4,
                  }}>
                    {soutenanceActive.prenom} {soutenanceActive.nom}
                  </div>
                  <div style={{
                    display:'flex', flexWrap:'wrap', gap:6, alignItems:'center',
                  }}>
                    <span style={{
                      fontSize:11, fontWeight:600, color:C.accent,
                      background:C.accentSoft,
                      padding:'2px 9px', borderRadius:6,
                      border:`1px solid ${C.accentGlow}`,
                    }}>
                      {userRole === 'etudiant' ? 'Encadreur' : 'Étudiant'}
                    </span>
                    {[soutenanceActive.sujet,
                      soutenanceActive.date_soutenance
                        ? new Date(soutenanceActive.date_soutenance).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})
                        : null,
                      soutenanceActive.salle ? `Salle ${soutenanceActive.salle}` : null,
                    ].filter(Boolean).map((s, i) => (
                      <span key={i} style={{ fontSize:12, color:C.textMuted }}>
                        · {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{
                  display:'flex', alignItems:'center', gap:7,
                  padding:'6px 13px',
                  background:'rgba(16,185,129,0.07)',
                  border:'1px solid rgba(16,185,129,0.15)',
                  borderRadius:20,
                }}>
                  <div className="online-dot" style={{
                    width:7, height:7, borderRadius:'50%',
                    background:C.green, flexShrink:0,
                  }} />
                  <span style={{ fontSize:11, color:C.green, fontWeight:600 }}>En ligne</span>
                </div>
              </div>

              {/* ── Messages ── */}
              <div className="msg-scroller" style={{
                flex:1, overflowY:'auto',
                padding:'8px 36px 20px',
                background: C.bg,
              }}>
                {loading ? (
                  <div style={{ textAlign:'center', paddingTop:64 }}>
                    <div className="spin" style={{
                      width:28, height:28, margin:'0 auto 12px',
                      border:`2px solid ${C.border}`,
                      borderTopColor:C.accent, borderRadius:'50%',
                    }} />
                    <p style={{ fontSize:13, color:C.textMuted }}>Chargement…</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign:'center', paddingTop:64, color:C.textMuted }}>
                    <div style={{ fontSize:42, marginBottom:12 }}>✉️</div>
                    <p style={{ fontSize:14, fontWeight:500, marginBottom:4 }}>Aucun message</p>
                    <p style={{ fontSize:12, color:C.textFaint }}>Lancez la conversation !</p>
                  </div>
                ) : null}

                {Object.entries(grouped).map(([dateKey, msgs]) => (
                  <div key={dateKey}>
                    <DateDivider date={msgs[0].created_at} />
                    {msgs.map((msg, idx) => {
                      const isMe       = msg.user_id === userId;
                      const prevSame   = idx > 0 && msgs[idx-1].user_id === msg.user_id;
                      const nextSame   = idx < msgs.length-1 && msgs[idx+1].user_id === msg.user_id;
                      const showAvatar = !isMe && !nextSame;
                      const showName   = !isMe && !prevSame;

                      const bRadius = isMe
                        ? `18px 18px ${nextSame ? '16px' : '4px'} 18px`
                        : `18px 18px 18px ${nextSame ? '16px' : '4px'}`;

                      return (
                        <div
                          key={msg.id}
                          className="bubble-anim"
                          style={{
                            display:'flex',
                            justifyContent: isMe ? 'flex-end' : 'flex-start',
                            marginBottom: nextSame ? 3 : 10,
                            alignItems:'flex-end', gap:8,
                          }}
                        >
                          {/* Avatar gauche */}
                          {!isMe && (
                            <div style={{ width:32, flexShrink:0 }}>
                              {showAvatar
                                ? <Avatar prenom={msg.prenom} nom={msg.nom} size={32} />
                                : <div style={{width:32}}/>
                              }
                            </div>
                          )}

                          <div style={{ maxWidth:'58%' }}>
                            {showName && (
                              <div style={{
                                fontSize:11, color:C.textMuted,
                                fontWeight:500, marginBottom:4, marginLeft:3,
                              }}>
                                {msg.prenom} {msg.nom}
                              </div>
                            )}
                            <div style={{
                              padding:'10px 15px',
                              borderRadius: bRadius,
                              background: isMe
                                ? `linear-gradient(135deg, ${C.accent}, #a78bfa)`
                                : C.bubble,
                              color: isMe ? '#fff' : C.text,
                              fontSize:14, lineHeight:1.58,
                              border: isMe ? 'none' : `1px solid ${C.border}`,
                              boxShadow: isMe
                                ? '0 4px 20px rgba(139,92,246,0.2)'
                                : '0 2px 8px rgba(0,0,0,0.05)',
                              wordBreak:'break-word', whiteSpace:'pre-wrap',
                            }}>
                              {msg.contenu || (msg.piece_jointe ? '' : '')}
                              {msg.piece_jointe && (
                                <div style={{ marginTop: msg.contenu ? 8 : 0 }}>
                                  <a
                                    href={getMessageFileUrl(msg.piece_jointe)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display:'inline-flex', alignItems:'center', gap:6,
                                      color: isMe ? '#fff' : C.accent,
                                      textDecoration:'none',
                                      border: isMe ? '1px solid rgba(255,255,255,0.45)' : '1px solid rgba(139,92,246,0.25)',
                                      padding:'6px 8px', borderRadius:8,
                                      fontSize:12, fontWeight:600,
                                      background: isMe ? 'rgba(255,255,255,0.12)' : '#fff',
                                    }}
                                  >
                                    📎 {msg.piece_jointe.split('/').pop()}
                                  </a>
                                </div>
                              )}
                            </div>
                            {!nextSame && (
                              <div style={{
                                fontSize:10, color:C.textFaint,
                                marginTop:4,
                                fontFamily:"'DM Mono', monospace",
                                textAlign: isMe ? 'right' : 'left',
                                paddingLeft: isMe ? 0 : 4,
                                paddingRight: isMe ? 4 : 0,
                                display:'flex',
                                justifyContent: isMe ? 'flex-end' : 'flex-start',
                                alignItems:'center', gap:4,
                              }}>
                                {fmtTime(msg.created_at)}
                                {isMe && (
                                  <span style={{ color: msg.lu ? C.accent : C.textFaint, fontSize:12 }}>
                                    {msg.lu ? '✓✓' : '✓'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Avatar droite */}
                          {isMe && (
                            <div style={{ width:32, flexShrink:0 }}>
                              {!nextSame
                                ? <Avatar prenom={msg.prenom} nom={msg.nom} size={32} accent />
                                : <div style={{width:32}}/>
                              }
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Input ── */}
              <div style={{
                padding:'14px 24px',
                borderTop:`1px solid ${C.border}`,
                background:C.surface,
                display:'flex', flexDirection:'column', gap:8,
              }}>
                <div style={{ display:'flex', gap:8 }}>
                  <textarea
                    ref={inputRef}
                    value={contenu}
                    onChange={(e) => {
                      setContenu(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Écrire un message…   ↵ pour envoyer"
                    rows={1}
                    className="msg-textarea"
                    style={{
                      flex:1,
                      background:C.bg,
                      border:`1px solid ${C.border}`,
                      borderRadius:16,
                      padding:'12px 18px',
                      fontSize:14, color:C.text,
                      resize:'none', maxHeight:120,
                      lineHeight:1.58,
                      fontFamily:"'DM Sans', sans-serif",
                      overflowY:'auto',
                    }}
                  />
                  <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={((!contenu || !contenu.trim()) && !fichier) || sending}
                    style={{
                      width:46, height:46, flexShrink:0,
                      borderRadius:14, border:'none',
                      background: (!contenu.trim() && !fichier) || sending ? C.border : `linear-gradient(135deg, ${C.accent}, #a78bfa)`,
                      color: (!contenu.trim() && !fichier) || sending ? C.textMuted : '#fff',
                      cursor: (!contenu.trim() && !fichier) || sending ? 'default' : 'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow: (!contenu.trim() && !fichier) || sending ? 'none' : '0 4px 16px rgba(139,92,246,0.3)',
                    }}
                  >
                    {sending ? (
                      <div className="spin" style={{
                        width:18, height:18,
                        border:'2px solid rgba(255,255,255,0.25)',
                        borderTopColor:'#fff', borderRadius:'50%',
                      }} />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.3"
                        strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    )}
                  </button>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <label htmlFor="file-input" style={{
                    cursor:'pointer',
                    color:C.accent,
                    fontSize:13,
                    fontWeight:600,
                    border:'1px dashed '+C.accent,
                    padding:'6px 10px',
                    borderRadius:10,
                  }}>
                    📎 Joindre un fichier
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    style={{ display:'none' }}
                    onChange={(e) => {
                      setFichier(e.target.files?.[0] ?? null);
                    }}
                  />
                  {fichier && (
                    <div style={{ fontSize:12, color:C.textMuted }}>
                      {fichier.name}
                      <button
                        type="button"
                        onClick={() => setFichier(null)}
                        style={{
                          marginLeft:8, border:'none', background:'transparent', color:C.accent, cursor:'pointer', fontWeight:700
                        }}>
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ fontSize:12, color:C.textMuted, textAlign:'center', marginTop:4 }}>
                  L'envoi d'une pièce jointe est obligatoirement accompagné d'un message
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}