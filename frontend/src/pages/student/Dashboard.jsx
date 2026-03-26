import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { GraduationCap, Calendar, Clock, MapPin, Users, CheckCircle, AlertCircle, FileText, Star, Hourglass } from "lucide-react";

function getCountdownStatus(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const soutenanceDate = new Date(dateStr);
  soutenanceDate.setHours(0, 0, 0, 0);
  
  const diff = soutenanceDate - today;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return { status: "today", label: "Aujourd'hui", days: 0 };
  if (days < 0) return { status: "done", label: "Terminé", days: days };
  return { status: "pending", label: `-${days} jour${days > 1 ? "s" : ""}`, days: days };
}

function statusBadge(s) {
  const pastel = "rgba(167,139,250,0.3)";
  const row = { display: "inline-flex", alignItems: "center", gap: 6, background: pastel, color: "white", fontSize: 13, padding: "6px 12px", borderRadius: 20, fontWeight: 600 };
  if (s === "planifiee") return <span style={row}><Calendar size={14} strokeWidth={2.5} /> Planifiée</span>;
  if (s === "terminee") return <span style={row}><CheckCircle size={14} strokeWidth={2.5} /> Terminée</span>;
  return <span style={row}><Hourglass size={14} strokeWidth={2.5} /> En attente</span>;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [soutenance, setSoutenance] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/etudiant/soutenance"), api.get("/etudiant/documents")])
      .then(([s, d]) => { setSoutenance(s.data); setDocs(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const countdown = soutenance?.date_soutenance ? getCountdownStatus(soutenance.date_soutenance) : null;

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <span className="icon-squircle page-title-icon" aria-hidden>
              <GraduationCap size={22} />
            </span>
            Bonjour, {user?.prenom} !
          </h1>
          <p>Vue d'ensemble de votre soutenance de fin d'études</p>
        </div>
      </div>
      <div className="page-content">
        {!soutenance ? (
          <div className="alert alert-warning">
            <AlertCircle size={18} />
            Aucune soutenance planifiée pour vous. Contactez l'administration.
          </div>
        ) : (
          <div className="soutenance-card" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <GraduationCap size={32} color="white" />
                  <div>
                    <div className="soutenance-title">Statut : Soutenance {soutenance.statut === "planifiee" ? "programmée" : soutenance.statut === "terminee" ? "terminée" : "en attente"}</div>
                    {statusBadge(soutenance.statut)}
                  </div>
                </div>
              </div>
              {countdown !== null && countdown.status === "pending" && (
                <div className="countdown">
                  <div>
                    <div className="countdown-number">{countdown.label}</div>
                    <div className="countdown-label">restants</div>
                  </div>
                </div>
              )}
              {countdown !== null && countdown.status === "today" && (
                <div className="countdown">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div>
                      <div className="countdown-number">{countdown.label}</div>
                      <div className="countdown-label">jour J</div>
                    </div>
                  </div>
                </div>
              )}
              {countdown !== null && countdown.status === "done" && (
                <div className="countdown" style={{ minWidth: 140, textAlign: "center" }}>
                  {soutenance.note_finale !== null && soutenance.note_finale !== undefined ? (
                    <div>
                      <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 4 }}>Résultat</div>
                      <div className="countdown-number" style={{ fontSize: 36 }}>
                        {soutenance.note_finale}<span style={{ fontSize: 18 }}>/20</span>
                      </div>
                      <div className="countdown-label" style={{ marginTop: 4, color: soutenance.note_finale >= 10 ? "#86efac" : "#fca5a5" }}>
                        {soutenance.note_finale >= 10 ? "✅ Admis(e)" : "❌ Non admis(e)"}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <CheckCircle size={40} />
                      <div className="countdown-label" style={{ marginTop: 4 }}>Terminé</div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>En attente de note</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Date de soutenance prévue</div>
              <div style={{ display: "flex", gap: 48, alignItems: "center", flexWrap: "wrap" }}>
                {soutenance.date_soutenance && (
                  <div className="meta-item">
                    <Calendar size={24} color="white" />
                    <strong style={{ fontSize: 22 }}>{new Date(soutenance.date_soutenance).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</strong>
                  </div>
                )}
                {soutenance.date_soutenance && (
                  <div className="meta-item">
                    <Clock size={24} color="white" />
                    <strong style={{ fontSize: 22 }}>{new Date(soutenance.date_soutenance).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</strong>
                  </div>
                )}
                {soutenance.salle && (
                  <div className="meta-item">
                    <MapPin size={24} color="white" />
                    <strong style={{ fontSize: 22 }}>{soutenance.salle}</strong>
                  </div>
                )}
              </div>
            </div>

            {soutenance.note_finale !== null && soutenance.note_finale !== undefined && (
              <div style={{ marginBottom: 24 }}>
                <div className="meta-item">
                  <CheckCircle size={20} color="#10b981" />
                  <strong>Note finale : {soutenance.note_finale}/20</strong>
                </div>
              </div>
            )}

            {soutenance.jurys?.length > 0 && (
              <>
                <div style={{ height: 1, background: "rgba(255,255,255,0.2)", margin: "24px 0" }} />
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, color: "white" }}>
                    <Users size={16} /> Jury assigné ({soutenance.jurys.length} {soutenance.jurys.length > 1 ? "membres" : "membre"})
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {soutenance.jurys.map((j, i) => (
                      <div key={i} style={{ background: "rgba(167,139,250,0.3)", color: "white", padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                        {j.nom} — {j.role.replace("3eme_membre", "3ème Membre").replace("encadreur", "Encadreur").replace("president", "Président")}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon icon-squircle"><FileText size={22} /></div>
            <div className="stat-value" style={{ color: "#7c3aed" }}>{docs.length}</div>
            <div className="stat-label">Documents disponibles</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon icon-squircle"><Calendar size={22} /></div>
            <div className="stat-value" style={{ color: soutenance?.statut === "terminee" ? "#10b981" : soutenance?.statut === "planifiee" ? "#7c3aed" : "#9ca3af" }}>
              {soutenance?.statut === "terminee" ? "✓" : soutenance?.statut === "planifiee" ? "Oui" : "—"}
            </div>
            <div className="stat-label">{soutenance?.statut === "terminee" ? "Soutenance terminée" : soutenance?.statut === "planifiee" ? "Soutenance planifiée" : "Soutenance en attente"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon icon-squircle"><Star size={22} /></div>
            <div className="stat-value" style={{ color: soutenance?.note_finale != null ? (soutenance.note_finale >= 10 ? "#10b981" : "#ef4444") : "#9ca3af" }}>
              {soutenance?.note_finale != null ? `${soutenance.note_finale}/20` : "—"}
            </div>
            <div className="stat-label">{soutenance?.note_finale != null ? (soutenance.note_finale >= 10 ? "Admis(e)" : "Non admis(e)") : "Note en attente"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
