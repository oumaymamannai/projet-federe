import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import { Save, Calendar, ArrowLeft, ClipboardCheck } from "lucide-react";

export default function JuryEvaluations() {
  const { soutenanceId } = useParams();
  const [soutenances, setSoutenances] = useState([]);
  const [forms, setForms] = useState({});
  const [msgs, setMsgs] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/jury/soutenances").then(r => {
      const list = soutenanceId ? r.data.filter(s => String(s.id) === soutenanceId) : r.data;
      setSoutenances(list);
      const f = {};
      list.forEach(s => f[s.id] = { note: s.ma_note || "", remarques: s.mes_remarques || "" });
      setForms(f);
    }).finally(() => setLoading(false));
  }, [soutenanceId]);

  const handleSave = async (s) => {
    setMsgs(m => ({...m, [s.id]: ""}));
    setErrors(e => ({...e, [s.id]: ""}));
    try {
      const payload = { remarques: forms[s.id]?.remarques };
      if (s.mon_role === "president") payload.note = parseFloat(forms[s.id]?.note);
      await api.post("/jury/evaluer/" + s.id, payload);
      setMsgs(m => ({...m, [s.id]: "Évaluation enregistrée !"}));
    } catch (err) { setErrors(e => ({...e, [s.id]: err.response?.data?.message || "Erreur"})); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1><span className="icon-squircle page-title-icon" aria-hidden><ClipboardCheck size={22} /></span> {soutenanceId ? "Évaluation" : "Évaluations"}</h1>
          <p>{soutenanceId ? "Saisissez votre note ou remarques pour cette soutenance" : "Saisissez vos notes et remarques pour les soutenances"}</p>
        </div>
        {soutenanceId && (
          <Link to="/jury" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft size={16} /> Retour au planning
          </Link>
        )}
      </div>
      <div className="page-content">
        {soutenances.length === 0 ? (
          <div className="alert alert-info">ℹ️ Aucune soutenance à évaluer.</div>
        ) : (
          soutenances.map(s => (
            <div key={s.id} className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <strong style={{ fontSize: 17 }}>{s.prenom} {s.nom}</strong>
                  <div style={{ color: "#6b7280", fontSize: 14 }}>📄 {s.sujet}</div>
                </div>
                {s.date_soutenance && (
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#7c3aed" }}>
                    <Calendar size={14} /> {new Date(s.date_soutenance).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
              </div>

              <div style={{ marginBottom: 12, fontSize: 13, color: "#6b7280" }}>
                Votre rôle : <strong style={{ color: s.mon_role === "president" ? "#7c3aed" : "#059669" }}>
                  {s.mon_role === "president" ? "⚖️ Président" : s.mon_role === "encadreur" ? "📚 Encadreur" : "👤 3ème Membre"}
                </strong>
              </div>

              {msgs[s.id] && <div className="alert alert-success">✅ {msgs[s.id]}</div>}
              {errors[s.id] && <div className="alert alert-danger">⚠️ {errors[s.id]}</div>}

              {s.mon_role === "president" && (
                <div className="form-group">
                  <label className="form-label">Note /20</label>
                  <input type="number" min="0" max="20" step="0.25" className="form-control" style={{ maxWidth: 160 }}
                    value={forms[s.id]?.note || ""} onChange={e => setForms(f => ({...f, [s.id]: {...f[s.id], note: e.target.value}}))} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Remarques</label>
                <textarea className="form-control" rows={3}
                  placeholder={s.mon_role === "president" ? "Remarques du président..." : "Vos remarques sur la soutenance..."}
                  value={forms[s.id]?.remarques || ""}
                  onChange={e => setForms(f => ({...f, [s.id]: {...f[s.id], remarques: e.target.value}}))} />
              </div>

              <button className="btn btn-primary btn-sm" onClick={() => handleSave(s)}>
                <Save size={14} /> {s.mon_role === "president" ? "Enregistrer la note" : "Enregistrer les remarques"}
              </button>

              {s.note_finale !== null && s.note_finale !== undefined && (
                <div style={{ marginTop: 12, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, fontSize: 14, color: "#166534" }}>
                  ✅ Note finale attribuée : <strong>{s.note_finale}/20</strong>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
