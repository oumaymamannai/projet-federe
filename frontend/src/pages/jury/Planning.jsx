import { useState, useEffect } from "react";
import api from "../../services/api";
import { Calendar, Clock, MapPin, Lock } from "lucide-react";

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function roleLabel(r) {
  return r === "president" ? "Président" : r === "encadreur" ? "Encadreur" : "3ème Membre";
}

function roleBadgeClass(r) {
  return r === "president" ? "badge-purple" : r === "encadreur" ? "badge-success" : "badge-gray";
}

export default function JuryPlanning() {
  const [soutenances, setSoutenances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/jury/soutenances").then(r => setSoutenances(r.data)).finally(() => setLoading(false));
  }, []);

  const isToday = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header"><div><h1>📅 Planning des soutenances</h1><p>Vos soutenances assignées et le calendrier d'évaluation.</p></div></div>
      <div className="page-content">
        <div className="alert alert-warning">
          💡 Le bouton <strong>Évaluer</strong> est activé <strong>uniquement le jour de la soutenance</strong>. Avant la date, il reste verrouillé pour garantir l'intégrité des évaluations.
        </div>
        {soutenances.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 48 }}>
            <Calendar size={48} color="#ddd6fe" style={{ margin: "0 auto 16px", display: "block" }} />
            <p style={{ color: "#9ca3af" }}>Aucune soutenance assignée</p>
          </div>
        ) : (
          soutenances.map(s => {
            const days = s.date_soutenance ? daysUntil(s.date_soutenance) : null;
            const todayIs = s.date_soutenance ? isToday(s.date_soutenance) : false;
            return (
              <div key={s.id} className="jury-soutenance-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <strong style={{ fontSize: 17 }}>{s.prenom} {s.nom}</strong>
                      <span className={"badge " + roleBadgeClass(s.mon_role)}>
                        {s.mon_role === "president" ? "⚖️" : s.mon_role === "encadreur" ? "📚" : "👤"} {roleLabel(s.mon_role)}
                      </span>
                    </div>
                    <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 10 }}>📌 {s.sujet}</div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {s.date_soutenance && <>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                          <Calendar size={14} color="#7c3aed" /> {new Date(s.date_soutenance).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                          <Clock size={14} color="#7c3aed" /> {new Date(s.date_soutenance).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                          <MapPin size={14} color="#ef4444" /> {s.salle}
                        </span>
                      </>}
                    </div>
                    {s.date_soutenance && !todayIs && days > 0 && (
                      <div style={{ marginTop: 8, fontSize: 13, color: "#f59e0b", fontWeight: 600 }}>
                        🔒 Évaluation disponible uniquement le {new Date(s.date_soutenance).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </div>
                  <div>
                    {todayIs ? (
                      <a href="/jury/evaluations" className="btn btn-primary btn-sm">✅ Évaluer</a>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#9ca3af", fontSize: 14 }}>
                        <Lock size={14} /> Verrouillé
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
