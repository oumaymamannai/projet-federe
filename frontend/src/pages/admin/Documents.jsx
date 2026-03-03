import { useState, useEffect } from "react";
import api from "../../services/api";
import { Upload, Eye, EyeOff } from "lucide-react";

export default function AdminDocuments() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ titre: "", description: "", type: "general", publie: false });
  const [fichier, setFichier] = useState(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const loadDocuments = () => {
    api.get("/admin/documents")
      .then((response) => {
        setDocs(response.data);
      })
      .catch((err) => {
        setError("Erreur lors du chargement des documents");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    if (!fichier) return setError("Sélectionnez un fichier");

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("fichier", fichier);
      
      await api.post("/admin/documents", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setMsg("Document uploadé !");
      setForm({ titre: "", description: "", type: "general", publie: false });
      setFichier(null);
      loadDocuments();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'upload");
    }
  };

  const togglePublie = async (id) => {
    try {
      await api.patch("/admin/documents/" + id + "/toggle");
      loadDocuments();
    } catch (err) {
      setError("Erreur lors de la modification");
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>📁 Documents</h1>
          <p>Gérer les documents et templates disponibles</p>
        </div>
      </div>
      <div className="page-content">
        {msg && <div className="alert alert-success">✅ {msg}</div>}
        {error && <div className="alert alert-danger">⚠️ {error}</div>}

        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>
            📤 Uploader un document
          </h3>
          <form onSubmit={handleUpload}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div className="form-group">
                <label className="form-label">Titre</label>
                <input
                  className="form-control"
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="form-control"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="general">Général</option>
                  <option value="template">Template</option>
                  <option value="stage">Stage</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fichier</label>
              <input
                type="file"
                className="form-control"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFichier(e.target.files[0])}
                required
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <input
                type="checkbox"
                id="publie"
                checked={form.publie}
                onChange={(e) =>
                  setForm({ ...form, publie: e.target.checked })
                }
              />
              <label htmlFor="publie" style={{ fontSize: 14, fontWeight: 600 }}>
                Publier immédiatement (visible aux étudiants)
              </label>
            </div>
            <button type="submit" className="btn btn-primary">
              <Upload size={16} /> Uploader
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>
            📚 Documents uploadés
          </h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Type</th>
                  <th>Uploadé par</th>
                  <th>Publié</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.titre}</strong>
                      <br />
                      <small style={{ color: "#9ca3af" }}>{d.description}</small>
                    </td>
                    <td>
                      <span className="badge badge-gray">{d.type}</span>
                    </td>
                    <td>{d.uploaded_by_nom || "—"}</td>
                    <td>
                      {d.publie ? (
                        <span className="badge badge-success">✅ Oui</span>
                      ) : (
                        <span className="badge badge-gray">Non</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <a
                          href={"/uploads/" + d.fichier_path}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline btn-sm"
                        >
                          Voir
                        </a>
                        <button
                          className="btn btn-sm"
                          style={{
                            background: d.publie ? "#fee2e2" : "#d1fae5",
                            color: d.publie ? "#991b1b" : "#065f46",
                          }}
                          onClick={() => togglePublie(d.id)}
                        >
                          {d.publie ? (
                            <>
                              <EyeOff size={12} /> Masquer
                            </>
                          ) : (
                            <>
                              <Eye size={12} /> Publier
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {docs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        color: "#9ca3af",
                        padding: 24,
                      }}
                    >
                      Aucun document
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