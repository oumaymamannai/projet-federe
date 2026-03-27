import { useState, useEffect } from "react";
import api from "../../services/api";
import { Send, MessageCircle, Upload, X } from "lucide-react";

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
    
    // Marquer les réponses comme vues quand on charge la page
    const reponsesVues = JSON.parse(localStorage.getItem('reponsesVues') || '{}');
    let hasNew = false;
    
    res.data.forEach(r => {
      if (r.statut === 'traitee' && r.reponse) {
        const reponseId = `${r.id}_${r.reponse_at || r.updated_at}`;
        if (!reponsesVues[reponseId]) {
          reponsesVues[reponseId] = true;
          hasNew = true;
        }
      }
    });
    
    if (hasNew) {
      localStorage.setItem('reponsesVues', JSON.stringify(reponsesVues));
    }
  };
  
  useEffect(() => {
    load();
    api.get("/etudiant/soutenance").then(r => setSoutenance(r.data)).catch(() => {});
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Limiter la taille du fichier à 5MB
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("Le fichier ne doit pas dépasser 5MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("type", form.type);
      formData.append("message", form.message);
      if (file) {
        formData.append("piece_jointe", file);
      }

      await api.post("/etudiant/reclamation", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      setMsg("Réclamation soumise avec succès !");
      setForm({ type: "probleme_date", message: "" });
      setFile(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi");
    } finally {
      setUploading(false);
    }
  };

// Fonction pour obtenir l'URL du fichier joint
// Fonction pour obtenir l'URL du fichier joint
const getFileUrl = (filePath) => {
  if (!filePath) return null;
  
  // Nettoyer pour n'avoir que le nom du fichier
  let filename = filePath;
  if (filename.includes('\\') || filename.includes('/')) {
    filename = filename.split(/[\\/]/).pop();
  }
  
  // Utiliser l'URL de base sans /api
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // Enlever le /api final
  const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
  
  return `${cleanBaseUrl}/uploads/reclamations/${filename}`;
};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>🔔 Réclamations</h1>
          <p>Signalez un problème à l'administration</p>
        </div>
      </div>
      <div className="page-content">
        {msg && <div className="alert alert-success">✅ {msg}</div>}
        {error && <div className="alert alert-danger">⚠️ {error}</div>}
        
        {isTerminee ? (
          <div className="card" style={{ marginBottom: 24, textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
            <h3 style={{ marginBottom: 8, fontWeight: 700, color: "#6b7280" }}>Réclamations désactivées</h3>
            <p style={{ color: "#9ca3af" }}>Votre soutenance est terminée, vous ne pouvez plus soumettre de réclamation.</p>
          </div>
        ) : (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 20, fontWeight: 700 }}>Nouvelle réclamation</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Type de réclamation</label>
                <select 
                  className="form-control" 
                  value={form.type} 
                  onChange={e => setForm({...form, type: e.target.value})}
                >
                  <option value="probleme_date">Problème avec la date</option>
                  <option value="pas_encadreur">Pas d'encadreur assigné</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea 
                  className="form-control" 
                  rows={4} 
                  value={form.message} 
                  onChange={e => setForm({...form, message: e.target.value})} 
                  required 
                  placeholder="Décrivez votre problème..." 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Pièce jointe (Optionnel)</label>
                <div style={{ 
                  border: "2px dashed #e5e7eb", 
                  borderRadius: 8, 
                  padding: 20, 
                  textAlign: "center",
                  backgroundColor: "#f9fafb",
                  cursor: "pointer"
                }}>
                  <input
                    type="file"
                    id="file-upload"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  />
                  <label htmlFor="file-upload" style={{ cursor: "pointer", display: "block" }}>
                    <Upload size={32} color="#7c3aed" style={{ margin: "0 auto 8px" }} />
                    <p style={{ color: "#6b7280", margin: 0 }}>
                      Cliquez pour sélectionner un fichier
                    </p>
                    <small style={{ color: "#9ca3af" }}>
                      Formats acceptés: JPG, PNG, PDF, DOC (max 5MB)
                    </small>
                  </label>
                </div>
                
                {file && (
                  <div style={{ 
                    marginTop: 12, 
                    padding: 8, 
                    backgroundColor: "#ede9fe", 
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <span style={{ fontSize: 14, color: "#5b21b6" }}>
                      📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={removeFile}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#7c3aed"
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-primary" disabled={uploading}>
                <Send size={16} /> 
                {uploading ? "Envoi en cours..." : "Soumettre"}
              </button>
            </form>
          </div>
        )}
        
        {reclamations.length > 0 && (
          <div className="card">
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Mes réclamations</h3>
            {reclamations.map(r => {
              // Vérifier si c'est une nouvelle réponse
              const reponsesVues = JSON.parse(localStorage.getItem('reponsesVues') || '{}');
              const reponseId = `${r.id}_${r.reponse_at || r.updated_at}`;
              const isNew = r.statut === 'traitee' && r.reponse && !reponsesVues[reponseId];
              
              return (
                <div 
                  key={r.id} 
                  style={{ 
                    borderLeft: "4px solid " + (r.statut === "traitee" ? "#10b981" : "#f59e0b"), 
                    paddingLeft: 16, 
                    marginBottom: 20,
                    backgroundColor: isNew ? "#fef3c7" : "transparent"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <strong>
                      {r.type === "probleme_date" && "Problème date"}
                      {r.type === "pas_encadreur" && "Pas d'encadreur"}
                      {r.type === "autre" && "Autre"}
                    </strong>
                    <span className={"badge " + (r.statut === "traitee" ? "badge-success" : "badge-warning")}>
                      {r.statut === "traitee" ? "Traité" : "En attente"}
                    </span>
                  </div>
                  <p style={{ color: "#374151", marginBottom: 8 }}>{r.message}</p>
                  
                  {/* Affichage de la pièce jointe */}
                  {r.piece_jointe && (
                    <div style={{ background: "#f3f4f6", borderRadius: 6, padding: 8, marginBottom: 12 }}>
                      <a 
                        href={getFileUrl(r.piece_jointe)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: 6,
                          color: "#7c3aed",
                          textDecoration: "none",
                          fontSize: 13
                        }}
                      >
                        <Upload size={14} />
                        Voir la pièce jointe
                      </a>
                    </div>
                  )}
                  
                  {r.reponse && (
                    <div style={{ background: "#ede9fe", borderRadius: 8, padding: 12, fontSize: 14 }}>
                      <MessageCircle size={14} color="#7c3aed" style={{ marginRight: 6 }} />
                      <strong>Réponse admin :</strong> {r.reponse}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
                    {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    {r.reponse_at && (
                      <span style={{ marginLeft: 12 }}>
                        • Répondu le {new Date(r.reponse_at).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}