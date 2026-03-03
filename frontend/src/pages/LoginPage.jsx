import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";

const roles = [
  { key: "etudiant", icon: "🎓", bg: "#7c3aed", label: "Étudiant", desc: "Consulter les documents, soumettre votre formulaire de stage et gérer vos réclamations." },
  { key: "jury", icon: "⚖️", bg: "#f59e0b", label: "Jury", desc: "Consulter les soutenances assignées et saisir les notes et remarques." },
  { key: "admin", icon: "👨‍💼", bg: "#7c3aed", label: "Responsable", desc: "Affecter les jurys, envoyer les résultats et répondre aux réclamations." },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "admin" ? "/admin" : user.role === "jury" ? "/jury" : "/student");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de connexion");
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="brand-icon">🎓</div>
        <h1>GradFlow</h1>
        <p>Plateforme centralisée de gestion des soutenances<br />de fin d'études</p>
      </div>

      {!selectedRole ? (
        <div className="role-cards">
          {roles.map(r => (
            <div key={r.key} className="role-card" onClick={() => setSelectedRole(r.key)}>
              <div className="role-icon" style={{ background: r.bg + "20" }}>
                <span style={{ fontSize: 30 }}>{r.icon}</span>
              </div>
              <h3>{r.label}</h3>
              <p>{r.desc}</p>
              <span className="role-link">Se connecter →</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="login-form-wrap">
          <button onClick={() => { setSelectedRole(null); setError(""); }}
            style={{ background: "none", border: "none", color: "#7c3aed", cursor: "pointer", fontSize: 14, marginBottom: 16, fontWeight: 600 }}>
            ← Retour
          </button>
          <h2>Connexion {roles.find(r => r.key === selectedRole)?.label}</h2>
          <p>Entrez vos identifiants pour accéder à votre espace</p>
          {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>⚠️ {error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" placeholder="votre@email.dz"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div style={{ position: "relative" }}>
                <input className="form-control" type={showPass ? "text" : "password"} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      )}
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 40, position: "relative", zIndex: 1 }}>
        © 2026 GradFlow — Département Informatique
      </p>
    </div>
  );
}
