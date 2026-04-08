import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

const roles = [
  {
    key: "etudiant",
    icon: "🎓",
    bg: "#7c3aed",
    label: "Étudiant",
    desc: "Consultez vos documents, soumettez votre dossier de stage et gérez vos réclamations.",
  },
  {
    key: "jury",
    icon: "⚖️",
    bg: "#f59e0b",
    label: "Jury",
    desc: "Consultez les soutenances assignées, saisissez les notes et remarques.",
  },
  {
    key: "admin",
    icon: "🛡️",
    bg: "#7c3aed",
    label: "Responsable",
    desc: "Affectez les jurys, envoyez les résultats et répondez aux réclamations.",
  },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleLogin = async e => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await login(email.trim(), password, selectedRole);
      navigate(
        user.role === "admin" ? "/admin"
        : user.role === "jury" ? "/jury/dashboard"
        : "/student"
      );
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK" || err.message?.includes("Network")
          ? "Impossible de joindre le serveur. Vérifiez que le backend tourne sur le port 5000."
          : "Email ou mot de passe incorrect.");
      setError(msg);
    } finally { setLoading(false); }
  };

  const goBack = () => { setSelectedRole(null); setError(""); setEmail(""); setPassword(""); };

  return (
    <div className="login-page">
      {/* Brand */}
      <div className="login-brand">
        <div className="brand-icon">🎓</div>
        <h1>GradFlow</h1>
        <p>Plateforme centralisée de gestion<br />des soutenances de fin d'études</p>
      </div>

      {/* Step 1 : Choix du rôle */}
      {!selectedRole ? (
        <div className="role-cards">
          {roles.map(r => (
            <button
              key={r.key}
              className="role-card"
              onClick={() => setSelectedRole(r.key)}
              style={{ border: 'none', textAlign: 'center' }}
            >
              <div className="role-icon" style={{ background: r.bg + '1a' }}>
                <span style={{ fontSize: 28 }}>{r.icon}</span>
              </div>
              <h3>{r.label}</h3>
              <p>{r.desc}</p>
              <span className="role-link">Se connecter →</span>
            </button>
          ))}
        </div>
      ) : (
        /* Step 2 : Formulaire */
        <div className="login-form-wrap fade-in">
          {/* Retour */}
          <button
            onClick={goBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: 'var(--purple-500)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 18,
              padding: 0,
              fontFamily: 'inherit',
            }}
          >
            <ArrowLeft size={15} />
            Retour
          </button>

          {/* Titre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 24 }}>
              {roles.find(r => r.key === selectedRole)?.icon}
            </span>
            <h2 style={{ margin: 0 }}>
              Connexion {roles.find(r => r.key === selectedRole)?.label}
            </h2>
          </div>
          <p>Entrez vos identifiants pour accéder à votre espace</p>

          {/* Erreur */}
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} noValidate>
            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                className="form-control"
                type="email"
                placeholder="votre@email.dz"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
              />
            </div>

            {/* Mot de passe */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  className="form-control"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 15, height: 15,
                      border: '2px solid rgba(255,255,255,.4)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin .7s linear infinite',
                    }}
                  />
                  Connexion…
                </>
              ) : 'Se connecter'}
            </button>
          </form>
        </div>
      )}

      <p style={{
        color: 'rgba(255,255,255,.3)',
        fontSize: 11,
        marginTop: 36,
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
      }}>
        © 2026 GradFlow — Département Informatique
      </p>
    </div>
  );
}