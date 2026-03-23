import { useState, useEffect } from "react";
import api from "../../services/api";
import { Download, Eye, FileText } from "lucide-react";

export default function StudentDocuments() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/etudiant/documents")
      .then(r => setDocs(r.data))
      .finally(() => setLoading(false));
  }, []);

  // Fonction pour vérifier si c'est un PDF
  const isPdf = (fichier_path) => {
    return fichier_path && fichier_path.toLowerCase().endsWith('.pdf');
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>📁 Documents</h1>
          <p>Documents et templates disponibles</p>
        </div>
      </div>
      <div className="page-content">
        {docs.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 48 }}>
            <FileText size={48} color="#ddd6fe" style={{ margin: "0 auto 16px", display: "block" }} />
            <p style={{ color: "#9ca3af" }}>Aucun document disponible pour le moment</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {docs.map(doc => (
              <div 
                key={doc.id} 
                className="card" 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  padding: 20,
                  flexWrap: "wrap",
                  gap: 16
                }}
              >
                {/* Info document */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    background: "#ede9fe", 
                    borderRadius: 12, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    flexShrink: 0 
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

                {/* Boutons */}
                <div style={{ display: "flex", gap: "8px" }}>
                  {/* Bouton Voir - UNIQUEMENT pour les PDF */}
                  {doc.fichier_path && isPdf(doc.fichier_path) && (
                    <a
                      href={`/uploads/${doc.fichier_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <Eye size={14} /> Voir
                    </a>
                  )}

                  {/* Bouton Télécharger - pour tous les types */}
                  {doc.fichier_path && (
                    <a
                      href={`/uploads/${doc.fichier_path}`}
                      download
                      className="btn btn-outline btn-sm"
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
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