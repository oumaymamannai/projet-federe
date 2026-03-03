import { useState, useEffect } from "react";
import api from "../../services/api";
import { Upload, Send, FileText, X } from "lucide-react";

export default function StudentStage() {
  const [form, setForm] = useState({ 
    nom_etudiant: "", 
    prenom_etudiant: "", 
    email_contact: "", 
    encadreur: "", 
    societe: "", 
    sujet: "", 
    description: "" 
  });
  const [fichiers, setFichiers] = useState([]); // Tableau de fichiers
  const [soumissions, setSoumissions] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/etudiant/stage/soumissions").then(r => setSoumissions(r.data));
  }, []);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validation par extension (plus fiable)
    const allowedExtensions = ['pdf', 'doc', 'docx'];
    const invalidFiles = selectedFiles.filter(file => {
      const extension = file.name.split('.').pop().toLowerCase();
      return !allowedExtensions.includes(extension);
    });
    
    if (invalidFiles.length > 0) {
      setError(`Format non autorisé pour: ${invalidFiles.map(f => f.name).join(', ')}. Utilisez PDF, DOC ou DOCX`);
      return;
    }

    // Limite de taille (10MB)
    const maxSize = 10 * 1024 * 1024;
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError(`Fichiers trop volumineux: ${oversizedFiles.map(f => f.name).join(', ')}. Max 10MB`);
      return;
    }

    // Ajouter les nouveaux fichiers
    setFichiers(prevFichiers => [...prevFichiers, ...selectedFiles]);
    setError(""); // Effacer les erreurs
    e.target.value = '';
  };

  const removeFile = (indexToRemove) => {
    setFichiers(fichiers.filter((_, index) => index !== indexToRemove));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); 
    setError(""); 
    setLoading(true);
    
    try {
      const fd = new FormData();
      
      // Ajouter les champs du formulaire
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      
      // ✅ CORRIGÉ : "fichiers" sans crochets
      fichiers.forEach((file) => {
        fd.append("fichiers", file);
      });
  
      const response = await api.post("/etudiant/stage", fd, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });
      
      setMsg("Formulaire soumis avec succès !");
      
      // Réinitialiser le formulaire
      setForm({ 
        nom_etudiant: "", 
        prenom_etudiant: "", 
        email_contact: "", 
        encadreur: "", 
        societe: "", 
        sujet: "", 
        description: "" 
      });
      setFichiers([]);
      
      const r = await api.get("/etudiant/stage/soumissions");
      setSoumissions(r.data);
    } catch (err) { 
      console.error("Erreur détaillée:", err);
      setError(err.response?.data?.message || "Erreur lors de la soumission"); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>📋 Formulaire de stage</h1>
          <p>Soumettez vos informations de stage</p>
        </div>
      </div>
      
      <div className="page-content">
        {msg && <div className="alert alert-success">✅ {msg}</div>}
        {error && <div className="alert alert-danger">⚠️ {error}</div>}
        
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 20, fontWeight: 700 }}>Nouvelle soumission</h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                ["nom_etudiant","Nom"],
                ["prenom_etudiant","Prénom"],
                ["email_contact","Email"],
                ["encadreur","Encadreur"],
                ["societe","Société"],
                ["sujet","Sujet"]
              ].map(([k, l]) => (
                <div className="form-group" key={k}>
                  <label className="form-label">{l}</label>
                  <input 
                    className="form-control" 
                    value={form[k]} 
                    onChange={e => setForm({...form, [k]: e.target.value})} 
                    required 
                  />
                </div>
              ))}
            </div>
            
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea 
                className="form-control" 
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
                rows={4} 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Pièces jointes (PDF, Word) - {fichiers.length} fichier(s) sélectionné(s)
              </label>
              
              {/* Zone de sélection des fichiers */}
              <div 
                style={{ 
                  border: "2px dashed #ddd6fe", 
                  borderRadius: 10, 
                  padding: 20, 
                  textAlign: "center", 
                  cursor: "pointer", 
                  background: "#faf9ff",
                  marginBottom: 16
                }}
                onClick={() => document.getElementById('files-upload').click()}
              >
                <Upload size={24} color="#7c3aed" style={{ margin: "0 auto 8px", display: "block" }} />
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  onChange={handleFileChange} 
                  style={{ display: "none" }} 
                  id="files-upload"
                  multiple
                />
                <span style={{ cursor: "pointer", color: "#7c3aed", fontWeight: 600 }}>
                  Cliquez pour sélectionner plusieurs fichiers
                </span>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
                  Vous pouvez sélectionner plusieurs fichiers en maintenant Ctrl (Cmd sur Mac)
                </p>
              </div>

              {/* Liste des fichiers sélectionnés */}
              {fichiers.length > 0 && (
                <div style={{ 
                  border: "1px solid #e5e7eb", 
                  borderRadius: 8, 
                  padding: 12,
                  background: "#f9fafb"
                }}>
                  <p style={{ fontWeight: 600, marginBottom: 12 }}>
                    Fichiers sélectionnés :
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {fichiers.map((file, index) => (
                      <div 
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "8px 12px",
                          background: "white",
                          borderRadius: 6,
                          border: "1px solid #e5e7eb"
                        }}
                      >
                        <FileText size={20} color="#7c3aed" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontWeight: 500, 
                            fontSize: 14,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}>
                            {file.name}
                          </div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 4,
                            color: "#9ca3af",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || fichiers.length === 0}
              style={{ marginTop: 16 }}
            >
              <Send size={16} /> 
              {loading ? "Envoi en cours..." : "Soumettre"}
            </button>
          </form>
        </div>

        {soumissions.length > 0 && (
          <div className="card">
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Mes soumissions</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Sujet</th>
                    <th>Société</th>
                    <th>Encadreur</th>
                    <th>Fichiers</th>
                    <th>Statut</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {soumissions.map(s => (
                    <tr key={s.id}>
                      <td>{s.sujet}</td>
                      <td>{s.societe}</td>
                      <td>{s.encadreur}</td>
                      <td>
  {s.fichiers ? (
    (() => {
      // ✅ Fonction pour normaliser en tableau
      const getFilesArray = (data) => {
        if (Array.isArray(data)) return data;
        if (typeof data === 'string') {
          try { 
            return JSON.parse(data); 
          } catch { 
            return []; 
          }
        }
        return [];
      };
      
      const files = getFilesArray(s.fichiers);
      
      return files.length > 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="badge badge-purple">
            {files.length} fichier(s)
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {files.map((f, idx) => (
              <a 
                key={idx}
                href={`http://localhost:5000/uploads/${f}`} 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-outline btn-xs"
                style={{ minWidth: 32 }}
              >
                {idx + 1}
              </a>
            ))}
          </div>
        </div>
      ) : (
        <span className="badge badge-gray">0 fichier</span>
      );
    })()
  ) : (
    <span className="badge badge-gray">0 fichier</span>
  )}
</td>
                      <td>
                        <span className={"badge " + (s.statut === "traite" ? "badge-success" : "badge-warning")}>
                          {s.statut}
                        </span>
                      </td>
                      <td>{new Date(s.created_at).toLocaleDateString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}