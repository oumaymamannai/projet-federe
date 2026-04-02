import { useState, useEffect } from "react";
import api from "../../services/api";
import { Send, Users, Search ,CalendarDays } from "lucide-react";

export default function AdminSoutenances() {
  const [soutenances, setSoutenances] = useState([]);
  const [jurys, setJurys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(null);
  const [assignForm, setAssignForm] = useState({ encadreur_id: "", president_id: "", membre3_id: "" });
  const [msg, setMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [successModal, setSuccessModal] = useState(null);

  const load = () => Promise.all([api.get("/admin/soutenances"), api.get("/admin/jury/members")])
    .then(([s, j]) => {
      setSoutenances(s.data);
      setJurys(j.data);
    })
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const filteredSoutenances = soutenances.filter(s =>
    s.etudiant_nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.etudiant_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async () => {
    const president_id = assignForm.president_id ? String(assignForm.president_id) : "";
    const membre3_id = assignForm.membre3_id ? String(assignForm.membre3_id) : "";

    const selected = [president_id, membre3_id].filter(Boolean);
    if (selected.length === 0) {
      setMsg("❌ Sélectionnez au moins un rôle de jury (président ou 3ème membre). La gestion de l'encadreur se fait depuis les réclamations.");
      return;
    }
    if (new Set(selected).size !== selected.length) {
      setMsg("❌ Un même membre ne peut pas avoir plusieurs rôles.");
      return;
    }

    try {
      const payload = {};
      if (president_id) payload.president_id = president_id;
      if (membre3_id) payload.membre3_id = membre3_id;

      await api.post(`/admin/jury/${assignModal.id}`, payload);
      setMsg("✅ Jury affecté avec succès !");
      setAssignModal(null);
      load();
    } catch (err) {
      console.error("Erreur lors de l'affectation:", err.response?.data);
      setMsg(err.response?.data?.message || "Erreur lors de l'affectation du jury");
    }
  };

  const getFilteredJurys = (role) => {
    const selectedValues = {
      encadreur: parseInt(assignForm.encadreur_id) || null,
      president: parseInt(assignForm.president_id) || null,
      membre3: parseInt(assignForm.membre3_id) || null
    };
    const encadreurId = parseInt(assignForm.encadreur_id) || (assignModal?.encadreur_id ? parseInt(assignModal.encadreur_id) : null);

    const currentId = selectedValues[role === 'president' ? 'president' : 'membre3'];
    const currentMember = currentId ? jurys.find(j => j.id === currentId) : null;

    return jurys.filter(j => {
      if (j.id === 1) return false;
      if (encadreurId && j.id === encadreurId) return false;

      if (role === 'encadreur') {
        return j.id !== selectedValues.president && j.id !== selectedValues.membre3;
      }
      if (role === 'president') {
        if (currentMember && j.id === currentMember.id) return true;
        return j.id !== encadreurId && j.id !== selectedValues.membre3;
      }
      if (role === 'membre3') {
        if (currentMember && j.id === currentMember.id) return true;
        return j.id !== encadreurId && j.id !== selectedValues.president;
      }
      return true;
    });
  };

  const handleSendResult = async (id) => {
    const soutenance = soutenances.find(s => s.id === id);

    if (!soutenance?.jurys || soutenance.jurys.length < 3) {
      setMsg("❌ Le jury doit être complet (3 membres) avant d'envoyer les résultats.");
      return;
    }

    const manquants = soutenance.jurys.filter(j =>
      !j.remarques || String(j.remarques).trim() === ""
    );

    if (manquants.length > 0) {
      const noms = manquants.map(j => `${j.nom} (${j.role})`).join(", ");
      setMsg(`❌ Remarques manquantes pour : ${noms}`);
      return;
    }

    try {
      await api.post("/admin/resultat/" + id + "/envoyer");
      setSuccessModal({ nom: soutenance.etudiant_nom });
    } catch (err) {
      setMsg("❌ Erreur lors de l'envoi de l'email");
    }
  };

  const hasStageDossier = (s) =>
    s.has_stage_dossier === true || s.has_stage_dossier === 1 || s.has_stage_dossier === "1";

  const canAssignJury = (s) => {
    if (s.statut === "terminee") return false;
    if (s.statut === "en_attente") return false;
    if (s.statut === "planifiee") return hasStageDossier(s);
    return false;
  };

  const juryButtonTitle = (s) => {
    if (s.statut === "terminee") return "Soutenance terminée — jury non modifiable.";
    if (s.statut === "en_attente") return "Planifiez la soutenance (date et statut) avant d'affecter le jury.";
    if (s.statut === "planifiee" && !hasStageDossier(s))
      return "L'étudiant doit d'abord déposer un dossier de stage.";
    return "Affecter ou modifier le jury";
  };

  const statusBadge = (s) => {
    if (s === "planifiee") return <span className="badge badge-purple">📅 Planifiée</span>;
    if (s === "terminee") return <span className="badge badge-success">✅ Terminée</span>;
    return <span className="badge badge-warning">⏳ En attente</span>;
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      {/* ── Modale succès email ── */}
      {successModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,5,32,.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, backdropFilter: "blur(2px)",
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, width: 420, maxWidth: "95vw",
            boxShadow: "0 24px 80px rgba(124,58,237,.18)",
            overflow: "hidden",
          }}>
            {/* Header violet */}
            <div style={{
              background: "linear-gradient(135deg, #4c3db5, #6b5ce7)",
              padding: "20px 24px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>🎓</div>
                <div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>
                    {successModal.nom}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                    Résultats de soutenance
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSuccessModal(null)}
                style={{
                  background: "rgba(255,255,255,0.15)", border: "none",
                  borderRadius: "50%", width: 30, height: 30,
                  cursor: "pointer", color: "white", fontSize: 18,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >×</button>
            </div>

            {/* Corps */}
            <div style={{ padding: "36px 24px", textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "#d1fae5", border: "4px solid #a7f3d0",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", fontSize: 28, color: "#065f46",
              }}>✓</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1033", marginBottom: 8 }}>
                Email envoyé !
              </div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>
                Les résultats ont été transmis à <strong>{successModal.nom}</strong>.
              </div>
            </div>

            {/* Bouton */}
            <div style={{ padding: "0 24px 24px" }}>
              <button
                onClick={() => setSuccessModal(null)}
                style={{
                  width: "100%", padding: "11px 0",
                  background: "linear-gradient(135deg, #4c3db5, #7c3aed)",
                  color: "white", border: "none", borderRadius: 10,
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>
            <span className="icon-squircle page-title-icon" aria-hidden>
              <CalendarDays size={22} />
            </span>{" "}
            Soutenances
          </h1>
          <p>Gestion des soutenances et affectation des jurys</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Rechercher un étudiant..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ paddingLeft: 36, width: 280 }}
            />
          </div>
        </div>
      </div>

      <div className="page-content">
        {msg && <div className="alert alert-success">{msg}</div>}
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Sujet</th>
                  <th>Date</th>
                  <th>Salle</th>
                  <th>Statut</th>
                  <th>Note</th>
                  <th>Jury</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSoutenances.map(s => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.etudiant_nom}</strong>
                      <br /><small style={{ color: "#9ca3af" }}>{s.etudiant_email}</small>
                    </td>
                    <td style={{ maxWidth: 180 }}>{s.sujet || "—"}</td>
                    <td>
                      {s.date_soutenance ? new Date(s.date_soutenance).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      }) : "—"}
                    </td>
                    <td>{s.salle || "—"}</td>
                    <td>{statusBadge(s.statut)}</td>
                    <td><strong>{s.note_finale != null ? s.note_finale + "/20" : "—"}</strong></td>
                    <td>
                      {s.jurys?.length > 0 ? s.jurys.map((j, i) => (
                        <div key={i} style={{ fontSize: 12 }}>
                          {j.nom} <span style={{ color: "#9ca3af" }}>({j.role})</span>
                        </div>
                      )) : <span style={{ color: "#9ca3af" }}>Non assigné</span>}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          disabled={!canAssignJury(s)}
                          title={juryButtonTitle(s)}
                          style={!canAssignJury(s) ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                          onClick={() => {
                            if (!canAssignJury(s)) return;
                            const encFromJurys = s.jurys?.find(j => j.role === 'encadreur')?.id;
                            const encId = s.encadreur_id || encFromJurys || "";
                            const presidentId = s.jurys?.find(j => j.role === 'president')?.id || "";
                            const membre3Id = s.jurys?.find(j => j.role === '3eme_membre')?.id || "";
                            setAssignModal(s);
                            setAssignForm({
                              encadreur_id: encId,
                              president_id: presidentId,
                              membre3_id: membre3Id
                            });
                          }}>
                          <Users size={12} /> Jury
                        </button>

                        {s.statut === "terminee" && (() => {
                          const pret = s.jurys?.length >= 3 &&
                            s.jurys.every(j => j.remarques && String(j.remarques).trim() !== "");
                          return (
                            <button
                              className="btn btn-sm"
                              style={{
                                background: pret ? "#10b981" : "#d1d5db",
                                color: pret ? "white" : "#9ca3af",
                                cursor: pret ? "pointer" : "not-allowed",
                                opacity: pret ? 1 : 0.6,
                              }}
                              disabled={!pret}
                              title={pret
                                ? "Envoyer les résultats par email"
                                : "Les remarques des 3 membres du jury sont requises"}
                              onClick={() => handleSendResult(s.id)}
                            >
                              <Send size={12} /> Email
                            </button>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSoutenances.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                      {searchQuery ? `Aucun résultat pour "${searchQuery}"` : "Aucune soutenance trouvée"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {assignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>👥 Affecter le jury</h3>
            <p className="sub">Soutenance de {assignModal.etudiant_nom} — {assignModal.sujet || "Sujet non défini"}</p>

            <div className="form-group">
              <label className="form-label">Encadreur</label>
              {(() => {
                const fixedEncadreur = assignModal.jurys?.find(j => j.role === 'encadreur');
                if (fixedEncadreur) {
                  return <input className="form-control" value={fixedEncadreur.nom} readOnly disabled />;
                }
                if (assignModal.encadreur) {
                  return <input className="form-control" value={assignModal.encadreur} readOnly disabled />;
                }
                return <input className="form-control" value="Aucun encadreur assigné" readOnly disabled />;
              })()}
            </div>

            <div className="form-group">
              <label className="form-label">Président</label>
              <select
                className="form-control"
                value={assignForm.president_id}
                onChange={e => setAssignForm({ ...assignForm, president_id: e.target.value })}
              >
                <option value="">— Choisir —</option>
                {getFilteredJurys('president').map(j => (
                  <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">3ème Membre</label>
              <select
                className="form-control"
                value={assignForm.membre3_id}
                onChange={e => setAssignForm({ ...assignForm, membre3_id: e.target.value })}
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