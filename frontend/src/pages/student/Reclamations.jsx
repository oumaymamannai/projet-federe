import { useState, useEffect } from "react";
import api from "../../services/api";
import { Send, MessageCircle } from "lucide-react";

export default function StudentReclamations() {
  const [form, setForm] = useState({ type: "probleme_date", message: "" });
  const [reclamations, setReclamations] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

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
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      await api.post("/etudiant/reclamation", form);
      setMsg("Réclamation soumise avec succès !");
      setForm({ type: "probleme_date", message: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur");
    }
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
            <button type="submit" className="btn btn-primary">
              <Send size={16} /> Soumettre
            </button>
          </form>
        </div>
        
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