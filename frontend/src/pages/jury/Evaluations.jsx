import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import { Save, Calendar, ArrowLeft, ClipboardCheck, HelpCircle, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";

export default function JuryEvaluations() {
  const { soutenanceId } = useParams();
  const [soutenances, setSoutenances] = useState([]);
  const [forms, setForms] = useState({});
  const [msgs, setMsgs] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [showBareme, setShowBareme] = useState({});
  const [criteriaNotes, setCriteriaNotes] = useState({});

  useEffect(() => {
    api.get("/jury/soutenances").then(r => {
      const list = soutenanceId ? r.data.filter(s => String(s.id) === soutenanceId) : r.data;
      setSoutenances(list);
      const f = {};
      const c = {};
      list.forEach(s => {
        f[s.id] = { note: s.ma_note || "", remarques: s.mes_remarques || "" };
        c[s.id] = {
          memoire: "",
          presentation: "",
          reponses: "",
          scientifique: "",
          temps: ""
        };
      });
      setForms(f);
      setCriteriaNotes(c);
    }).finally(() => setLoading(false));
  }, [soutenanceId]);

  const handleSave = async (s) => {
    setMsgs(m => ({...m, [s.id]: ""}));
    setErrors(e => ({...e, [s.id]: ""}));

    // Contrôle de saisie avant envoi
    if (s.mon_role === "president") {
      const noteVal = parseFloat(forms[s.id]?.note);
      if (forms[s.id]?.note !== "" && (isNaN(noteVal) || noteVal < 0 || noteVal > 20)) {
        setErrors(e => ({...e, [s.id]: "La note doit être comprise entre 0 et 20."}));
        return;
      }
    }

    try {
      const payload = { remarques: forms[s.id]?.remarques };
      if (s.mon_role === "president") payload.note = parseFloat(forms[s.id]?.note);
      await api.post("/jury/evaluer/" + s.id, payload);
      setMsgs(m => ({...m, [s.id]: "Évaluation enregistrée !"}));
    } catch (err) { setErrors(e => ({...e, [s.id]: err.response?.data?.message || "Erreur"})); }
  };

  const toggleBareme = (id) => {
    setShowBareme(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCriteriaChange = (soutenanceId, field, value) => {
    const newValue = value === "" ? "" : parseFloat(value);
    if (newValue !== "" && (newValue < 0 || newValue > 20)) return;
    
    setCriteriaNotes(prev => ({
      ...prev,
      [soutenanceId]: {
        ...prev[soutenanceId],
        [field]: value
      }
    }));
    
    // Calculer la note totale
    const coeffs = {
      memoire: 0.3,
      presentation: 0.25,
      reponses: 0.2,
      scientifique: 0.15,
      temps: 0.1
    };
    
    const currentNotes = {
      ...criteriaNotes[soutenanceId],
      [field]: value
    };
    
    let total = 0;
    let hasValue = false;
    Object.keys(coeffs).forEach(key => {
      const note = parseFloat(currentNotes[key]);
      if (!isNaN(note) && note !== "") {
        total += note * coeffs[key];
        hasValue = true;
      }
    });
    
    if (hasValue) {
      const finalNote = Math.round(total * 100) / 100;
      setForms(f => ({
        ...f,
        [soutenanceId]: {
          ...f[soutenanceId],
          note: finalNote.toString()
        }
      }));
    }
  };

  const getCalculatedTotal = (soutenanceId) => {
    const coeffs = {
      memoire: 0.3,
      presentation: 0.25,
      reponses: 0.2,
      scientifique: 0.15,
      temps: 0.1
    };
    
    let total = 0;
    let hasValue = false;
    Object.keys(coeffs).forEach(key => {
      const note = parseFloat(criteriaNotes[soutenanceId]?.[key]);
      if (!isNaN(note) && note !== "") {
        total += note * coeffs[key];
        hasValue = true;
      }
    });
    
    if (hasValue) {
      return Math.round(total * 100) / 100;
    }
    return null;
  };

  // Barème indicatif pour le président
  const BaremeIndicatif = ({ soutenanceId }) => {
    const [isOpen, setIsOpen] = useState(showBareme[soutenanceId] || false);
    const totalNote = getCalculatedTotal(soutenanceId);
    
    useEffect(() => {
      setIsOpen(showBareme[soutenanceId] || false);
    }, [showBareme, soutenanceId]);

    return (
      <div style={{ 
        marginBottom: 16, 
        background: "#f8f7ff", 
        borderRadius: 12, 
        border: "1px solid #e5e0f8",
        overflow: "hidden"
      }}>
        <button
          onClick={() => toggleBareme(soutenanceId)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#5b21b6",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <HelpCircle size={16} /> Barème indicatif d'évaluation
          </span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {isOpen && (
          <div style={{ padding: "0 16px 16px 16px", borderTop: "1px solid #e5e0f8" }}>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 4px", color: "#374151", borderBottom: "1px solid #e5e0f8" }}>Critère</th>
                  <th style={{ textAlign: "center", padding: "8px 4px", color: "#374151", borderBottom: "1px solid #e5e0f8" }}>Coefficient</th>
                  <th style={{ textAlign: "center", padding: "8px 4px", color: "#374151", borderBottom: "1px solid #e5e0f8" }}>Note /20</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 4px", color: "#4b5563" }}>📋 Qualité du mémoire/rapport</td>
                  <td style={{ textAlign: "center", padding: "8px 4px" }}>30%</td>
                  <td style={{ textAlign: "center", padding: "8px 4px" }}>
                    <input 
                      type="number" 
                      step="0.25" 
                      min="0" 
                      max="20"
                      value={criteriaNotes[soutenanceId]?.memoire || ""}
                      onChange={(e) => handleCriteriaChange(soutenanceId, "memoire", e.target.value)}
                      placeholder="0-20"
                      style={{
                        width: "80px",
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "1px solid #e5e0f8",
                        textAlign: "center",
                        fontSize: 13
                      }}
                    />
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 4px", color: "#4b5563" }}>🎤 Présentation orale</td>
                  <td style={{ textAlign: "center", padding: "8px 4px" }}>25%</td>
                  <td style={{ textAlign: "center", padding: "8px 4px" }}>
                    <input 
                      type="number" 
                      step="0.25" 
                      min="0" 
                      max="20"
                      value={criteriaNotes[soutenanceId]?.presentation || ""}
                      onChange={(e) => handleCriteriaChange(soutenanceId, "presentation", e.target.value)}
                      placeholder="0-20"
                      style={{
                        width: "80px",
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "1px solid #e5e0f8",
                        textAlign: "center",
                        fontSize: 13
                      }}
                    />
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 4px", color: "#4b5563" }}>❓ Réponses aux questions</td>
                  <td style={{ textAlign: "center", padding: "8px 4px" }}>20%</td>
                  <td style={{ textAlign: "center", padding: "8px 4px" }}>
                    <input 
                      type="number" 
                      step="0.25" 
                      min="0" 
                      max="20"
                      value={criteriaNotes[soutenanceId]?.reponses || ""}
                      onChange={(e) => handleCriteriaChange(soutenanceId, "reponses", e.target.value)}
                      placeholder="0-20"
                      style={{
                        width: "80px",
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "1px solid #e5e0f8",
                        textAlign: "center",
                        fontSize: 13
                      }}
                    />
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 4px", color: "#4b5563" }}>💡 Qualité scientifique/technique</td>
                  <td style={{ textAlign: "center", padding: "8px 4px" }}>15%</td>
                  <td style={{ textAlign: "center", padding: "8px 4px" }}>
                    <input 
                      type="number" 
                      step="0.25" 
                      min="0" 
                      max="20"
                      value={criteriaNotes[soutenanceId]?.scientifique || ""}
                      onChange={(e) => handleCriteriaChange(soutenanceId, "scientifique", e.target.value)}
                      placeholder="0-20"
                      style={{
                        width: "80px",
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "1px solid #e5e0f8",
                        textAlign: "center",
                        fontSize: 13
                      }}
                    />
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 4px", color: "#4b5563" }}>⏱️ Gestion du temps</td>
                  <td style={{ textAlign: "center", padding: "8px 4px" }}>10%</td>
                  <td style={{ textAlign: "center", padding: "8px 4px" }}>
                    <input 
                      type="number" 
                      step="0.25" 
                      min="0" 
                      max="20"
                      value={criteriaNotes[soutenanceId]?.temps || ""}
                      onChange={(e) => handleCriteriaChange(soutenanceId, "temps", e.target.value)}
                      placeholder="0-20"
                      style={{
                        width: "80px",
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "1px solid #e5e0f8",
                        textAlign: "center",
                        fontSize: 13
                      }}
                    />
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={{ background: "#f3f4f6" }}>
                  <td style={{ padding: "10px 4px", fontWeight: 700, color: "#1f2937" }}>📊 TOTAL (calculé)</td>
                  <td style={{ textAlign: "center", padding: "10px 4px", fontWeight: 700 }}>100%</td>
                  <td style={{ textAlign: "center", padding: "10px 4px", fontWeight: 700, color: "#7c3aed", fontSize: 16 }}>
                    {totalNote !== null ? `${totalNote} / 20` : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>
            
            <div style={{ marginTop: 12, padding: "10px", background: "#fef3c7", borderRadius: 8, fontSize: 12 }}>
              <strong style={{ color: "#92400e" }}>📌 Correspondance note mention :</strong><br />
              <span style={{ color: "#78350f" }}>16-20 : Très Honorable | 14-15.9 : Honorable | 12-13.9 : Assez Bien | 10-11.9 : Passable | &lt;10 : Insuffisant</span>
            </div>
            
            <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>
              💡 Conseil : Saisissez les notes pour chaque critère, la note finale est calculée automatiquement et remplit le champ "Note /20" ci-dessous.
            </div>
          </div>
        )}
      </div>
    );
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
                  <div style={{ color: "#6b7280", fontSize: 14 }}>Sujet: {s.sujet}</div>
                </div>
                {s.date_soutenance && (
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#7c3aed" }}>
                    <Calendar size={14} /> {new Date(s.date_soutenance).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
              </div>

              <div style={{ marginBottom: 12, fontSize: 13, color: "#6b7280" }}>
                Votre rôle : <strong style={{ color: s.mon_role === "president" ? "#7c3aed" : "#059669" }}>
                  {s.mon_role === "president" ? "⚖️ Président" : s.mon_role === "encadreur" ? "📚 Encadrant" : "👤 3ème Membre"}
                </strong>
              </div>

              {msgs[s.id] && <div className="alert alert-success"><CheckCircle size={16} /> {msgs[s.id]}</div>}
              {errors[s.id] && <div className="alert alert-danger">⚠️ {errors[s.id]}</div>}

              {/* Barème indicatif pour le président */}
              {s.mon_role === "president" && <BaremeIndicatif soutenanceId={s.id} />}

              {s.mon_role === "president" && (
                <div className="form-group">
                  <label className="form-label">Note /20</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.25"
                    className="form-control"
                    style={{
                      maxWidth: 160,
                      borderColor:
                        forms[s.id]?.note !== "" &&
                        (parseFloat(forms[s.id]?.note) < 0 || parseFloat(forms[s.id]?.note) > 20)
                          ? "#dc2626"
                          : undefined,
                    }}
                    value={forms[s.id]?.note || ""}
                    onChange={e => {
                      const val = e.target.value;
                      // Autoriser la saisie libre mais bloquer les valeurs hors [0, 20]
                      if (val === "" || (parseFloat(val) >= 0 && parseFloat(val) <= 20)) {
                        setForms(f => ({...f, [s.id]: {...f[s.id], note: val}}));
                      }
                    }}
                  />
                  {forms[s.id]?.note !== "" &&
                    (parseFloat(forms[s.id]?.note) < 0 || parseFloat(forms[s.id]?.note) > 20) && (
                      <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
                        ⚠️ La note doit être comprise entre 0 et 20.
                      </div>
                  )}
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
                  <CheckCircle size={16} /> Note finale attribuée : <strong>{s.note_finale}/20</strong>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}