import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import { Send, MessageCircle, Upload, X, Clock, CheckCircle, AlertCircle, FileText, Calendar, Lock, ChevronDown , Pen } from "lucide-react";

/* ─────────────────────────────────────────────
   CustomSelect : dropdown en position:fixed
───────────────────────────────────────────── */
function CustomSelect({ value, onChange, options, placeholder = "— Choisir —" }) {
  const [open, setOpen] = useState(false);
  const [dropStyle, setDropStyle] = useState({});
  const triggerRef = useRef(null);

  const selectedLabel = options.find(o => String(o.value) === String(value))?.label || placeholder;

  const openDropdown = () => {
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropH = Math.min(options.length * 44 + 8, 220);
    if (spaceBelow < dropH + 8 && rect.top > dropH) {
      setDropStyle({ position: "fixed", top: rect.top - dropH - 4, left: rect.left, width: rect.width, zIndex: 99999 });
    } else {
      setDropStyle({ position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 99999 });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (triggerRef.current && !triggerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("touchstart", close); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropStyle(prev => ({ ...prev, top: rect.bottom + 4, left: rect.left, width: rect.width }));
      }
    };
    window.addEventListener("scroll", update, true);
    return () => window.removeEventListener("scroll", update, true);
  }, [open]);

  return (
    <div ref={triggerRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="form-control"
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", textAlign: "left", background: "white",
          color: value ? "var(--text-primary)" : "#9ca3af",
        }}
        onClick={() => open ? setOpen(false) : openDropdown()}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedLabel}
        </span>
        <ChevronDown size={16} style={{ flexShrink: 0, marginLeft: 8, color: "var(--text-secondary)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {open && (
        <div style={{
          ...dropStyle,
          background: "white", border: "1.5px solid var(--purple-200)",
          borderRadius: "var(--radius-md)", boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          maxHeight: 220, overflowY: "auto", padding: "4px 0",
        }}>
          <div
            style={{ padding: "10px 14px", fontSize: 14, color: "#9ca3af", cursor: "pointer", background: !value ? "var(--purple-50)" : "transparent" }}
            onMouseDown={(e) => { e.preventDefault(); onChange(""); setOpen(false); }}
          >
            {placeholder}
          </div>
          {options.map(opt => (
            <div
              key={opt.value}
              style={{
                padding: "10px 14px", fontSize: 14, color: "var(--text-primary)", cursor: "pointer",
                background: String(opt.value) === String(value) ? "var(--purple-100)" : "transparent",
                fontWeight: String(opt.value) === String(value) ? 600 : 400,
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--purple-50)"}
              onMouseLeave={e => e.currentTarget.style.background = String(opt.value) === String(value) ? "var(--purple-100)" : "transparent"}
              onMouseDown={(e) => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
          {options.length === 0 && (
            <div style={{ padding: "10px 14px", fontSize: 13, color: "#9ca3af" }}>Aucune option disponible</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page principale
───────────────────────────────────────────── */
export default function StudentReclamations() {
  const [form, setForm] = useState({ type: "probleme_date", message: "" });
  const [file, setFile] = useState(null);
  const [reclamations, setReclamations] = useState([]);
  const [soutenance, setSoutenance] = useState(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const isTerminee = soutenance && soutenance.statut === "terminee";

  const load = async () => {
    const res = await api.get("/etudiant/reclamations");
    setReclamations(res.data);
    const reponsesVues = JSON.parse(localStorage.getItem("reponsesVues") || "{}");
    let hasNew = false;
    res.data.forEach(r => {
      if (r.statut === "traitee" && r.reponse) {
        const reponseId = `${r.id}_${r.reponse_at || r.updated_at}`;
        if (!reponsesVues[reponseId]) { reponsesVues[reponseId] = true; hasNew = true; }
      }
    });
    if (hasNew) localStorage.setItem("reponsesVues", JSON.stringify(reponsesVues));
  };

  useEffect(() => {
    load();
    api.get("/etudiant/soutenance").then(r => setSoutenance(r.data)).catch(() => {});
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    if (selectedFile.size > 5 * 1024 * 1024) { setError("Le fichier ne doit pas dépasser 5MB"); return; }
    setError(""); setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setError(""); setUploading(true);
    try {
      const formData = new FormData();
      formData.append("type", form.type);
      formData.append("message", form.message);
      if (file) formData.append("piece_jointe", file);
      await api.post("/etudiant/reclamation", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setMsg("Réclamation soumise avec succès !");
      setForm({ type: "probleme_date", message: "" });
      setFile(null); load();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi");
    } finally { setUploading(false); }
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    let filename = filePath;
    if (filename.includes("\\") || filename.includes("/")) filename = filename.split(/[\\\/]/).pop();
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    return `${baseUrl.replace(/\/api$/, "")}/uploads/reclamations/${filename}`;
  };

  const typeLabel = (t) => {
    if (t === "probleme_date") return "Problème avec la date";
    if (t === "pas_encadreur") return "Pas d'encadrant assigné";
    return "Autre";
  };

  const total = reclamations.length;
  const traitees = reclamations.filter(r => r.statut === "traitee").length;
  const enAttente = reclamations.filter(r => r.statut === "en_attente").length;

  // Options type de réclamation
  const typeOptions = [
    { value: "probleme_date", label: "Problème avec la date" },
    { value: "pas_encadreur", label: "Pas d'encadrant assigné" },
    { value: "autre", label: "Autre" },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Réclamations</h1>
          <p>Gérez vos réclamations et suivez les réponses de l'administration</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ background: "#EDE9FE", color: "#5B35A8", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <FileText size={14} /> {total} Total
          </div>
          <div style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={14} /> {enAttente} En attente
          </div>
          <div style={{ background: "#D1FAE5", color: "#065F46", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle size={14} /> {traitees} Traitées
          </div>
        </div>
      </div>

      <div className="page-content">
        {msg   && <div className="alert alert-success"><CheckCircle size={16} /> {msg}</div>}
        {error && <div className="alert alert-danger"><AlertCircle size={16} /> {error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

          {/* Colonne gauche — Historique */}
          <div className="card" style={{ minHeight: 400 }}>
            <h3 style={{ marginBottom: 18, fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", gap: 8, paddingBottom: 14, borderBottom: "1px solid #F3F4F6" }}>
              Mes réclamations
            </h3>
            {reclamations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "#9CA3AF" }}>
                <AlertCircle size={40} color="#E5E7EB" style={{ margin: "0 auto 12px", display: "block" }} />
                <p style={{ fontWeight: 500 }}>Aucune réclamation pour le moment</p>
                <p style={{ fontSize: 13 }}>Utilisez le formulaire à droite pour soumettre une réclamation.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {reclamations.map(r => {
                  const reponsesVues = JSON.parse(localStorage.getItem("reponsesVues") || "{}");
                  const reponseId = `${r.id}_${r.reponse_at || r.updated_at}`;
                  const isNew = r.statut === "traitee" && r.reponse && !reponsesVues[reponseId];
                  const isTraitee = r.statut === "traitee";
                  return (
                    <div key={r.id} style={{
                      borderRadius: 12, border: `1px solid ${isTraitee ? "#A7F3D0" : "#FDE68A"}`,
                      background: isNew ? "#FFFBEB" : isTraitee ? "#F0FDF4" : "#FFFDF5",
                      padding: "14px 16px", position: "relative", transition: "all 0.2s",
                    }}>
                      {isNew && (
                        <span style={{ position: "absolute", top: 10, right: 10, background: "#F59E0B", color: "white", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                          Nouveau
                        </span>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <strong style={{ fontSize: 14, color: "#1A1033" }}>{typeLabel(r.type)}</strong>
                        <span className={`badge ${isTraitee ? "badge-success" : "badge-warning"}`} style={{ fontSize: 11 }}>
                          {isTraitee ? "Traité" : "En attente"}
                        </span>
                      </div>
                      <p style={{ color: "#374151", fontSize: 13, marginBottom: r.piece_jointe || r.reponse ? 10 : 0, lineHeight: 1.5 }}>{r.message}</p>
                      {r.piece_jointe && (
                        <a href={getFileUrl(r.piece_jointe)} target="_blank" rel="noopener noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#7C3AED", textDecoration: "none", fontSize: 12, background: "#F3F4F6", borderRadius: 6, padding: "4px 10px", marginBottom: r.reponse ? 10 : 0 }}>
                          <Upload size={12} /> Voir la pièce jointe
                        </a>
                      )}
                      {r.reponse && (
                        <div style={{ background: "white", borderRadius: 8, padding: "10px 12px", fontSize: 13, borderLeft: "3px solid #7C3AED", marginTop: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, color: "#5B35A8", fontWeight: 600, fontSize: 12 }}>
                            <MessageCircle size={12} /> Réponse de l'administration
                          </div>
                          <span style={{ color: "#374151" }}>{r.reponse}</span>
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 10, display: "flex", gap: 12 }}>
                        <span><Calendar size={14} /> {new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
                        {r.reponse_at && <span><CheckCircle size={14} /> Répondu le {new Date(r.reponse_at).toLocaleDateString("fr-FR")}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Colonne droite — Formulaire */}
          <div style={{ position: "sticky", top: 20 }}>
            {isTerminee ? (
              <div className="card" style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}><Lock size={35} /></div>
                <h3 style={{ fontWeight: 700, color: "#6B7280", marginBottom: 8 }}>Réclamations désactivées</h3>
                <p style={{ color: "#9CA3AF", fontSize: 14 }}>Votre soutenance est terminée, vous ne pouvez plus soumettre de réclamation.</p>
              </div>
            ) : (
              <div className="card">
                <h3 style={{ marginBottom: 20, fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", gap: 8, paddingBottom: 14, borderBottom: "1px solid #F3F4F6" }}>
                  <Pen size={16} /> Nouvelle réclamation
                </h3>

                <form onSubmit={handleSubmit}>
                  {/* Type — CustomSelect */}
                  <div className="form-group">
                    <label className="form-label">Type de réclamation</label>
                    <CustomSelect
                      value={form.type}
                      onChange={val => setForm({ ...form, type: val || "probleme_date" })}
                      placeholder="— Choisir un type —"
                      options={typeOptions}
                    />
                  </div>

                  {/* Message */}
                  <div className="form-group">
                    <label className="form-label">Message</label>
                    <textarea
                      className="form-control" rows={5}
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      required placeholder="Décrivez votre problème..."
                    />
                  </div>

                  {/* Pièce jointe */}
                  <div className="form-group">
                    <label className="form-label">
                      Pièce jointe <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(Optionnel)</span>
                    </label>
                    {!file ? (
                      <div
                        style={{ border: "2px dashed #DDD6FE", borderRadius: 10, padding: "24px 16px", textAlign: "center", backgroundColor: "#FAFAFA", cursor: "pointer", transition: "border-color 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "#7C3AED"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "#DDD6FE"}
                      >
                        <input type="file" id="file-upload-reclam" style={{ display: "none" }} onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" />
                        <label htmlFor="file-upload-reclam" style={{ cursor: "pointer", display: "block" }}>
                          <Upload size={28} color="#7C3AED" style={{ margin: "0 auto 8px", display: "block" }} />
                          <p style={{ color: "#6B7280", margin: 0, fontSize: 14 }}>Cliquez pour sélectionner un fichier</p>
                          <small style={{ color: "#9CA3AF" }}>Formats acceptés : JPG, PNG, PDF, DOC (max 5MB)</small>
                        </label>
                      </div>
                    ) : (
                      <div style={{ padding: "10px 14px", backgroundColor: "#EDE9FE", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, color: "#5B21B6", display: "flex", alignItems: "center", gap: 6 }}>
                          📎 {file.name}
                          <span style={{ color: "#9CA3AF", fontSize: 12 }}>({(file.size / 1024).toFixed(1)} KB)</span>
                        </span>
                        <button type="button" onClick={() => setFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#7C3AED", display: "flex", alignItems: "center" }}>
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={uploading} style={{ width: "100%", justifyContent: "center" }}>
                    <Send size={16} />
                    {uploading ? "Envoi en cours..." : "Soumettre la réclamation"}
                  </button>
                </form>

                <div style={{ marginTop: 16, padding: "12px 14px", background: "#F5F3FF", borderRadius: 10, fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>
                  💡 <strong style={{ color: "#5B35A8" }}>Conseil :</strong> Soyez précis dans votre message. L'administration vous répondra dans les plus brefs délais.
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}