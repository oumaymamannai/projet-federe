import { useState, useEffect } from "react";
import api from "../../services/api";
import { Upload, Send, FileText, X, GraduationCap, Building2 } from "lucide-react";
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

// ── Champ avec validation ─────────────────────────────────────────────────────
function Field({ label, required, error, hint, children }) {
  return (
    <div className="form-group sf-field">
      <label className="form-label sf-label">
        {label}
        {required && <span className="sf-required">*</span>}
      </label>
      {children}
      {error && (
        <div className="sf-error-msg">
          <span>⚠</span> {error}
        </div>
      )}
      {hint && !error && (
        <div className="sf-hint">{hint}</div>
      )}
    </div>
  )
}

export default function StudentStage() {
  const { user, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    nom_etudiant:         "",
    prenom_etudiant:      "",
    email_contact:        "",
    encadreur:            "",   // encadrant pédagogique (faculté)
    encadrant_entreprise: "",   // encadrant entreprise (nouveau)
    societe:              "",
    sujet:                "",
    description:          "",
  });

  const [fichiers,        setFichiers]        = useState([]);
  const [soumissions,     setSoumissions]     = useState([]);
  const [msg,             setMsg]             = useState("");
  const [error,           setError]           = useState("");
  const [fieldErrors,     setFieldErrors]     = useState({});
  const [loading,         setLoading]         = useState(false);
  const [soutenance,      setSoutenance]      = useState(null);
  const [initialLoading,  setInitialLoading]  = useState(true);
  const [aDejaSoumis,     setADejaSoumis]     = useState(false);

  const isTerminee = soutenance && soutenance.statut === "terminee";

  // Pré-remplir depuis user
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        nom_etudiant:    user.nom    || "",
        prenom_etudiant: user.prenom || "",
        email_contact:   user.email  || "",
      }));
    }
  }, [user]);

  // Chargement initial
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        const dejaSoumisRes = await api.get("/etudiant/a-deja-soumis");
        if (dejaSoumisRes.data.dejaSoumis) setADejaSoumis(true);

        const [soumissionsRes, soutenanceRes] = await Promise.all([
          api.get("/etudiant/stage/soumissions").catch(() => ({ data: [] })),
          api.get("/etudiant/soutenance").catch(() => ({ data: null })),
        ]);
        setSoumissions(soumissionsRes.data || []);
        setSoutenance(soutenanceRes.data);
      } catch {
        setError("Erreur de chargement des données");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    const reqText = [
      ['societe',              'Veuillez remplir ce champ'],
      ['sujet',                'Veuillez remplir ce champ'],
      ['description',          'Veuillez remplir ce champ'],
      ['encadrant_entreprise', 'Veuillez remplir ce champ'],
    ];
    reqText.forEach(([k, msg]) => {
      if (!form[k] || !form[k].trim()) errs[k] = msg;
    });
    if (fichiers.length === 0) errs.fichiers = 'Veuillez joindre au moins un fichier';
    return errs;
  };

  // ── Fichiers ────────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    if (aDejaSoumis) return;
    const selected = Array.from(e.target.files);
    const allowed  = ['pdf', 'doc', 'docx'];

    const invalid = selected.filter(f => !allowed.includes(f.name.split('.').pop().toLowerCase()));
    if (invalid.length) { setError(`Format non autorisé : ${invalid.map(f => f.name).join(', ')}`); return; }

    const oversize = selected.filter(f => f.size > 10 * 1024 * 1024);
    if (oversize.length) { setError(`Trop volumineux (max 10 Mo) : ${oversize.map(f => f.name).join(', ')}`); return; }

    setFichiers(prev => [...prev, ...selected]);
    setError("");
    // clear fichiers error
    setFieldErrors(prev => { const n = {...prev}; delete n.fichiers; return n; });
    e.target.value = '';
  };

  const removeFile = (idx) => {
    if (aDejaSoumis) return;
    setFichiers(fichiers.filter((_, i) => i !== idx));
  };

  const formatSize = (b) => {
    if (b < 1024)           return b + ' o';
    if (b < 1024 * 1024)    return (b / 1024).toFixed(1) + ' Ko';
    return (b / (1024 * 1024)).toFixed(1) + ' Mo';
  };

  // ── Soumission ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (aDejaSoumis) return;

    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});

    setMsg(""); setError(""); setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fichiers.forEach(f => fd.append("fichiers", f));

      await api.post("/etudiant/stage", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setMsg("Formulaire soumis avec succès !");
      setADejaSoumis(true);
      setFichiers([]);
      const r = await api.get("/etudiant/stage/soumissions");
      setSoumissions(r.data);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la soumission");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (fieldErrors[k]) setFieldErrors(prev => { const n = {...prev}; delete n[k]; return n; });
  };

  if (authLoading || initialLoading) return (
    <div className="page-content">
      <div className="card" style={{ textAlign: "center", padding: 40 }}>
        <div className="spinner" /><p>Chargement...</p>
      </div>
    </div>
  );

  // ── Champs readonly ─────────────────────────────────────────────────────────
  const readonlyStyle = { background: "#f3f0ff", color: "#6b7280" };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1> <span className="icon-squircle page-title-icon" aria-hidden>
                <FileText size={22} />
              </span>{" "}Formulaire de stage</h1>
          <p>Soumettez vos informations de stage</p>
        </div>
      </div>

      <div className="page-content">
        {msg   && <div className="alert alert-success">✅ {msg}</div>}
        {error && <div className="alert alert-danger">⚠️ {error}</div>}

        {isTerminee ? (
          <div className="card" style={{ textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
            <h3 style={{ marginBottom: 8, fontWeight: 700, color: "#6b7280" }}>Dépôt de dossier désactivé</h3>
            <p style={{ color: "#9ca3af" }}>Votre soutenance est terminée, vous ne pouvez plus déposer de dossier.</p>
          </div>
        ) : (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 20, fontWeight: 700 }}>Nouvelle soumission</h3>

            <form onSubmit={handleSubmit} noValidate>

              {/* ── Infos personnelles (readonly) ── */}
              <div className="sf-section-label">Informations personnelles</div>
              <div className="sf-grid">
                <Field label="Nom">
                  <input className="form-control" value={form.nom_etudiant} readOnly style={readonlyStyle} />
                </Field>
                <Field label="Prénom">
                  <input className="form-control" value={form.prenom_etudiant} readOnly style={readonlyStyle} />
                </Field>
                <Field label="Email">
                  <input className="form-control" value={form.email_contact} readOnly style={readonlyStyle} />
                </Field>
              </div>

              {/* ── Encadrants ── */}
              <div className="sf-section-label" style={{ marginTop: 24 }}>
                Encadrants
              </div>
              <div className="sf-grid">
                {/* Encadrant pédagogique */}
                <Field
                  label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><GraduationCap size={14} color="#534AB7" /> Encadrant pédagogique <span style={{ fontSize: 11, color: '#7F77DD', fontWeight: 400 }}>(faculté)</span></span>}
                  hint={<>⚠️ Si vous n'avez pas d'encadrant pédagogique, soumettez une réclamation depuis la page <Link to="/student/reclamations" style={{ color: "#7c3aed", textDecoration: "underline" }}>Réclamations</Link></>}
                >
                  <input
                    className="form-control"
                    placeholder="Nom de votre encadrant pédagogique (si vous en avez un)"
                    value={form.encadreur}
                    onChange={e => handleChange('encadreur', e.target.value)}
                  />
                </Field>

                {/* Encadrant entreprise — NOUVEAU, obligatoire */}
                <Field
                  label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={14} color="#534AB7" /> Encadrant entreprise <span style={{ fontSize: 11, color: '#7F77DD', fontWeight: 400 }}>(société)</span></span>}
                  required
                  error={fieldErrors.encadrant_entreprise}
                >
                  <input
                    className={`form-control ${fieldErrors.encadrant_entreprise ? 'sf-input-error' : ''}`}
                    placeholder="Nom de votre encadrant en entreprise"
                    value={form.encadrant_entreprise}
                    onChange={e => handleChange('encadrant_entreprise', e.target.value)}
                  />
                </Field>
              </div>

              {/* ── Stage ── */}
              <div className="sf-section-label" style={{ marginTop: 24 }}>Informations du stage</div>
              <div className="sf-grid">
                <Field label="Société" required error={fieldErrors.societe}>
                  <input
                    className={`form-control ${fieldErrors.societe ? 'sf-input-error' : ''}`}
                    placeholder="Nom de la société"
                    value={form.societe}
                    onChange={e => handleChange('societe', e.target.value)}
                  />
                </Field>
                <Field label="Sujet" required error={fieldErrors.sujet}>
                  <input
                    className={`form-control ${fieldErrors.sujet ? 'sf-input-error' : ''}`}
                    placeholder="Sujet de votre stage"
                    value={form.sujet}
                    onChange={e => handleChange('sujet', e.target.value)}
                  />
                </Field>
              </div>

              {/* ── Description — obligatoire ── */}
              <Field label="Description du projet" required error={fieldErrors.description}>
                <textarea
                  className={`form-control ${fieldErrors.description ? 'sf-input-error' : ''}`}
                  placeholder="Décrivez votre stage en détail : objectifs, technologies utilisées, missions principales..."
                  value={form.description}
                  onChange={e => handleChange('description', e.target.value)}
                  rows={5}
                />
              </Field>

              {/* ── Pièces jointes — obligatoires ── */}
              <Field
                label={`Pièces jointes (PDF, Word) — ${fichiers.length} fichier(s) sélectionné(s)`}
                required
                error={fieldErrors.fichiers}
              >
                <div
                  className={`sf-dropzone ${fieldErrors.fichiers ? 'sf-dropzone-error' : ''}`}
                  onClick={() => !aDejaSoumis && document.getElementById('files-upload').click()}
                >
                  <Upload size={24} color="#7c3aed" style={{ margin: "0 auto 8px", display: "block" }} />
                  <input
                    type="file" accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                    id="files-upload" multiple
                  />
                  <span style={{ color: "#7c3aed", fontWeight: 600, cursor: "pointer" }}>
                    Cliquez pour sélectionner des fichiers
                  </span>
                  <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8, marginBottom: 0 }}>
                    PDF, DOC, DOCX — max 10 Mo par fichier · Ctrl / Cmd pour plusieurs
                  </p>
                </div>

                {fichiers.length > 0 && (
                  <div className="sf-files-list">
                    {fichiers.map((file, idx) => (
                      <div key={idx} className="sf-file-row">
                        <FileText size={18} color="#7c3aed" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="sf-file-name">{file.name}</div>
                          <div className="sf-file-size">{formatSize(file.size)}</div>
                        </div>
                        <button type="button" className="sf-file-remove" onClick={() => removeFile(idx)}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || aDejaSoumis}
                style={{ marginTop: 8, opacity: aDejaSoumis ? 0.5 : 1, cursor: aDejaSoumis ? 'not-allowed' : 'pointer' }}
              >
                <Send size={16} />
                {aDejaSoumis ? "Formulaire déjà soumis" : loading ? "Envoi en cours..." : "Soumettre"}
              </button>
            </form>
          </div>
        )}

        {/* ── Ma soumission ── */}
        {soumissions.length > 0 && (
          <div className="card">
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Ma soumission</h3>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Sujet</th>
                    <th>Société</th>
                    <th>Enc. pédagogique</th>
                    <th>Enc. entreprise</th>
                    <th>Fichiers</th>
                    <th>Statut</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {soumissions.map(s => {
                    let files = [];
                    try { files = s.fichiers ? (typeof s.fichiers === 'string' ? JSON.parse(s.fichiers) : s.fichiers) : []; } catch {}
                    return (
                      <tr key={s.id}>
                        <td>{s.sujet}</td>
                        <td>{s.societe}</td>
                        <td>{s.encadreur?.trim() || <span style={{opacity:0.4}}>—</span>}</td>
                        <td>{s.encadrant_entreprise?.trim() || <span style={{opacity:0.4}}>—</span>}</td>
                        <td>
                          {files.length > 0 ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span className="badge badge-purple">{files.length} fichier(s)</span>
                              <div style={{ display: "flex", gap: 4 }}>
                                {files.map((f, idx) => (
                                  <a key={idx} href={`http://localhost:5000/uploads/${f}`} target="_blank" rel="noreferrer"
                                    className="btn btn-outline btn-xs" style={{ minWidth: 32 }}>{idx + 1}</a>
                                ))}
                              </div>
                            </div>
                          ) : <span className="badge badge-gray">0 fichier</span>}
                        </td>
                        <td>
                          <span className={"badge " + (s.statut === "traite" ? "badge-success" : "badge-warning")}>
                            {s.statut === "traite" ? "Traité" : "En attente"}
                          </span>
                        </td>
                        <td>{new Date(s.created_at).toLocaleDateString("fr-FR")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* ── Section labels ── */
        .sf-section-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #534AB7;
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1.5px solid #EEEDFE;
        }

        /* ── Grid ── */
        .sf-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 16px;
        }
        @media (max-width: 640px) { .sf-grid { grid-template-columns: 1fr; } }

        /* ── Label ── */
        .sf-label { display: flex; align-items: center; gap: 4px; }
        .sf-required {
          color: #ef4444;
          font-size: 14px;
          line-height: 1;
          margin-left: 2px;
        }

        /* ── Input error state ── */
        .sf-input-error {
          border-color: #ef4444 !important;
          background: #fff5f5 !important;
        }
        .sf-input-error:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important; }

        /* ── Error message ── */
        .sf-error-msg {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #ef4444;
          margin-top: 5px;
          font-weight: 500;
        }

        /* ── Hint ── */
        .sf-hint {
          font-size: 12px;
          color: #7c3aed;
          margin-top: 5px;
          line-height: 1.5;
        }

        /* ── Dropzone ── */
        .sf-dropzone {
          border: 2px dashed #ddd6fe;
          border-radius: 10px;
          padding: 24px 20px;
          text-align: center;
          cursor: pointer;
          background: #faf9ff;
          transition: border-color 0.2s, background 0.2s;
          margin-bottom: 12px;
        }
        .sf-dropzone:hover { border-color: #7c3aed; background: #f5f3ff; }
        .sf-dropzone-error { border-color: #ef4444 !important; background: #fff5f5 !important; }

        /* ── Files list ── */
        .sf-files-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px;
          background: #f9fafb;
        }
        .sf-file-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        .sf-file-name {
          font-weight: 500;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sf-file-size { font-size: 11px; color: #6b7280; }
        .sf-file-remove {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #9ca3af;
          display: flex;
          align-items: center;
          border-radius: 4px;
          transition: color 0.15s, background 0.15s;
        }
        .sf-file-remove:hover { color: #ef4444; background: #fff5f5; }
      `}</style>
    </div>
  );
}