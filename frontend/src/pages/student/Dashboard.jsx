import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Calendar, Clock, MapPin, Users, CheckCircle, AlertCircle, FileText } from "lucide-react";

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function statusBadge(s) {
  if (s === "planifiee") return <span className="badge badge-purple">🗓️ Planifiée</span>;
  if (s === "terminee") return <span className="badge badge-success">✅ Terminée</span>;
  return <span className="badge badge-warning">⏳ En attente</span>;
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

  const days = soutenance?.date_soutenance ? daysUntil(soutenance.date_soutenance) : null;

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>🏠 Bonjour, {user?.prenom} !</h1>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div className="soutenance-title">📋 {soutenance.sujet || "Soutenance"}</div>
                {statusBadge(soutenance.statut)}
              </div>
              {days !== null && days >= 0 && (
                <div className="countdown">
                  <div>
                    <div className="countdown-number">{days}</div>
                    <div className="countdown-label">jours restants</div>
                  </div>
                </div>
              )}
              {days !== null && days < 0 && (
                <div className="countdown" style={{ background: "linear-gradient(135deg, #065f46, #059669)" }}>
                  <div>
                    <CheckCircle size={32} />
                    <div className="countdown-label">Terminée</div>
                  </div>
                </div>
              )}
            </div>
            <div className="soutenance-meta">
              {soutenance.date_soutenance && (
                <div className="meta-item">
                  <Calendar size={16} color="#7c3aed" />
                  <strong>{new Date(soutenance.date_soutenance).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</strong>
                </div>
              )}
              {soutenance.date_soutenance && (
                <div className="meta-item">
                  <Clock size={16} color="#7c3aed" />
                  <strong>{new Date(soutenance.date_soutenance).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</strong>
                </div>
              )}
              {soutenance.salle && (
                <div className="meta-item">
                  <MapPin size={16} color="#7c3aed" />
                  <strong>{soutenance.salle}</strong>
                </div>
              )}
              {soutenance.note_finale !== null && soutenance.note_finale !== undefined && (
                <div className="meta-item">
                  <CheckCircle size={16} color="#10b981" />
                  <strong style={{ color: "#10b981" }}>Note finale : {soutenance.note_finale}/20</strong>
                </div>
              )}
            </div>
            {soutenance.jurys?.length > 0 && (
              <>
                <div className="divider" />
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <Users size={16} /> Composition du jury
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {soutenance.jurys.map((j, i) => (
                      <div key={i} className="badge badge-purple" style={{ fontSize: 13 }}>
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
            <div className="stat-icon"><FileText size={28} color="#7c3aed" /></div>
            <div className="stat-value" style={{ color: "#7c3aed" }}>{docs.length}</div>
            <div className="stat-label">Documents disponibles</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-value" style={{ color: soutenance?.statut === "planifiee" ? "#7c3aed" : "#9ca3af" }}>
              {soutenance?.statut === "planifiee" ? "✓" : "—"}
            </div>
            <div className="stat-label">Soutenance planifiée</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-value" style={{ color: "#10b981" }}>
              {soutenance?.note_finale ?? "—"}
            </div>
            <div className="stat-label">Note obtenue</div>
          </div>
        </div>
      </div>
    </div>
  );
}
