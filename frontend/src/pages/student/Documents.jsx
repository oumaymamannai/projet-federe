import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Download, Eye, FileText, FolderOpen } from "lucide-react";

export default function StudentDocuments() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("tous");

  useEffect(() => {
    api.get("/etudiant/documents")
      .then(r => setDocs(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleConsultDocument = () => {
    if (user?.id) {
      localStorage.setItem(`documents_consulted_${user.id}`, 'true');
    }
  };

  const isPdf = (fichier_path) =>
    fichier_path && fichier_path.toLowerCase().endsWith('.pdf');

  const counts = {
    tous:     docs.length,
    general:  docs.filter(d => d.type?.toLowerCase() === "general").length,
    template: docs.filter(d => d.type?.toLowerCase() === "template").length,
    stage:    docs.filter(d => d.type?.toLowerCase() === "stage").length,
  };

  const filteredDocs = activeFilter === "tous"
    ? docs
    : docs.filter(d => d.type?.toLowerCase() === activeFilter);

  const filters = [
    { key: "tous",     label: "Tous" },
    { key: "general",  label: "Général" },
    { key: "template", label: "Templates" },
    { key: "stage",    label: "Stage" },
  ];

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <span className="icon-squircle page-title-icon" aria-hidden>
              <FolderOpen size={22} />
            </span>
            Documents
          </h1>
          <p>Documents et templates disponibles</p>
        </div>
      </div>

      <div className="page-content">

        {/* ── Filtres cliquables avec compteurs ── */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 16px",
                borderRadius: 20,
                border: activeFilter === key ? "none" : "1px solid #e5e7eb",
                background: activeFilter === key ? "#7c3aed" : "white",
                color: activeFilter === key ? "white" : "#374151",
                fontWeight: activeFilter === key ? 600 : 500,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {label}
              <span
                style={{
                  background: activeFilter === key ? "rgba(255,255,255,0.25)" : "#f3f4f6",
                  color: activeFilter === key ? "white" : "#6b7280",
                  borderRadius: 10,
                  padding: "1px 7px",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Liste des documents filtrés ── */}
        {filteredDocs.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 48 }}>
            <FileText size={48} color="#ddd6fe" style={{ margin: "0 auto 16px", display: "block" }} />
            <p style={{ color: "#9ca3af" }}>Aucun document disponible pour le moment</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                className="card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 20,
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 48, height: 48, background: "#ede9fe", borderRadius: 12,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <FileText size={24} color="#7c3aed" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{doc.titre}</div>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>{doc.description}</div>
                    <div style={{ marginTop: 6 }}>
                      <span className={"badge " + (doc.type === "template" ? "badge-purple" : "badge-gray")}>
                        {doc.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  {doc.fichier_path && isPdf(doc.fichier_path) && (
                    
                      <a href={`/uploads/${doc.fichier_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                      onClick={handleConsultDocument}
                    >
                      <Eye size={14} /> Voir
                    </a>
                  )}
                  {doc.fichier_path && (
                    
                      <a href={`/uploads/${doc.fichier_path}`}
                      download
                      className="btn btn-outline btn-sm"
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                      onClick={handleConsultDocument}
                    >
                      <Download size={14} /> Télécharger
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}