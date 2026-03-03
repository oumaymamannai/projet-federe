import { useState, useEffect } from "react";
import api from "../../services/api";
import { Save } from "lucide-react";

export default function JuryEvaluations() {
  const [soutenances, setSoutenances] = useState([]);
  const [forms, setForms] = useState({});
  const [msgs, setMsgs] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/jury/soutenances").then(r => {
      const today = new Date().toDateString();
      const todayOnes = r.data.filter(s => s.date_soutenance && new Date(s.date_soutenance).toDateString() === today);
      setSoutenances(todayOnes);
      const f = {};
      todayOnes.forEach(s => f[s.id] = { note: s.ma_note || "", remarques: s.mes_remarques || "" });
      setForms(f);
    }).finally(() => setLoading(false));
  }, []);

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
      <div className="page-header"><div><h1>📊 Évaluations du jour</h1><p>Saisissez les notes et remarques pour les soutenances d'aujourd'hui</p></div></div>
      <div className="page-content">
        {soutenances.length === 0 ? (
          <div className="alert alert-info">ℹ️ Aucune soutenance à évaluer aujourd'hui.</div>
        ) : (
          soutenances.map(s => (
            <div key={s.id} className="card" style={{ marginBottom: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <strong style={{ fontSize: 17 }}>{s.prenom} {s.nom}</strong>
                <div style={{ color: "#6b7280", fontSize: 14 }}>📌 {s.sujet}</div>
              </div>
              {msgs[s.id] && <div className="alert alert-success">✅ {msgs[s.id]}</div>}
              {errors[s.id] && <div className="alert alert-danger">⚠️ {errors[s.id]}</div>}
              {s.mon_role === "president" && (
                <div className="form-group">
                  <label className="form-label">Note /20 (Président uniquement)</label>
                  <input type="number" min="0" max="20" step="0.25" className="form-control" style={{ maxWidth: 160 }}
                    value={forms[s.id]?.note || ""} onChange={e => setForms(f => ({...f, [s.id]: {...f[s.id], note: e.target.value}}))} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Remarques</label>
                <textarea className="form-control" rows={3} value={forms[s.id]?.remarques || ""}
                  onChange={e => setForms(f => ({...f, [s.id]: {...f[s.id], remarques: e.target.value}}))} />
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => handleSave(s)}>
                <Save size={14} /> Enregistrer
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
