import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import { MessageSquare, CheckCircle, UserPlus, Calendar, FileText, Eye, Mail, Clock, Users, AlertCircle, ChevronDown } from "lucide-react";

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
          color: value ? "var(--text-primary)" : "#a89caf",
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
            style={{ padding: "10px 14px", fontSize: 14, color: "#a69caf", cursor: "pointer", background: !value ? "var(--purple-50)" : "transparent" }}
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
            <div style={{ padding: "10px 14px", fontSize: 13, color: "#a69caf" }}>Aucune option disponible</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page principale
───────────────────────────────────────────── */
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
      setReclamations(reclamationsRes.data || []);
      setEncadreurs(juryRes.data || []);
    } catch (error) {
      setMsgType("error");
      setMsg("Erreur de chargement: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateSidebarBadge = () => window.dispatchEvent(new Event('reclamations-admin-updated'));

  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    let filename = filePath;
    if (filename.includes('\\') || filename.includes('/')) filename = filename.split(/[\\/]/).pop();
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${baseUrl.replace(/\/api$/, '')}/uploads/reclamations/${filename}`;
  };

  const isImage = (filename) => {
    if (!filename) return false;
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].some(ext => filename.toLowerCase().endsWith(ext));
  };

  const handleRepondre = async () => {
    try {
      await api.post("/admin/reclamations/" + modal.id + "/repondre", { reponse });
      setMsgType("success"); setMsg("Réponse envoyée !");
      setModal(null); setReponse(""); await load(); updateSidebarBadge();
    } catch (error) {
      setMsgType("error");
      setMsg("❌ Erreur: " + (error.response?.data?.message || "Erreur lors de l'envoi"));
    }
  };

  const handleAffecterEncadreur = async () => {
    try {
      const encadreur = encadreurs.find(e => e.id == selectedEncadreur);
      await api.post("/admin/reclamations/" + encadreurModal.id + "/repondre", {
        reponse: `Encadrant affecté: ${encadreur?.prenom} ${encadreur?.nom}`,
        affecter_encadreur: true,
        encadreur_id: selectedEncadreur
      });
      setMsgType("success"); setMsg("Encadrant affecté avec succès");
      setEncadreurModal(null); setSelectedEncadreur(""); await load(); updateSidebarBadge();
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
      setSallesDisponibles(res.data); setNouvelleSalle("");
    } catch {
      setSallesDisponibles(["Salle A101", "Salle B203", "Amphi 1"]);
    } finally { setLoadingSalles(false); }
  };

  const handleDateChange = (val) => { setNouvelleDate(val); fetchSallesDisponibles(val, nouvelleHeure); };
  const handleHeureChange = (val) => { setNouvelleHeure(val); fetchSallesDisponibles(nouvelleDate, val); };

  const handleChangerDate = async () => {
    try {
      const dateTime = `${nouvelleDate} ${nouvelleHeure || "09:00"}:00`;
      await api.post("/admin/reclamations/" + dateModal.id + "/repondre", {
        reponse: `Nouvelle date attribuée : ${new Date(dateTime).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} à ${nouvelleHeure || "09:00"}${nouvelleSalle ? " — Salle : " + nouvelleSalle : ""}`,
        nouvelle_date: dateTime,
        nouvelle_salle: nouvelleSalle || null
      });
      setMsgType("success"); setMsg("Nouvelle date attribuée !");
      setDateModal(null); setNouvelleDate(""); setNouvelleHeure(""); setNouvelleSalle("");
      await load(); updateSidebarBadge();
    } catch (err) {
      setMsgType("error");
      setMsg("❌ Erreur : " + (err.response?.data?.message || "Erreur lors du changement de date"));
    }
  };

  const typeLabel = (t) => t === "probleme_date" ? "Problème date" : t === "pas_encadreur" ? "Pas d'encadrant" : "Autre";
  const pendingCount = reclamations.filter(r => r.statut === "en_attente").length;

  // Options heures
  const heuresOptions = [
    { value: "08:30", label: "08:30" },
    { value: "09:00", label: "09:00" },
    { value: "10:30", label: "10:30" },
    { value: "11:30", label: "11:30" },
    { value: "14:00", label: "14:00" },
  ];

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
      <div className="spinner"></div>
      <p style={{ marginLeft: "10px" }}>Chargement des réclamations...</p>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="icon-squircle"><AlertCircle size={22} color="#7c3aed" /></div>
          <div>
            <h1 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
              Gestion des réclamations
              {pendingCount > 0 && (
                <span style={{ background: "#ef4444", color: "white", fontSize: "14px", padding: "2px 10px", borderRadius: "20px", fontWeight: "500" }}>
                  {pendingCount} en attente
                </span>
              )}
            </h1>
            <p style={{ margin: "4px 0 0 0", color: "#6b7280" }}>Traitez les demandes et réclamations des étudiants</p>
          </div>
        </div>
      </div>

      <div className="page-content">
        {msg && (
          <div className={`alert alert-${msgType === "success" ? "success" : "danger"}`}>
            {msgType === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {msg}
          </div>
        )}
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Étudiant</th><th>Type</th><th>Message</th>
                  <th>Pièce jointe</th><th>Statut</th><th>Date</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reclamations.length > 0 ? reclamations.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.etudiant_nom}</strong><br /><small style={{ color: "#9ca3af" }}>{r.etudiant_email}</small></td>
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
                      {r.piece_jointe ? (
                        isImage(r.piece_jointe) ? (
                          <button className="btn btn-sm btn-outline" onClick={() => setFileModal(r)} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Eye size={14} /> Voir image
                          </button>
                        ) : (
                          <a href={getFileUrl(r.piece_jointe)} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <FileText size={14} /> Voir fichier
                          </a>
                        )
                      ) : <span style={{ fontSize: 12, color: "#9ca3af" }}>Aucune pièce jointe</span>}
                    </td>
                    <td>
                      <span className={"badge " + (r.statut === "traitee" ? "badge-success" : "badge-danger")}>
                        {r.statut === "traitee" ? "Traitée" : "En attente"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString("fr-FR")}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexDirection: "column" }}>
                        {r.statut === "en_attente" && (
                          <button className="btn btn-outline btn-sm" onClick={() => { setModal(r); setReponse(""); }}>
                            <MessageSquare size={12} /> Répondre
                          </button>
                        )}
                        {r.type === "pas_encadreur" && r.statut === "en_attente" && (
                          <button className="btn btn-primary btn-sm" onClick={() => setEncadreurModal(r)} style={{ background: "#7c3aed" }}>
                            <UserPlus size={12} /> Affecter encadrant
                          </button>
                        )}
                        {r.type === "probleme_date" && r.statut === "en_attente" && (
                          <button className="btn btn-primary btn-sm" onClick={() => setDateModal(r)} style={{ background: "#16a34a" }}>
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
                )) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>
                      <AlertCircle size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
                      <p>Aucune réclamation pour le moment</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal répondre */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>💬 Répondre à la réclamation</h3>
            <p className="sub">{modal.etudiant_nom} — {typeLabel(modal.type)}</p>
            <div style={{ background: "#f9fafb", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 }}>
              <strong>Message :</strong>
              <p style={{ margin: "8px 0 0 0", color: "#493751" }}>{modal.message}</p>
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

      {/* Modal image */}
      {fileModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "90vw", maxHeight: "90vh" }}>
            <h3>📷 Pièce jointe</h3>
            <p className="sub">{fileModal.etudiant_nom}</p>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <img src={getFileUrl(fileModal.piece_jointe)} alt="Pièce jointe"
                style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 8 }}
                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<p style="color:red">❌ Impossible de charger l\'image</p>'; }} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setFileModal(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal affecter encadrant — CustomSelect */}
      {encadreurModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>👤 Affecter un encadrant</h3>
            <p className="sub">{encadreurModal.etudiant_nom}</p>
            <div className="form-group">
              <label className="form-label">Choisir un encadrant</label>
              <CustomSelect
                value={selectedEncadreur}
                onChange={setSelectedEncadreur}
                placeholder="— Choisir —"
                options={encadreurs
                  .filter(e => e.id !== Number(encadreurModal?.president_id) && e.id !== Number(encadreurModal?.membre3_id))
                  .map(e => ({ value: e.id, label: `${e.prenom} ${e.nom} (${e.email})` }))}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => { setEncadreurModal(null); setSelectedEncadreur(""); }}>Annuler</button>
              <button className="btn btn-primary" onClick={handleAffecterEncadreur} disabled={!selectedEncadreur} style={{ background: "#7c3aed" }}>
                <CheckCircle size={14} /> Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal changer date — CustomSelect pour heure et salle */}
      {dateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3><Calendar size={14} /> Changer la date de soutenance</h3>
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
              <CustomSelect
                value={nouvelleHeure}
                onChange={handleHeureChange}
                placeholder="— Choisir —"
                options={heuresOptions}
              />
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
                <CustomSelect
                  value={nouvelleSalle}
                  onChange={setNouvelleSalle}
                  placeholder="— Choisir une salle —"
                  options={sallesDisponibles.map(s => ({ value: s, label: s }))}
                />
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => { setDateModal(null); setNouvelleDate(""); setNouvelleHeure(""); setNouvelleSalle(""); }}>Annuler</button>
              <button className="btn btn-primary" onClick={handleChangerDate}
                disabled={!nouvelleDate || !nouvelleHeure || !nouvelleSalle} style={{ background: "#16a34a" }}>
                <Clock size={14} /> Confirmer la nouvelle date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}