import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { 
  GraduationCap, Calendar, Clock, MapPin, Users, CheckCircle, 
  AlertCircle, FileText, Star, Hourglass, BookOpen, FileCheck, MessageSquare 
} from "lucide-react";

function getCountdownStatus(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const soutenanceDate = new Date(dateStr);
  soutenanceDate.setHours(0, 0, 0, 0);
  
  const diff = soutenanceDate - today;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return { status: "today", label: "Aujourd'hui", days: 0 };
  if (days < 0) return { status: "done", label: "Terminé", days: days };
  return { status: "pending", label: `-${days} jour${days > 1 ? "s" : ""}`, days: days };
}

function statusBadge(s) {
  const pastel = "rgba(167,139,250,0.3)";
  const row = { display: "inline-flex", alignItems: "center", gap: 6, background: pastel, color: "white", fontSize: 13, padding: "6px 12px", borderRadius: 20, fontWeight: 600 };
  if (s === "planifiee") return <span style={row}><Calendar size={14} strokeWidth={2.5} /> Planifiée</span>;
  if (s === "terminee") return <span style={row}><CheckCircle size={14} strokeWidth={2.5} /> Terminée</span>;
  return <span style={row}><Hourglass size={14} strokeWidth={2.5} /> En attente</span>;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [soutenance, setSoutenance] = useState(null);
  const [docs, setDocs] = useState([]);
  const [soumissions, setSoumissions] = useState([]);
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documentsConsulted, setDocumentsConsulted] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/etudiant/soutenance").catch(() => ({ data: null })),
      api.get("/etudiant/documents").catch(() => ({ data: [] })),
      api.get("/etudiant/stage/soumissions").catch(() => ({ data: [] })),
      api.get("/etudiant/reclamations").catch(() => ({ data: [] }))  // Ajout des réclamations
    ])
      .then(([s, d, soum, recl]) => { 
        setSoutenance(s.data); 
        setDocs(d.data);
        setSoumissions(soum.data);
        setReclamations(recl.data);
      })
      .finally(() => setLoading(false));
    
    // Vérifier si l'étudiant a consulté des documents
    if (user?.id) {
      const consulted = localStorage.getItem(`documents_consulted_${user.id}`);
      setDocumentsConsulted(consulted === 'true');
    }
  }, [user?.id]);

  const countdown = soutenance?.date_soutenance ? getCountdownStatus(soutenance.date_soutenance) : null;
  const hasSubmitted = soumissions.length > 0;
  const hasReclamation = reclamations.length > 0; // ✅ Vérifier si au moins une réclamation existe

  const steps = [
    { 
      numero: 1,
      titre: "Consulter les documents",
      description: "Lisez les documents importants et les directives",
      icone: BookOpen,
      lien: "/student/documents",
      fait: documentsConsulted
    },
    { 
      numero: 2,
      titre: "Soumettre le formulaire",
      description: "Remplissez et soumettez votre formulaire de stage",
      icone: FileCheck,
      lien: "/student/stage",
      fait: hasSubmitted
    },
    { 
      numero: 3,
      titre: "Faire une réclamation",
      description: "En cas de problème ou d'absence d'encadreur",
      icone: MessageSquare,
      lien: "/student/reclamations",
      fait: hasReclamation  // ✅ Maintenant basé sur les réclamations existantes
    }
  ];

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bonjour, {user?.prenom} !</h1>
          <p>Vue d'ensemble de votre soutenance de fin d'études</p>
        </div>
      </div>
      <div className="page-content">
        
        {/* Carte Soutenance */}
        {!soutenance ? (
          <div className="alert alert-warning" style={{ marginBottom: 24 }}>
            <AlertCircle size={18} />
            Aucune soutenance planifiée pour vous. Contactez l'administration.
          </div>
        ) : (
          <div className="soutenance-card" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <GraduationCap size={32} color="white" />
                  <div>
                    <div className="soutenance-title">Statut : Soutenance {soutenance.statut === "planifiee" ? "programmée" : soutenance.statut === "terminee" ? "terminée" : "en attente"}</div>
                    {statusBadge(soutenance.statut)}
                  </div>
                </div>
              </div>
              {countdown !== null && countdown.status === "pending" && (
                <div className="countdown">
                  <div>
                    <div className="countdown-number">{countdown.label}</div>
                    <div className="countdown-label">restants</div>
                  </div>
                </div>
              )}
              {countdown !== null && countdown.status === "today" && (
                <div className="countdown">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div>
                      <div className="countdown-number">{countdown.label}</div>
                      <div className="countdown-label">jour J</div>
                    </div>
                  </div>
                </div>
              )}
              {countdown !== null && countdown.status === "done" && (
                <div className="countdown" style={{ minWidth: 140, textAlign: "center" }}>
                  {soutenance.note_finale !== null && soutenance.note_finale !== undefined ? (
                    <div>
                      <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 4 }}>Résultat</div>
                      <div className="countdown-number" style={{ fontSize: 36 }}>
                        {soutenance.note_finale}<span style={{ fontSize: 18 }}>/20</span>
                      </div>
                      <div className="countdown-label" style={{ marginTop: 4, color: soutenance.note_finale >= 10 ? "#86efac" : "#fca5a5" }}>
                        {soutenance.note_finale >= 10 ? "✅ Admis(e)" : "❌ Non admis(e)"}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <CheckCircle size={40} />
                      <div className="countdown-label" style={{ marginTop: 4 }}>Terminé</div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>En attente de note</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Date de soutenance prévue</div>
              <div style={{ display: "flex", gap: 48, alignItems: "center", flexWrap: "wrap" }}>
                {soutenance.date_soutenance && (
                  <div className="meta-item">
                    <Calendar size={24} color="white" />
                    <strong style={{ fontSize: 22 }}>{new Date(soutenance.date_soutenance).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</strong>
                  </div>
                )}
                {soutenance.date_soutenance && (
                  <div className="meta-item">
                    <Clock size={24} color="white" />
                    <strong style={{ fontSize: 22 }}>{new Date(soutenance.date_soutenance).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</strong>
                  </div>
                )}
                {soutenance.salle && (
                  <div className="meta-item">
                    <MapPin size={24} color="white" />
                    <strong style={{ fontSize: 22 }}>{soutenance.salle}</strong>
                  </div>
                )}
              </div>
            </div>

            {soutenance.note_finale !== null && soutenance.note_finale !== undefined && (
              <div style={{ marginBottom: 24 }}>
                <div className="meta-item">
                  <CheckCircle size={20} color="#10b981" />
                  <strong>Note finale : {soutenance.note_finale}/20</strong>
                </div>
              </div>
            )}

            {soutenance.jurys?.length > 0 && (
              <>
                <div style={{ height: 1, background: "rgba(255,255,255,0.2)", margin: "24px 0" }} />
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, color: "white" }}>
                    <Users size={16} /> Jury assigné ({soutenance.jurys.length} {soutenance.jurys.length > 1 ? "membres" : "membre"})
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {soutenance.jurys.map((j, i) => (
                      <div key={i} style={{ background: "rgba(167,139,250,0.3)", color: "white", padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                        {j.nom} — {j.role.replace("3eme_membre", "3ème Membre").replace("encadreur", "Encadreur").replace("president", "Président")}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Cartes statistiques */}
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          <div className="stat-card">
            <div className="stat-icon icon-squircle"><FileText size={22} /></div>
            <div className="stat-value" style={{ color: "#7c3aed" }}>{docs.length}</div>
            <div className="stat-label">Documents disponibles</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon icon-squircle"><Calendar size={22} /></div>
            <div className="stat-value" style={{ color: soutenance?.statut === "terminee" ? "#10b981" : soutenance?.statut === "planifiee" ? "#7c3aed" : "#9ca3af" }}>
              {soutenance?.statut === "terminee" ? "✓" : soutenance?.statut === "planifiee" ? "Oui" : "—"}
            </div>
            <div className="stat-label">{soutenance?.statut === "terminee" ? "Soutenance terminée" : soutenance?.statut === "planifiee" ? "Soutenance planifiée" : "Soutenance en attente"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon icon-squircle"><Star size={22} /></div>
            <div className="stat-value" style={{ color: soutenance?.note_finale != null ? (soutenance.note_finale >= 10 ? "#10b981" : "#ef4444") : "#9ca3af" }}>
              {soutenance?.note_finale != null ? `${soutenance.note_finale}/20` : "—"}
            </div>
            <div className="stat-label">{soutenance?.note_finale != null ? (soutenance.note_finale >= 10 ? "Admis(e)" : "Non admis(e)") : "Note en attente"}</div>
          </div>
        </div>

        {/* Prochaines étapes */}
        <div>
          <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 600, color: "#374151" }}>
            📍 Prochaines étapes
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {steps.map((step) => {
              const Icon = step.icone;
              const estFait = step.fait;
              
              return (
                <Link 
                  key={step.numero} 
                  to={step.lien}
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 20px",
                    background: estFait ? "#f9fafb" : "white",
                    border: `1px solid ${estFait ? "#e5e7eb" : "#e5e7eb"}`,
                    borderRadius: 12,
                    transition: "all 0.2s",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    if (!estFait) {
                      e.currentTarget.style.borderColor = "#7c3aed";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.boxShadow = "none";
                  }}>
                    
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: estFait ? "#10b981" : "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                      fontSize: 16,
                      color: estFait ? "white" : "#6b7280"
                    }}>
                      {estFait ? "✓" : step.numero}
                    </div>
                    
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: estFait ? "#ecfdf5" : "#f5f3ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: estFait ? "#10b981" : "#7c3aed"
                    }}>
                      <Icon size={22} />
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 600,
                        fontSize: 15,
                        color: estFait ? "#6b7280" : "#1f2937",
                        marginBottom: 4
                      }}>
                        {step.titre}
                        {estFait && (
                          <span style={{ 
                            marginLeft: 8, 
                            fontSize: 12, 
                            color: "#10b981",
                            fontWeight: 500
                          }}>
                            ✓ Terminé
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 13,
                        color: "#9ca3af"
                      }}>
                        {step.description}
                      </div>
                    </div>
                    
                    {!estFait && (
                      <div style={{ color: "#d1d5db" }}>
                        →
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}