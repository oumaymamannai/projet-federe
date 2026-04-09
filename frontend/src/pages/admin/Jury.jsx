import { useState, useEffect } from "react";
import api from "../../services/api";
import { Search, Users } from "lucide-react";

function Modal({ member, onClose }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      await api.post("/admin/jury/contact", {
        memberId: member.id,
        subject,
        message
      });
      await new Promise((r) => setTimeout(r, 500));
      setSent(true);
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      alert("Erreur lors de l'envoi du message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#fff", borderRadius: 16, width: 480, maxWidth: "calc(100vw - 32px)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.18)", overflow: "hidden",
      }}>
        <div style={{ background: "linear-gradient(135deg, #4c3db5 0%, #6b5ce7 100%)", padding: "20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", background: member.color || "#7F77DD",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0,
            border: "2px solid rgba(255,255,255,0.3)",
          }}>
            {member.initials || member.nom?.charAt(0) + member.prenom?.charAt(0) || "?"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>{member.prenom} {member.nom}</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{member.email}</div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
            width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", color: "#fff", fontSize: 18, lineHeight: 1,
          }}>×</button>
        </div>

        <div style={{ padding: 24 }}>
          {sent ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", background: "#e8faf3",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", fontSize: 28,
              }}>✓</div>
              <div style={{ fontWeight: 600, fontSize: 17, color: "#1a1a2e", marginBottom: 8 }}>
                Message envoyé !
              </div>
              <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
                Votre message a été transmis à {member.prenom} {member.nom}.
              </div>
              <button onClick={onClose} style={{
                background: "linear-gradient(135deg, #4c3db5, #6b5ce7)", color: "#fff",
                border: "none", borderRadius: 8, padding: "10px 28px", cursor: "pointer",
                fontSize: 14, fontWeight: 500,
              }}>Fermer</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                  Objet *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Convocation pour soutenance..."
                  className="search-input"
                  style={{
                    width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb",
                    borderRadius: 8, fontSize: 14, color: "#1a1a2e", outline: "none",
                    boxSizing: "border-box", transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                  Message *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Rédigez votre message ici..."
                  rows={5}
                  className="search-input"
                  style={{
                    width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb",
                    borderRadius: 8, fontSize: 14, color: "#1a1a2e", outline: "none",
                    boxSizing: "border-box", resize: "vertical", fontFamily: "inherit",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Modèles rapides
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    { label: "Convocation", text: "Bonjour, vous êtes convoqué(e) pour une soutenance le " },
                    { label: "Rappel", text: "Bonjour, ceci est un rappel concernant votre participation au jury du " },
                    { label: "Documents", text: "Bonjour, pourriez-vous nous faire parvenir les documents nécessaires pour " },
                  ].map((t) => (
                    <button
                      key={t.label}
                      onClick={() => { setMessage(t.text); if (!subject) setSubject(t.label + " - GradFlow"); }}
                      style={{
                        background: "#f3f0ff", border: "1px solid #ddd6fe", borderRadius: 20,
                        padding: "4px 12px", fontSize: 12, color: "#5b4dc4", cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={onClose} style={{
                  background: "transparent", border: "1px solid #e5e7eb",
                  borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 14, color: "#6b7280",
                }}>Annuler</button>
                <button
                  onClick={handleSend}
                  disabled={!subject.trim() || !message.trim() || sending}
                  style={{
                    background: subject.trim() && message.trim() && !sending
                      ? "linear-gradient(135deg, #4c3db5, #6b5ce7)"
                      : "#e5e7eb",
                    color: subject.trim() && message.trim() && !sending ? "#fff" : "#9ca3af",
                    border: "none", borderRadius: 8, padding: "10px 24px",
                    cursor: subject.trim() && message.trim() && !sending ? "pointer" : "not-allowed",
                    fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 6,
                    transition: "all 0.2s",
                  }}
                >
                  {sending ? "Envoi..." : "✉ Envoyer"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminJury() {
  const [juryMembers, setJuryMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [search, setSearch] = useState("");
  
  const [allSubject, setAllSubject] = useState("");
  const [allMessage, setAllMessage] = useState("");
  const [allSent, setAllSent] = useState(false);
  const [allSending, setAllSending] = useState(false);

  const colors = [
    "#7F77DD", "#1D9E75", "#D85A30", "#D4537E", "#3B82F6", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#EC4899"
  ];

  useEffect(() => {
    const loadJuryMembers = async () => {
      try {
        const response = await api.get("/admin/jury/members");
        const members = response.data.map((member, index) => ({
          id: member.id,
          nom: member.nom,
          prenom: member.prenom,
          email: member.email,
          fonction: "Membre du jury",
          initials: (member.prenom?.charAt(0) || "") + (member.nom?.charAt(0) || ""),
          color: colors[index % colors.length]
        }));
        setJuryMembers(members);
      } catch (error) {
        console.error("Erreur lors du chargement des membres du jury:", error);
      } finally {
        setLoading(false);
      }
    };

    loadJuryMembers();
  }, []);

  const handleSendToAll = async () => {
    if (!allSubject.trim() || !allMessage.trim()) return;
    setAllSending(true);
    try {
      await api.post("/admin/jury/contact-all", {
        subject: allSubject,
        message: allMessage
      });
      await new Promise((r) => setTimeout(r, 500));
      setAllSent(true);
    } catch (error) {
      console.error("Erreur lors de l'envoi à tous:", error);
      alert("Erreur lors de l'envoi des messages");
    } finally {
      setAllSending(false);
    }
  };

  // ✅ MODIFICATION : Recherche uniquement par nom et prénom (sans email)
  const filtered = juryMembers.filter(
    (m) =>
      (m.nom?.toLowerCase().includes(search.toLowerCase()) || false) ||
      (m.prenom?.toLowerCase().includes(search.toLowerCase()) || false)
  );

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f7ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#f8f7ff", 
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      padding: "36px 40px",
      width: "100%",
      boxSizing: "border-box"
    }}>
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1>
            <span className="icon-squircle page-title-icon" aria-hidden>
              <Users size={22} />
            </span>{" "}
            Membres du jury
          </h1>
          <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 14 }}>
            Liste des membres du jury disponibles pour les affectations
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ background: "#fff", border: "1px solid #ede9fe", borderRadius: 10, padding: "10px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#6b5ce7" }}>{juryMembers.length}</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>Membres actifs</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "#9ca3af", fontSize: 14,
          }}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            style={{
              width: "100%", padding: "10px 12px 10px 36px",
              border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14,
              color: "#1a1a2e", outline: "none", boxSizing: "border-box",
              background: "#fff",
            }}
          />
        </div>
        <button
          onClick={() => setSelected({ id: 0, nom: "Tous les membres", email: "all", initials: "★", color: "#7F77DD", isAll: true })}
          style={{
            background: "linear-gradient(135deg, #4c3db5, #6b5ce7)", color: "#fff",
            border: "none", borderRadius: 8, padding: "10px 20px",
            cursor: "pointer", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          ✉ Contacter tous
        </button>
      </div>

      <div style={{ 
        background: "#fff", 
        borderRadius: 14, 
        border: "1px solid #ede9fe", 
        overflowX: "auto",
        width: "100%"
      }}>
        <table style={{ 
          width: "100%", 
          borderCollapse: "collapse",
          minWidth: 600
        }}>
          <thead>
            <tr style={{ background: "#f5f3ff", borderBottom: "1px solid #ede9fe" }}>
              {["#", "NOM & PRÉNOM", "EMAIL", "FONCTION", "ACTION"].map((h, i) => (
                <th key={h} style={{
                  padding: "14px 20px", 
                  textAlign: i === 4 ? "center" : "left",
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: "#7c3aed",
                  textTransform: "uppercase", 
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap"
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((member, i) => (
              <tr
                key={member.id}
                onMouseEnter={() => setHovered(member.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none",
                  background: hovered === member.id ? "#faf8ff" : "transparent",
                  transition: "background 0.15s",
                }}
              >
                <td style={{ padding: "16px 20px", color: "#9ca3af", fontSize: 14, whiteSpace: "nowrap" }}>{i + 1}</td>
                <td style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 150 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%", background: member.color + "22",
                      border: `2px solid ${member.color}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: member.color, fontWeight: 700, fontSize: 13, flexShrink: 0,
                    }}>
                      {member.initials}
                    </div>
                    <span style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 14, wordBreak: "break-word" }}>
                      {member.prenom} {member.nom}
                    </span>
                  </div>
                </td>
                <td style={{ padding: "16px 20px" }}>
                  <a href={`mailto:${member.email}`} style={{ color: "#6b5ce7", fontSize: 14, textDecoration: "none", wordBreak: "break-all" }}>
                    {member.email}
                  </a>
                </td>
                <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                  <span style={{
                    background: "#f5f3ff", border: "1px solid #ddd6fe",
                    borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#7c3aed", fontWeight: 500,
                  }}>
                    👤 {member.fonction}
                  </span>
                </td>
                <td style={{ padding: "16px 20px", textAlign: "center", whiteSpace: "nowrap" }}>
                  <button
                    onClick={() => setSelected(member)}
                    style={{
                      background: hovered === member.id
                        ? "linear-gradient(135deg, #4c3db5, #6b5ce7)"
                        : "transparent",
                      color: hovered === member.id ? "#fff" : "#6b5ce7",
                      border: "1px solid #ddd6fe",
                      borderRadius: 8, padding: "7px 16px", cursor: "pointer",
                      fontSize: 13, fontWeight: 500, transition: "all 0.2s",
                      display: "inline-flex", alignItems: "center", gap: 5,
                    }}
                  >
                    ✉ Contacter
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                  Aucun membre trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 13, color: "#9ca3af" }}>
        {filtered.length} membre{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
      </div>

      {selected && !selected.isAll && (
        <Modal member={selected} onClose={() => setSelected(null)} />
      )}

      {selected?.isAll && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div style={{
            background: "#fff", borderRadius: 16, width: 480, maxWidth: "calc(100vw - 32px)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.18)", overflow: "hidden",
          }}>
            <div style={{ background: "linear-gradient(135deg, #4c3db5 0%, #6b5ce7 100%)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>Contacter tous les membres</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{juryMembers.length} destinataires</div>
              </div>
              <button onClick={() => {
                setSelected(null);
                setAllSent(false);
                setAllSubject("");
                setAllMessage("");
              }} style={{
                background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
                width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 18,
              }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              {allSent ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%", background: "#e8faf3",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px", fontSize: 28,
                  }}>✓</div>
                  <div style={{ fontWeight: 600, fontSize: 17, color: "#1a1a2e", marginBottom: 8 }}>
                    Messages envoyés !
                  </div>
                  <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
                    Vos messages ont été transmis aux {juryMembers.length} membres du jury.
                  </div>
                  <button onClick={() => {
                    setSelected(null);
                    setAllSent(false);
                    setAllSubject("");
                    setAllMessage("");
                  }} style={{
                    background: "linear-gradient(135deg, #4c3db5, #6b5ce7)", color: "#fff",
                    border: "none", borderRadius: 8, padding: "10px 28px", cursor: "pointer",
                    fontSize: 14, fontWeight: 500,
                  }}>Fermer</button>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                    {juryMembers.map((m) => (
                      <div key={m.id} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "#f5f3ff", border: "1px solid #ddd6fe",
                        borderRadius: 20, padding: "4px 10px 4px 6px", fontSize: 12, color: "#7c3aed",
                      }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700 }}>{m.initials}</div>
                        {m.prenom}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Objet *</label>
                    <input 
                      type="text" 
                      value={allSubject}
                      onChange={(e) => setAllSubject(e.target.value)}
                      placeholder="Objet du message groupé..." 
                      className="search-input"
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none" }} 
                    />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Message *</label>
                    <textarea 
                      rows={4} 
                      value={allMessage}
                      onChange={(e) => setAllMessage(e.target.value)}
                      placeholder="Message pour tous les membres du jury..." 
                      className="search-input"
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", outline: "none" }} 
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => {
                      setSelected(null);
                      setAllSubject("");
                      setAllMessage("");
                    }} style={{ background: "transparent", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 14, color: "#6b7280" }}>Annuler</button>
                    <button 
                      onClick={handleSendToAll}
                      disabled={!allSubject.trim() || !allMessage.trim() || allSending}
                      style={{ 
                        background: allSubject.trim() && allMessage.trim() && !allSending
                          ? "linear-gradient(135deg, #4c3db5, #6b5ce7)"
                          : "#e5e7eb",
                        color: allSubject.trim() && allMessage.trim() && !allSending ? "#fff" : "#9ca3af",
                        border: "none", 
                        borderRadius: 8, 
                        padding: "10px 24px", 
                        cursor: allSubject.trim() && allMessage.trim() && !allSending ? "pointer" : "not-allowed", 
                        fontSize: 14, 
                        fontWeight: 500 
                      }}
                    >
                      {allSending ? "Envoi..." : "✉ Envoyer à tous"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}