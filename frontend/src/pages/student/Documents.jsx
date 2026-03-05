import { useState, useEffect } from "react";
import api from "../../services/api";
import { Download, FileText } from "lucide-react";

export default function StudentDocuments() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/etudiant/documents").then(r => setDocs(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div><h1>📁 Documents</h1><p>Documents et templates disponibles</p></div>
      </div>
      <div className="page-content">
        {docs.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 48 }}>
            <FileText size={48} color="#ddd6fe" style={{ margin: "0 auto 16px", display: "block" }} />
            <p style={{ color: "#9ca3af" }}>Aucun document disponible pour le moment</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {docs.map(d => (
              <div key={d.id} className="card" style={{ display: "flex", alignItems: "center", gap: 16, padding: 20 }}>
                <div style={{ width: 48, height: 48, background: "#ede9fe", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={24} color="#7c3aed" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.titre}</div>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>{d.description}</div>
                  <div style={{ marginTop: 6 }}>
                    <span className={"badge " + (d.type === "template" ? "badge-purple" : "badge-gray")}>{d.type}</span>
                  </div>
                </div>
                <a href={"/api/documents/" + d.id + "/download?token=" + localStorage.getItem('gradflow_token')} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                  <Download size={14} /> Télécharger
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
