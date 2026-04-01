import { useState, useEffect } from "react";
import api from "../../services/api";
import { Upload, Send, FileText, X } from "lucide-react";
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function StudentStage() {
  const { user, loading: authLoading } = useAuth();
  
  const [form, setForm] = useState({ 
    nom_etudiant: "", 
    prenom_etudiant: "", 
    email_contact: "", 
    encadreur: "", 
    societe: "", 
    sujet: "", 
    description: "" 
  });
  
  const [fichiers, setFichiers] = useState([]);
  const [soumissions, setSoumissions] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [soutenance, setSoutenance] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dejaSoumis, setDejaSoumis] = useState(false);
  const [soumissionReussie, setSoumissionReussie] = useState(false);

  const isTerminee = soutenance && soutenance.statut === "terminee";

  // Mettre à jour le formulaire quand user est chargé
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        nom_etudiant: user.nom || "",
        prenom_etudiant: user.prenom || "",
        email_contact: user.email || "",
      }));
    }
  }, [user]);

  // Charger les données et vérifier si déjà soumis
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        
        // Vérifier si déjà soumis
        const dejaSoumisRes = await api.get("/etudiant/a-deja-soumis");
        if (dejaSoumisRes.data.dejaSoumis) {
          setDejaSoumis(true);
          setSoumissionReussie(true);
          setInitialLoading(false);
          return;
        }
        
        const [soumissionsRes, soutenanceRes] = await Promise.all([
          api.get("/etudiant/stage/soumissions").catch(err => {
            console.error("Erreur chargement soumissions:", err);
            return { data: [] };
          }),
          api.get("/etudiant/soutenance").catch(err => {
            console.error("Erreur chargement soutenance:", err);
            return { data: null };
          })
        ]);
        setSoumissions(soumissionsRes.data || []);
        setSoutenance(soutenanceRes.data);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setError("Erreur de chargement des données");
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleFileChange = (e) => {
    // Bloquer si déjà soumis
    if (soumissionReussie || dejaSoumis) {
      setError("Vous ne pouvez plus ajouter de fichiers. Formulaire déjà soumis.");
      return;
    }
    
    const selectedFiles = Array.from(e.target.files);
    
    const allowedExtensions = ['pdf', 'doc', 'docx'];
    const invalidFiles = selectedFiles.filter(file => {
      const extension = file.name.split('.').pop().toLowerCase();
      return !allowedExtensions.includes(extension);
    });
    
    if (invalidFiles.length > 0) {
      setError(`Format non autorisé pour: ${invalidFiles.map(f => f.name).join(', ')}. Utilisez PDF, DOC ou DOCX`);
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError(`Fichiers trop volumineux: ${oversizedFiles.map(f => f.name).join(', ')}. Max 10MB`);
      return;
    }

    setFichiers(prevFichiers => [...prevFichiers, ...selectedFiles]);
    setError("");
    e.target.value = '';
  };

  const removeFile = (indexToRemove) => {
    if (soumissionReussie || dejaSoumis) return;
    setFichiers(fichiers.filter((_, index) => index !== indexToRemove));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Bloquer si déjà soumis
    if (soumissionReussie || dejaSoumis) {
      setError("Vous avez déjà soumis votre formulaire. Une seule soumission est autorisée.");
      return;
    }
    
    setMsg(""); 
    setError(""); 
    setLoading(true);
    
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fichiers.forEach((file) => {
        fd.append("fichiers", file);
      });
  
      await api.post("/etudiant/stage", fd, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });
      
      setMsg("Formulaire soumis avec succès !");
      
      // 🔒 VERROUILLER IMMÉDIATEMENT
      setSoumissionReussie(true);
      setDejaSoumis(true);
      
      // Vider les fichiers
      setFichiers([]);
      
      // Recharger les soumissions
      const r = await api.get("/etudiant/stage/soumissions");
      setSoumissions(r.data);
      
    } catch (err) { 
      console.error("Erreur détaillée:", err);
      setError(err.response?.data?.message || "Erreur lors de la soumission"); 
    } finally { 
      setLoading(false); 
    }
  };

  // Afficher un loader pendant le chargement initial
  if (authLoading || initialLoading) {
    return (
      <div className="page-content">
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

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
        
        {isTerminee ? (
          <div className="card" style={{ marginBottom: 24, textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
            <h3 style={{ marginBottom: 8, fontWeight: 700, color: "#6b7280" }}>Dépôt de dossier désactivé</h3>
            <p style={{ color: "#9ca3af" }}>Votre soutenance est terminée, vous ne pouvez plus déposer de dossier.</p>
          </div>
        ) : (
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
                      placeholder={k === "encadreur" ? "Nom de votre encadreur (si vous en avez un)" : `Entrez votre ${l.toLowerCase()}`}
                      value={form[k]} 
                      onChange={e => setForm({...form, [k]: e.target.value})} 
                      required={k !== "encadreur"}
                      readOnly={["nom_etudiant", "prenom_etudiant", "email_contact"].includes(k)}
                      style={["nom_etudiant", "prenom_etudiant", "email_contact"].includes(k) ? { background: "#f3f0ff", color: "#6b7280" } : {}}
                    />
                    {k === "encadreur" && (
                      <p style={{ fontSize: 12, color: "#7c3aed", marginTop: 4 }}>
                        ⚠️ Si vous n'avez pas d'encadreur, veuillez soumettre une réclamation depuis la page{' '}
                        <Link 
                          to="/student/reclamations"
                          style={{ color: "#7c3aed", textDecoration: "underline" }}
                        >
                          Réclamations
                        </Link>
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-control" 
                  placeholder="Décrivez votre stage..."
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  rows={4} 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Pièces jointes (PDF, Word) - {fichiers.length} fichier(s) sélectionné(s)
                </label>
                
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
                  onClick={() => !soumissionReussie && !dejaSoumis && document.getElementById('files-upload').click()}
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
                disabled={loading || fichiers.length === 0 || soumissionReussie || dejaSoumis}
                style={{ 
                  marginTop: 16,
                  opacity: (soumissionReussie || dejaSoumis) ? 0.5 : 1,
                  cursor: (soumissionReussie || dejaSoumis) ? 'not-allowed' : 'pointer'
                }}
              >
                <Send size={16} /> 
                {soumissionReussie || dejaSoumis ? "Formulaire déjà soumis" : (loading ? "Envoi en cours..." : "Soumettre")}
              </button>
            </form>
          </div>
        )}

        {soumissions.length > 0 && (
          <div className="card">
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Mes soumissions</h3>
            <div className="table-wrap">
              <table className="table">
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
                      <td>
                        {s.encadreur && s.encadreur.trim() !== "" ? s.encadreur : "Aucun encadreur"}
                      </td>
                      <td>
                        {s.fichiers ? (
                          (() => {
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
                          {s.statut === "traite" ? "Traité" : "En attente"}
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