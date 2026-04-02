import { useState, useEffect } from "react";
import api from "../../services/api";
import { MessageSquare, CheckCircle, UserPlus, Calendar, FileText, Eye, Bell, Mail, Clock, Users, AlertCircle } from "lucide-react";

export default function AdminReclamations() {
  const [reclamations, setReclamations] = useState([]);
  const [encadreurs, setEncadreurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [encadreurModal, setEncadreurModal] = useState(null);
  const [dateModal, setDateModal] = useState(null);
  const [reponse, setReponse] = useState("");
  const [selectedEncadreur, setSelectedEncadreur] = useState("");
  const [nouvelleDate, setNouvelleDate] = useState("");
  const [nouvelleHeure, setNouvelleHeure] = useState("");
  const [nouvelleSalle, setNouvelleSalle] = useState("");
  const [sallesDisponibles, setSallesDisponibles] = useState([]);
  const [loadingSalles, setLoadingSalles] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const [fileModal, setFileModal] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const [reclamationsRes, juryRes] = await Promise.all([
        api.get("/admin/reclamations"),
        api.get("/admin/jury/members")
      ]);
      
      console.log("Réclamations reçues:", reclamationsRes.data);
      console.log("Membres du jury reçus:", juryRes.data);
      
      setReclamations(reclamationsRes.data || []);
      setEncadreurs(juryRes.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      setMsgType("error");
      setMsg("Erreur de chargement: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { load(); }, []);

  const updateSidebarBadge = () => {
    window.dispatchEvent(new Event('reclamations-admin-updated'));
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    
    let filename = filePath;
    if (filename.includes('\\') || filename.includes('/')) {
      filename = filename.split(/[\\/]/).pop();
    }
    
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
    
    return `${cleanBaseUrl}/uploads/reclamations/${filename}`;
  };

  const isImage = (filename) => {
    if (!filename) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const handleRepondre = async () => {
    try {
      await api.post("/admin/reclamations/" + modal.id + "/repondre", { reponse });
      setMsgType("success");
      setMsg(" Réponse envoyée !"); 
      setModal(null); 
      setReponse(""); 
      await load();
      updateSidebarBadge();
    } catch (error) { 
      setMsgType("error");
      setMsg("❌ Erreur: " + (error.response?.data?.message || "Erreur lors de l'envoi")); 
    }
  };

  const handleAffecterEncadreur = async () => {
    try {
      const encadreur = encadreurs.find(e => e.id == selectedEncadreur);
      
      await api.post("/admin/reclamations/" + encadreurModal.id + "/repondre", {
        reponse: `Encadreur affecté: ${encadreur?.prenom} ${encadreur?.nom}`,
        affecter_encadreur: true,
        encadreur_id: selectedEncadreur
      });
      
      setMsgType("success");
      setMsg(" Encadreur affecté avec succès");
      setEncadreurModal(null);
      setSelectedEncadreur("");
      await load();
      updateSidebarBadge();
    } catch (err) {
      setMsgType("error");
      setMsg("❌ " + (err.response?.data?.message || "Erreur lors de l'affectation"));
    }
  };

  const fetchSallesDisponibles = async (date, heure) => {
    if (!date || !heure) { setSallesDisponibles([]); return; }
    setLoadingSalles(true);
    try {
      const res = await api.get(`/admin/salles-disponibles?date=${date}&heure=${heure}`);
      setSallesDisponibles(res.data);
      setNouvelleSalle("");
    } catch (error) {
      console.error("Erreur chargement salles:", error);
      setSallesDisponibles(["Salle A101", "Salle B203", "Amphi 1"]);
    } finally {
      setLoadingSalles(false);
    }
  };

  const handleDateChange = (val) => {
    setNouvelleDate(val);
    fetchSallesDisponibles(val, nouvelleHeure);
  };

  const handleHeureChange = (val) => {
    setNouvelleHeure(val);
    fetchSallesDisponibles(nouvelleDate, val);
  };

  const handleChangerDate = async () => {
    try {
      const dateTime = `${nouvelleDate} ${nouvelleHeure || "09:00"}:00`;
      await api.post("/admin/reclamations/" + dateModal.id + "/repondre", {
        reponse: `Nouvelle date attribuée : ${new Date(dateTime).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} à ${nouvelleHeure || "09:00"}${nouvelleSalle ? " — Salle : " + nouvelleSalle : ""}`,
        nouvelle_date: dateTime,
        nouvelle_salle: nouvelleSalle || null
      });
      setMsgType("success");
      setMsg(" Nouvelle date attribuée !");
      setDateModal(null);
      setNouvelleDate("");
      setNouvelleHeure("");
      setNouvelleSalle("");
      await load();
      updateSidebarBadge();
    } catch (err) {
      setMsgType("error");
      setMsg("❌ Erreur : " + (err.response?.data?.message || "Erreur lors du changement de date"));
    }
  };

  const typeLabel = (t) => t === "probleme_date" ? "Problème date" : t === "pas_encadreur" ? "Pas d'encadreur" : "Autre";

  // Compter les réclamations en attente
  const pendingCount = reclamations.filter(r => r.statut === "en_attente").length;

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
      <div className="spinner"></div>
      <p style={{ marginLeft: "10px" }}>Chargement des réclamations...</p>
    </div>
  );

  return (
    <div>
      <div className="page-header">
          <div>
            <h1>
            <span className="icon-squircle page-title-icon" aria-hidden>
              <AlertCircle size={22} />
            </span>{" "}
            Soumissions de stage
          </h1>
            <p style={{ margin: "4px 0 0 0", color: "#6b7280" }}>
              Traitez les demandes et réclamations des étudiants
            </p>
          </div>
        
      </div>
      
      <div className="page-content">
        {msg && (
          <div className={`alert alert-${msgType === "success" ? "success" : "danger"}`}>
            {msgType === "success" ? "✅" : "❌"} {msg}
          </div>
        )}
        
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Pièce jointe</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reclamations.length > 0 ? (
                  reclamations.map(r => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.etudiant_nom}</strong>
                        <br /><small style={{color:"#9ca3af"}}>{r.etudiant_email}</small>
                      </td>
                      <td>
                        <span className="badge badge-purple">
                          {r.type === "probleme_date" && <Calendar size={12} style={{ marginRight: "4px" }} />}
                          {r.type === "pas_encadreur" && <Users size={12} style={{ marginRight: "4px" }} />}
                          {r.type === "autre" && <AlertCircle size={12} style={{ marginRight: "4px" }} />}
                          {typeLabel(r.type)}
                        </span>
                      </td>
                      <td style={{ maxWidth: 200, fontSize: 13 }}>{r.message}</td>
                      <td>
                        {r.piece_jointe && (
                          <div>
                            {isImage(r.piece_jointe) ? (
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => setFileModal(r)}
                                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                              >
                                <Eye size={14} /> Voir image
                              </button>
                            ) : (
                              <a
                                href={getFileUrl(r.piece_jointe)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline"
                                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                              >
                                <FileText size={14} /> Voir fichier
                              </a>
                            )}
                          </div>
                        )}
                        {!r.piece_jointe && (
                          <span style={{ fontSize: 12, color: "#9ca3af" }}>Aucune pièce jointe</span>
                        )}
                      </td>
                      <td>
                        <span className={"badge " + (r.statut === "traitee" ? "badge-success" : "badge-warning")}>
                          {r.statut === "traitee" ? "Traitée" : "En attente"}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString("fr-FR")}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexDirection: "column" }}>
                          {r.statut === "en_attente" && (
                            <button 
                              className="btn btn-outline btn-sm" 
                              onClick={() => { setModal(r); setReponse(""); }}
                            >
                              <MessageSquare size={12} /> Répondre
                            </button>
                          )}
                          
                          {r.type === "pas_encadreur" && r.statut === "en_attente" && (
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => setEncadreurModal(r)}
                              style={{ background: "#7c3aed" }}
                            >
                              <UserPlus size={12} /> Affecter encadreur
                            </button>
                          )}
                          
                          {r.type === "probleme_date" && r.statut === "en_attente" && (
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => setDateModal(r)}
                              style={{ background: "#16a34a" }}
                            >
                              <Calendar size={12} /> Changer la date
                            </button>
                          )}
                          
                          {r.reponse && (
                            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                              <Mail size={10} style={{ display: "inline", marginRight: "4px" }} />
                              {r.reponse.substring(0, 30)}...
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>
                      <Bell size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
                      <p>Aucune réclamation pour le moment</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals remain the same */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>💬 Répondre à la réclamation</h3>
            <p className="sub">{modal.etudiant_nom} — {typeLabel(modal.type)}</p>
            <div style={{ background: "#f9fafb", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 }}>
              <strong>Message :</strong>
              <p style={{ margin: "8px 0 0 0", color: "#374151" }}>{modal.message}</p>
            </div>
            
            <div className="form-group">
              <label className="form-label">Votre réponse</label>
              <textarea className="form-control" rows={4} value={reponse} onChange={e => setReponse(e.target.value)} placeholder="Écrivez votre réponse ici..." />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleRepondre} disabled={!reponse.trim()}>Envoyer</button>
            </div>
          </div>
        </div>
      )}

      {fileModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "90vw", maxHeight: "90vh" }}>
            <h3>📷 Pièce jointe</h3>
            <p className="sub">{fileModal.etudiant_nom}</p>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <img 
                src={getFileUrl(fileModal.piece_jointe)} 
                alt="Pièce jointe"
                style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 8 }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<p style="color:red">❌ Impossible de charger l\'image</p>';
                }}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setFileModal(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {encadreurModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>👤 Affecter un encadreur</h3>
            <p className="sub">{encadreurModal.etudiant_nom}</p>
            
            <div className="form-group">
              <label className="form-label">Choisir un encadreur</label>
              <select 
                className="form-control"
                value={selectedEncadreur}
                onChange={(e) => setSelectedEncadreur(e.target.value)}
              >
                <option value="">— Choisir —</option>
                {encadreurs
                  .filter(e => e.id !== Number(encadreurModal?.president_id) && e.id !== Number(encadreurModal?.membre3_id))
                  .map(e => (
                    <option key={e.id} value={e.id}>
                      {e.prenom} {e.nom} ({e.email})
                    </option>
                  ))}
              </select>

            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setEncadreurModal(null)}>Annuler</button>
              <button 
                className="btn btn-primary" 
                onClick={handleAffecterEncadreur}
                disabled={!selectedEncadreur}
                style={{ background: "#7c3aed" }}
              >
                <CheckCircle size={14} /> Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {dateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>📅 Changer la date de soutenance</h3>
            <p className="sub">{dateModal.etudiant_nom}</p>
            
            <div style={{ background: "#fef3c7", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14, color: "#92400e" }}>
              <strong>Réclamation :</strong> {dateModal.message}
            </div>

            <div className="form-group">
              <label className="form-label">Nouvelle date</label>
              <input type="date" className="form-control" value={nouvelleDate} onChange={e => handleDateChange(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Heure</label>
              <select className="form-control" value={nouvelleHeure} onChange={e => handleHeureChange(e.target.value)}>
                <option value="">— Choisir —</option>
                <option value="08:30">08:30</option>
                <option value="09:00">09:00</option>
                <option value="10:30">10:30</option>
                <option value="11:30">11:30</option>
                <option value="14:00">14:00</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Salle</label>
              {!nouvelleDate || !nouvelleHeure ? (
                <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Choisissez d'abord une date et une heure</p>
              ) : loadingSalles ? (
                <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Chargement des salles disponibles...</p>
              ) : sallesDisponibles.length === 0 ? (
                <p style={{ fontSize: 13, color: "#ef4444", margin: 0 }}>❌ Aucune salle disponible pour ce créneau</p>
              ) : (
                <select className="form-control" value={nouvelleSalle} onChange={e => setNouvelleSalle(e.target.value)}>
                  <option value="">— Choisir une salle —</option>
                  {sallesDisponibles.map(s => (
                    <option key={s} value={s}>{s} </option>
                  ))}
                </select>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => { setDateModal(null); setNouvelleDate(""); setNouvelleHeure(""); setNouvelleSalle(""); }}>Annuler</button>
              <button className="btn btn-primary" onClick={handleChangerDate} disabled={!nouvelleDate || !nouvelleHeure || !nouvelleSalle} style={{ background: "#16a34a" }}>
                <Clock size={14} /> Confirmer la nouvelle date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}