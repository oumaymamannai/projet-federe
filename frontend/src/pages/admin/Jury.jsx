import { useState, useEffect } from "react";
import api from "../../services/api";

export default function AdminJury() {
  const [jurys, setJurys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/jury").then(r => setJurys(r.data)).finally(() => setLoading(false));
  }, []);

  const fonctionBadge = (f) => {
    if (f === "president") return <span className="badge badge-purple">⚖️ Président</span>;
    if (f === "encadreur") return <span className="badge badge-success">📚 Encadreur</span>;
    return <span className="badge badge-gray">👤 3ème Membre</span>;
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header"><div><h1>👥 Membres du jury</h1><p>Liste des membres du jury disponibles pour les affectations</p></div></div>
      <div className="page-content">
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Nom & Prénom</th><th>Email</th><th>Fonction</th></tr></thead>
              <tbody>
                {jurys.map((j, i) => (
                  <tr key={j.id}>
                    <td style={{ color: "#9ca3af" }}>{i + 1}</td>
                    <td><strong>{j.prenom} {j.nom}</strong></td>
                    <td>{j.email}</td>
                    <td>{fonctionBadge(j.fonction)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
