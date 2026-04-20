import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Save, Calendar, ArrowLeft, ClipboardCheck, HelpCircle, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";

export default function JuryEvaluations() {
  const { soutenanceId } = useParams();
  const navigate = useNavigate();
  const [soutenances, setSoutenances] = useState([]);
  const [forms, setForms] = useState({});
  const [msgs, setMsgs] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [showBareme, setShowBareme] = useState({});
  const [criteriaNotes, setCriteriaNotes] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  
  // État pour la modale de confirmation
  const [confirmModal, setConfirmModal] = useState({ show: false, soutenance: null });

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
      setFieldErrors({});
    }).finally(() => setLoading(false));
  }, [soutenanceId]);

  // Validation des champs avant d'ouvrir la modale
  const validateBeforeConfirm = (s) => {
    setMsgs(m => ({...m, [s.id]: ""}));
    setErrors(e => ({...e, [s.id]: ""}));
    setFieldErrors(f => ({...f, [s.id]: {}}));

    const remarques = forms[s.id]?.remarques?.trim() || "";
    const isPresident = s.mon_role === "president";
    let noteVal = null;
    let hasError = false;
    const newFieldErrors = {};

    if (remarques === "") {
      newFieldErrors.remarques = "Champ obligatoire";
      hasError = true;
    }

    if (isPresident) {
      noteVal = forms[s.id]?.note !== "" ? parseFloat(forms[s.id]?.note) : NaN;
      if (isNaN(noteVal) || noteVal < 0 || noteVal > 20) {
        newFieldErrors.note = "Champ obligatoire (0-20)";
        hasError = true;
      }
    }

    if (hasError) {
      setFieldErrors(f => ({...f, [s.id]: newFieldErrors}));
      return false;
    }
    return true;
  };

  // Ouvre la modale après validation réussie
  const handleOpenConfirm = (s) => {
    if (validateBeforeConfirm(s)) {
      setConfirmModal({ show: true, soutenance: s });
    }
  };

  // Enregistrement effectif et redirection
  const handleConfirmSave = async () => {
    const s = confirmModal.soutenance;
    if (!s) return;

    const remarques = forms[s.id]?.remarques?.trim() || "";
    const isPresident = s.mon_role === "president";
    let noteVal = null;

    if (isPresident) {
      noteVal = parseFloat(forms[s.id]?.note);
    }

    try {
      const payload = { remarques };
      if (isPresident) payload.note = noteVal;
      await api.post("/jury/evaluer/" + s.id, payload);
      setConfirmModal({ show: false, soutenance: null });
      // Redirection vers le planning jury
      navigate("/jury");
    } catch (err) {
      setErrors(e => ({...e, [s.id]: err.response?.data?.message || "Erreur"}));
      setConfirmModal({ show: false, soutenance: null });
    }
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
      {/* MODALE DE CONFIRMATION */}
      {confirmModal.show && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, backdropFilter: "blur(2px)",
        }}>
          <div style={{
            background: "white", borderRadius: 20, width: 420, maxWidth: "90vw",
            padding: 24, textAlign: "center", boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}><CheckCircle size={48} /></div>
            <h3 style={{ marginBottom: 8, color: "#1a1033" }}>Confirmer l'évaluation</h3>
            <p style={{ color: "#6b7280", marginBottom: 24 }}>
              Voulez-vous enregistrer cette évaluation pour <strong>{confirmModal.soutenance?.prenom} {confirmModal.soutenance?.nom}</strong> ?
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                className="btn btnsecondary"
                onClick={() => setConfirmModal({ show: false, soutenance: null })}
              >
                Annuler
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmSave}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div className="alert alert-info"><CheckCircle size={16} /> Aucune soutenance à évaluer.</div>
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
              {errors[s.id] && <div className="alert alert-danger">⚠ {errors[s.id]}</div>}

              {s.mon_role === "president" && <BaremeIndicatif soutenanceId={s.id} />}

              {s.mon_role === "president" && (
                <div className="form-group">
                  <label className="form-label">
                    Note /20 <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.25"
                    className="form-control"
                    style={{
                      maxWidth: 160,
                      borderColor: fieldErrors[s.id]?.note ? "#dc2626" : undefined,
                    }}
                    value={forms[s.id]?.note || ""}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === "" || (parseFloat(val) >= 0 && parseFloat(val) <= 20)) {
                        setForms(f => ({...f, [s.id]: {...f[s.id], note: val}}));
                        if (fieldErrors[s.id]?.note) {
                          setFieldErrors(fe => ({...fe, [s.id]: {...fe[s.id], note: undefined}}));
                        }
                      }
                    }}
                  />
                  {fieldErrors[s.id]?.note && (
                    <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
                      ⚠ {fieldErrors[s.id].note}
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  Remarques <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder={s.mon_role === "president" ? "Remarques du président..." : "Vos remarques sur la soutenance..."}
                  value={forms[s.id]?.remarques || ""}
                  onChange={e => {
                    setForms(f => ({...f, [s.id]: {...f[s.id], remarques: e.target.value}}));
                    if (fieldErrors[s.id]?.remarques) {
                      setFieldErrors(fe => ({...fe, [s.id]: {...fe[s.id], remarques: undefined}}));
                    }
                  }}
                  style={{
                    borderColor: fieldErrors[s.id]?.remarques ? "#dc2626" : undefined,
                  }}
                />
                {fieldErrors[s.id]?.remarques && (
                  <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
                    ⚠ {fieldErrors[s.id].remarques}
                  </div>
                )}
              </div>

              <button className="btn btn-primary btn-sm" onClick={() => handleOpenConfirm(s)}>
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