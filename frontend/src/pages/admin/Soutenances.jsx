import { useState, useEffect } from "react";
import api from "../../services/api";
import { Send, Users } from "lucide-react";

export default function AdminSoutenances() {
  const [soutenances, setSoutenances] = useState([]);
  const [jurys, setJurys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(null);
  const [assignForm, setAssignForm] = useState({ encadreur_id: "", president_id: "", membre3_id: "" });
  const [msg, setMsg] = useState("");

  const load = () => Promise.all([api.get("/admin/soutenances"), api.get("/admin/jury")])
    .then(([s, j]) => { setSoutenances(s.data); setJurys(j.data); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleAssign = async () => {
    // Vérifier que les 3 sont différents
    if (assignForm.encadreur_id && assignForm.president_id && assignForm.membre3_id) {
      if (assignForm.encadreur_id === assignForm.president_id || 
          assignForm.encadreur_id === assignForm.membre3_id || 
          assignForm.president_id === assignForm.membre3_id) {
        setMsg("❌ Un même jury ne peut pas avoir plusieurs rôles");
        return;
      }
    }
    
    try {
      // Envoyer uniquement président et 3ème membre — l'encadreur est figé côté serveur
      await api.post("/admin/jury/" + assignModal.id, {
        president_id: assignForm.president_id,
        membre3_id: assignForm.membre3_id
      });
      setMsg("✅ Jury affecté !"); 
      setAssignModal(null); 
      load();
    } catch (err) { 
      setMsg(err.response?.data?.message || "Erreur"); 
    }
  };
// Filtrer les jurys pour éviter les doublons
const getFilteredJurys = (role) => {
  const selectedValues = {
    encadreur: parseInt(assignForm.encadreur_id) || null,
    president: parseInt(assignForm.president_id) || null,
    membre3: parseInt(assignForm.membre3_id) || null
  };
  const encadreurId = parseInt(assignForm.encadreur_id) || (assignModal?.encadreur_id ? parseInt(assignModal.encadreur_id) : null);

  return jurys.filter(j => {
    // 1. Exclure l'admin (GradFlow Admin a généralement id=1)
    if (j.id === 1) return false;
    // 2. Exclure l'encadreur figé
    if (encadreurId && j.id === encadreurId) return false;

    if (role === 'encadreur') {
      return j.id !== selectedValues.president && j.id !== selectedValues.membre3;
    }
    if (role === 'president') {
      return j.id !== encadreurId && j.id !== selectedValues.membre3;
    }
    if (role === 'membre3') {
      return j.id !== encadreurId && j.id !== selectedValues.president;
    }
    return true;
  });
};
  const handleSendResult = async (id) => {
    try { await api.post("/admin/resultat/" + id + "/envoyer"); alert("Email envoyé !"); }
    catch { alert("Erreur lors de l'envoi"); }
  };

  const statusBadge = (s) => {
    if (s === "planifiee") return <span className="badge badge-purple">📅 Planifiée</span>;
    if (s === "terminee") return <span className="badge badge-success">✅ Terminée</span>;
    return <span className="badge badge-warning">⏳ En attente</span>;
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header"><div><h1>🎓 Soutenances</h1><p>Gestion des soutenances et affectation des jurys</p></div></div>
      <div className="page-content">
        {msg && <div className="alert alert-success">✅ {msg}</div>}
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Étudiant</th><th>Sujet</th><th>Date</th><th>Salle</th><th>Statut</th><th>Note</th><th>Jury</th><th>Actions</th></tr></thead>
              <tbody>
                {soutenances.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.etudiant_nom}</strong><br /><small style={{color:"#9ca3af"}}>{s.etudiant_email}</small></td>
                    <td style={{ maxWidth: 180 }}>{s.sujet}</td>
                    <td>{s.date_soutenance ? new Date(s.date_soutenance).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                    <td>{s.salle || "—"}</td>
                    <td>{statusBadge(s.statut)}</td>
                    <td><strong>{s.note_finale != null ? s.note_finale + "/20" : "—"}</strong></td>
                    <td>
                      {s.jurys?.length > 0 ? s.jurys.map((j, i) => (
                        <div key={i} style={{ fontSize: 12 }}>{j.nom} <span style={{color:"#9ca3af"}}>({j.role})</span></div>
                      )) : <span style={{color:"#9ca3af"}}>Non assigné</span>}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button className="btn btn-outline btn-sm" onClick={() => {
                          const encFromJurys = s.jurys?.find(j => j.role === 'encadreur')?.id;
                          const encId = s.encadreur_id || encFromJurys || "";
                          setAssignModal(s);
                          setAssignForm({ encadreur_id: encId, president_id: "", membre3_id: "" });
                        }}>
                          <Users size={12} /> Jury
                        </button>
                        {s.statut === "terminee" && (
                          <button className="btn btn-sm" style={{ background: "#10b981", color: "white" }} onClick={() => handleSendResult(s.id)}>
                            <Send size={12} /> Email
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {assignModal && (
  <div className="modal-overlay">
    <div className="modal">
      <h3>👥 Affecter le jury</h3>
      <p className="sub">Soutenance de {assignModal.etudiant_nom} — {assignModal.sujet}</p>
      
      {/* Encadreur (figé — extrait de la soumission) */}
      <div className="form-group">
        <label className="form-label">Encadreur</label>
        <input
          className="form-control"
          value={(() => {
            const e = assignModal.jurys?.find(j => j.role === 'encadreur')
            return e ? e.nom : (assignModal.encadreur || '— Aucun encadreur')
          })()}
          readOnly
          disabled
        />
      </div>

      {/* Président */}
      <div className="form-group">
        <label className="form-label">Président</label>
        <select 
          className="form-control" 
          value={assignForm.president_id} 
          onChange={e => setAssignForm({...assignForm, president_id: e.target.value})}
        >
          <option value="">— Choisir —</option>
          {getFilteredJurys('president').map(j => (
            <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>
          ))}
        </select>
      </div>

      {/* 3ème Membre */}
      <div className="form-group">
        <label className="form-label">3ème Membre</label>
        <select 
          className="form-control" 
          value={assignForm.membre3_id} 
          onChange={e => setAssignForm({...assignForm, membre3_id: e.target.value})}
        >
          <option value="">— Choisir —</option>
          {getFilteredJurys('membre3').map(j => (
            <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>
          ))}
        </select>
      </div>

      <div className="modal-actions">
        <button className="btn btn-outline" onClick={() => setAssignModal(null)}>Annuler</button>
        <button className="btn btn-primary" onClick={handleAssign}>Confirmer</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
