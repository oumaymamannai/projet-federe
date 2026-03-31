import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import {
  FileText, Upload, Eye, EyeOff, Trash2, Plus, X,
  FileCheck, Lock, Unlock, Calendar, User, File,
  AlertCircle, CheckCircle, FolderOpen,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────
const TYPE_META = {
  general:  { label: "Général",  color: "#6b7280", bg: "#f3f4f6" },
  template: { label: "Template", color: "#5b21b6", bg: "#ede9fe" },
  stage:    { label: "Stage",    color: "#065f46", bg: "#d1fae5" },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
};

const FILE_ICON_COLOR = "#7c3aed";

// ── Composant TypeBadge ───────────────────────────────────────
function TypeBadge({ type }) {
  const meta = TYPE_META[type] || TYPE_META.general;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: meta.bg, color: meta.color,
      padding: "2px 9px", borderRadius: 20,
      fontSize: 11, fontWeight: 600,
    }}>
      {meta.label}
    </span>
  );
}

// ── Composant DocumentCard ────────────────────────────────────
function DocumentCard({ doc, onToggle, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e0f8",
      borderRadius: 14,
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      transition: "box-shadow .15s",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(124,58,237,.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* Icône fichier */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: "#f5f3ff",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <FileText size={22} color={FILE_ICON_COLOR} />
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1033", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {doc.titre}
          </span>
          <TypeBadge type={doc.type} />
          {doc.publie
            ? <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>
                <CheckCircle size={10} /> Publié
              </span>
            : <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#f3f4f6", color: "#6b7280", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>
                <Lock size={10} /> Masqué
              </span>
          }
        </div>
        {doc.description && (
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 6px", lineHeight: 1.4 }}>
            {doc.description}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#9ca3af" }}>
            <Calendar size={11} />{fmtDate(doc.created_at)}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#9ca3af" }}>
            <User size={11} />{doc.uploaded_by_nom || "—"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {/* Voir */}
        <a
          href={"/uploads/" + doc.fichier_path}
          target="_blank"
          rel="noreferrer"
          title="Visualiser"
          style={{
            width: 34, height: 34, borderRadius: 8,
            background: "#f5f3ff", border: "1px solid #ede9fe",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#7c3aed", textDecoration: "none", transition: "background .12s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#ede9fe"}
          onMouseLeave={e => e.currentTarget.style.background = "#f5f3ff"}
        >
          <Eye size={15} />
        </a>

        {/* Publier / Masquer */}
        <button
          title={doc.publie ? "Masquer aux étudiants" : "Publier aux étudiants"}
          onClick={() => onToggle(doc.id)}
          style={{
            width: 34, height: 34, borderRadius: 8,
            background: doc.publie ? "#fef3c7" : "#f0fdf4",
            border: `1px solid ${doc.publie ? "#fde68a" : "#a7f3d0"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: doc.publie ? "#92400e" : "#065f46",
            cursor: "pointer", transition: "opacity .12s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".75"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          {doc.publie ? <EyeOff size={15} /> : <Unlock size={15} />}
        </button>

        {/* Supprimer */}
        {!confirmDelete ? (
          <button
            title="Supprimer"
            onClick={() => setConfirmDelete(true)}
            style={{
              width: 34, height: 34, borderRadius: 8,
              background: "#fef2f2", border: "1px solid #fecaca",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#ef4444", cursor: "pointer", transition: "opacity .12s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".75"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <Trash2 size={15} />
          </button>
        ) : (
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => onDelete(doc.id)} style={{ padding: "5px 10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              Confirmer
            </button>
            <button onClick={() => setConfirmDelete(false)} style={{ padding: "5px 8px", background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>
              <X size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modale Upload ─────────────────────────────────────────────
function UploadModal({ onClose, onSuccess }) {
  const [form, setForm]     = useState({ titre: "", description: "", type: "general", publie: false });
  const [fichier, setFichier] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext)) {
      setError("Format non supporté. Utilisez PDF, DOC ou DOCX.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("Fichier trop volumineux (max 25 Mo).");
      return;
    }
    setError("");
    setFichier(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fichier) { setError("Sélectionnez un fichier."); return; }
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("fichier", fichier);
      await api.post("/admin/documents", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'upload.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,5,32,.55)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      backdropFilter: "blur(2px)",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, width: 520, maxWidth: "95vw",
        maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 24px 80px rgba(124,58,237,.18)",
      }}>
        {/* Header modale */}
        <div style={{
          padding: "22px 24px 0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, background: "#f5f3ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Upload size={18} color="#7c3aed" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1033" }}>Upload Document</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>PDF, DOC ou DOCX · max 25 Mo</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4, borderRadius: 8 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "0 24px 24px" }}>
          {error && (
            <div style={{ padding: "10px 14px", background: "#fef2f2", borderLeft: "3px solid #ef4444", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#991b1b", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertCircle size={13} />{error}
            </div>
          )}

          {/* Titre */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
              Titre <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e5e0f8", borderRadius: 10, fontSize: 13, color: "#1a1033", outline: "none", fontFamily: "inherit" }}
              placeholder="Ex : Cahier des charges de soutenance"
              value={form.titre}
              onChange={e => setForm({ ...form, titre: e.target.value })}
              onFocus={e => e.target.style.borderColor = "#7c3aed"}
              onBlur={e => e.target.style.borderColor = "#e5e0f8"}
              required
            />
          </div>

          {/* Type */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {Object.entries(TYPE_META).map(([key, meta]) => (
                <label key={key} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "8px 10px", borderRadius: 10, cursor: "pointer",
                  border: `1.5px solid ${form.type === key ? "#7c3aed" : "#e5e0f8"}`,
                  background: form.type === key ? "#f5f3ff" : "#fff",
                  fontSize: 12, fontWeight: 600,
                  color: form.type === key ? "#5b21b6" : "#6b7280",
                  transition: "all .12s",
                }}>
                  <input type="radio" name="type" value={key} checked={form.type === key} onChange={() => setForm({ ...form, type: key })} style={{ display: "none" }} />
                  {key === "general" ? <File size={13} /> : key === "template" ? <FileCheck size={13} /> : <FileText size={13} />}
                  {meta.label}
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Description</label>
            <textarea
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e5e0f8", borderRadius: 10, fontSize: 13, color: "#1a1033", outline: "none", fontFamily: "inherit", resize: "vertical", minHeight: 72 }}
              placeholder="Décrivez brièvement ce document..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              onFocus={e => e.target.style.borderColor = "#7c3aed"}
              onBlur={e => e.target.style.borderColor = "#e5e0f8"}
            />
          </div>

          {/* Zone drop fichier */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
              Fichier <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragging ? "#7c3aed" : fichier ? "#10b981" : "#c4b5fd"}`,
                borderRadius: 12, padding: "24px 16px",
                textAlign: "center", cursor: "pointer",
                background: dragging ? "#f5f3ff" : fichier ? "#f0fdf4" : "#faf9ff",
                transition: "all .15s",
              }}
            >
              {fichier ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, background: "#d1fae5", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileCheck size={18} color="#10b981" />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#065f46" }}>{fichier.name}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{fmtSize(fichier.size)}</div>
                  </div>
                  <button type="button" onClick={e => { e.stopPropagation(); setFichier(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", marginLeft: 4 }}>
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ width: 40, height: 40, background: "#ede9fe", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                    <Upload size={20} color="#7c3aed" />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#5b21b6" }}>Cliquez ou glissez-déposez</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>PDF, DOC, DOCX · Max 25 Mo</div>
                </>
              )}
            </div>
            <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          </div>

          {/* Toggle publier */}
          <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, cursor: "pointer" }}>
            <div
              onClick={() => setForm(f => ({ ...f, publie: !f.publie }))}
              style={{
                width: 38, height: 22, borderRadius: 11,
                background: form.publie ? "#7c3aed" : "#d1d5db",
                position: "relative", transition: "background .2s", flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute", top: 3, left: form.publie ? 19 : 3,
                width: 16, height: 16, borderRadius: "50%", background: "#fff",
                transition: "left .2s",
              }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1033" }}>
                Publier immédiatement
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>
                {form.publie ? "Visible aux étudiants dès l'upload" : "Restera masqué aux étudiants"}
              </div>
            </div>
          </label>

          {/* Boutons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: "10px 0", background: "#7c3aed", color: "#fff",
                border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                opacity: loading ? .6 : 1,
              }}
            >
              <Upload size={15} />
              {loading ? "Upload en cours..." : "Uploader le document"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 18px", background: "#f3f4f6", color: "#6b7280",
                border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────
export default function AdminDocuments() {
  const [docs, setDocs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter]     = useState("tous");
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadDocuments = () =>
    api.get("/admin/documents")
      .then(r => setDocs(r.data))
      .catch(() => showToast("Erreur de chargement", "error"))
      .finally(() => setLoading(false));

  useEffect(() => { loadDocuments(); }, []);

  const handleToggle = async (id) => {
    try {
      await api.patch(`/admin/documents/${id}/toggle`);
      await loadDocuments();
      showToast("Visibilité mise à jour");
    } catch { showToast("Erreur lors de la modification", "error"); }
  };

const handleDelete = async (id) => {
  // Récupérer le document avant suppression pour avoir son titre
  const docToDelete = docs.find(doc => doc.id === id);
  const docTitle = docToDelete?.titre || "Document";
  
  try {
    await api.delete(`/admin/documents/${id}`);
    await loadDocuments();
    // Message personnalisé avec le nom du document
    showToast(`✅ "${docTitle}" a été supprimé avec succès`, "success");
  } catch { 
    showToast(`❌ Erreur : impossible de supprimer "${docTitle}"`, "error"); 
  }
};

  const filtered = filter === "tous"
    ? docs
    : filter === "publie"
      ? docs.filter(d => d.publie)
      : filter === "masque"
        ? docs.filter(d => !d.publie)
        : docs.filter(d => d.type === filter);

  const counts = {
    tous:     docs.length,
    publie:   docs.filter(d => d.publie).length,
    masque:   docs.filter(d => !d.publie).length,
    template: docs.filter(d => d.type === "template").length,
    stage:    docs.filter(d => d.type === "stage").length,
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 24, zIndex: 2000,
          padding: "12px 18px",
          background: toast.type === "error" ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${toast.type === "error" ? "#fecaca" : "#a7f3d0"}`,
          borderRadius: 12, fontSize: 13, fontWeight: 600,
          color: toast.type === "error" ? "#991b1b" : "#065f46",
          display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,.1)",
        }}>
          {toast.type === "error" ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* ── Modale ── */}
      {showModal && (
        <UploadModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { loadDocuments(); showToast("Document uploadé avec succès !"); }}
        />
      )}

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1>
            <span className="icon-squircle page-title-icon" aria-hidden>
              <FolderOpen size={22} />
            </span>
            Documents
          </h1>
          <p>{docs.length} document{docs.length > 1 ? "s" : ""} disponible{docs.length > 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <Plus size={16} /> Ajouter un document
        </button>
      </div>

      <div className="page-content">

        {/* ── Filtres ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { key: "tous",     label: "Tous" },
            { key: "publie",   label: "Publiés" },
            { key: "masque",   label: "Masqués" },
            { key: "template", label: "Templates" },
            { key: "stage",    label: "Stage" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: "pointer", border: "1.5px solid",
                borderColor: filter === key ? "#7c3aed" : "#e5e0f8",
                background: filter === key ? "#7c3aed" : "#fff",
                color: filter === key ? "#fff" : "#6b7280",
                display: "inline-flex", alignItems: "center", gap: 5,
                transition: "all .12s",
              }}
            >
              {label}
              <span style={{
                background: filter === key ? "rgba(255,255,255,.25)" : "#f3f4f6",
                color: filter === key ? "#fff" : "#9ca3af",
                padding: "0px 6px", borderRadius: 10, fontSize: 10, fontWeight: 700,
              }}>
                {counts[key] ?? "—"}
              </span>
            </button>
          ))}
        </div>

        {/* ── Liste documents ── */}
        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "56px 24px",
            background: "#fff", borderRadius: 16, border: "1px solid #e5e0f8",
          }}>
            <div style={{ width: 56, height: 56, background: "#f5f3ff", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <FolderOpen size={26} color="#c4b5fd" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>
              {filter === "tous" ? "Aucun document" : `Aucun document dans cette catégorie`}
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 18 }}>
              {filter === "tous" ? "Commencez par ajouter un document." : "Essayez un autre filtre."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(doc => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}