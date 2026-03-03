import { useState, useEffect } from "react";
import api from "../../services/api";
import { FileText, CheckCircle } from "lucide-react";

export default function AdminSubmissions() {
  const [soumissions, setSoumissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const loadSoumissions = async () => {
    try {
      const response = await api.get("/admin/soumissions");
      setSoumissions(response.data);
    } catch (err) {
      setError("Erreur lors du chargement des soumissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSoumissions();
  }, []);

  const validerSoumission = async (id) => {
    try {
      await api.post(`/admin/soumissions/${id}/valider`);
      await loadSoumissions();
      setMsg("✅ Soumission validée et sujet ajouté à la soutenance");
      
      // Émettre un événement pour mettre à jour le badge dans la sidebar
      window.dispatchEvent(new Event('submissionUpdated'));
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la validation");
    }
  };

  // Calculer le nombre de soumissions en attente
  const pendingCount = soumissions.filter(s => s.statut !== "traite").length;

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h1>📋 Soumissions des étudiants</h1>
            {pendingCount > 0 && (
              <span style={{
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '999px',
                padding: '4px 12px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {pendingCount} en attente
              </span>
            )}
          </div>
          <p>Gérer les demandes de stage et sujets proposés</p>
        </div>
      </div>
      <div className="page-content">
        {msg && <div className="alert alert-success">✅ {msg}</div>}
        {error && <div className="alert alert-danger">⚠️ {error}</div>}

        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>
            📋 Liste des soumissions
          </h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Sujet</th>
                  <th>Société</th>
                  <th>Encadreur</th>
                  <th>Statut</th>
                  <th>Fichiers</th>
                </tr>
              </thead>
              <tbody>
                {soumissions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.etudiant_nom}</strong>
                    </td>
                    <td>{s.sujet}</td>
                    <td>{s.societe}</td>
                    <td>{s.encadreur}</td>
                    <td>
                      {s.statut === "traite" ? (
                        <span className="badge badge-success">✅ Validé</span>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                          }}
                        >
                          <span className="badge badge-warning">
                            ⏳ En attente
                          </span>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => validerSoumission(s.id)}
                            title="Valider cette soumission et ajouter le sujet à la soutenance"
                          >
                            <CheckCircle size={14} /> Valider
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      {s.fichiers ? (
                        (() => {
                          try {
                            const files =
                              typeof s.fichiers === "string"
                                ? JSON.parse(s.fichiers)
                                : s.fichiers;

                            return (
                              <div
                                style={{
                                  display: "flex",
                                  gap: 4,
                                  flexWrap: "wrap",
                                }}
                              >
                                {files.map((f, idx) => (
                                  <a
                                    key={idx}
                                    href={`http://localhost:5000/uploads/${f}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-outline btn-xs"
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 2,
                                    }}
                                  >
                                    <FileText size={10} /> {idx + 1}
                                  </a>
                                ))}
                              </div>
                            );
                          } catch {
                            return <span className="badge badge-gray">Erreur</span>;
                          }
                        })()
                      ) : (
                        <span className="badge badge-gray">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {soumissions.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        color: "#9ca3af",
                        padding: 24,
                      }}
                    >
                      Aucune soumission
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}