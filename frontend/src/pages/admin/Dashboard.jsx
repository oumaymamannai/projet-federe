import { useState, useEffect } from "react";
import api from "../../services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState({ date_debut: "", date_fin: "" });
  const [periodMsg, setPeriodMsg] = useState("");
  const [autoMsg, setAutoMsg] = useState("");
  const [visibleSegments, setVisibleSegments] = useState(0);

  useEffect(() => {
    api.get("/admin/dashboard").then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleSegments(prev => prev < 3 ? prev + 1 : prev);
    }, 300);
    return () => clearInterval(timer);
  }, []);

  const handlePeriod = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/periode", period);
      setPeriodMsg("Période définie !");
    } catch {}
  };

  const handleAutoAffect = async () => {
    try {
      const r = await api.post("/admin/affecter-dates");
      setAutoMsg(r.data.message);
      const d = await api.get("/admin/dashboard");
      setData(d.data);
    } catch (err) { setAutoMsg(err.response?.data?.message || "Erreur"); }
  };

  if (loading) return <div className="spinner" />;

  const stats = [
    { icon: "🎓", value: data.total, label: "Total soutenances", color: "#7c3aed" },
    { icon: "📅", value: data.planifiees, label: "Planifiées", color: "#7c3aed" },
    { icon: "⏳", value: data.en_attente, label: "En attente", color: "#f59e0b" },
    { icon: "✅", value: data.terminees, label: "Terminées", color: "#10b981" },
    { icon: "📈", value: data.taux + "%", label: "Taux de réussite", color: "#10b981" },
    { icon: "🔔", value: data.reclamations, label: "Réclamations", color: "#ef4444" },
  ];

  const notesData = [
    { note: "<10", valeur: 0, couleur: "#CCCCCC" },
    { note: "10-12", valeur: 4, couleur: "#4CAF50" },
    { note: "12-14", valeur: 3, couleur: "#FFC107" },
    { note: "14-16", valeur: 2, couleur: "#FF5722" },
    { note: ">16", valeur: 1, couleur: "#F44336" }
  ];

  const pieData = [
    { name: 'Terminées', value: 25, color: '#4CAF50' },
    { name: 'Planifiées', value: 50, color: '#2196F3' },
    { name: 'En attente', value: 25, color: '#FFC107' },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1>📊 Tableau de bord</h1><p>Vue d'ensemble de la plateforme GradFlow</p></div>
        <button className="btn btn-primary" onClick={handleAutoAffect}>
          🗓️ Affecter les dates automatiquement
        </button>
      </div>
      <div className="page-content">
        {autoMsg && <div className="alert alert-success">✅ {autoMsg}</div>}
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          💡 Utilisez le bouton <strong>"Affecter les dates automatiquement"</strong> pour générer des dates de soutenance aléatoires pour tous les étudiants sans date planifiée.
        </div>
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {stats.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📈 Avancement global</h3>
            {[
              { label: "Soutenances terminées", value: data.total ? Math.round(data.terminees/data.total*100) : 0, color: "#10b981" },
              { label: "Taux de réussite", value: data.taux || 0, color: "#7c3aed" },
              { label: "Documents publiés", value: 15, color: "#f59e0b" },
            ].map((p, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
                  <strong>{p.label}</strong>
                  <span style={{ color: p.color, fontWeight: 700 }}>{p.value}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: p.value + "%", background: p.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📋 Résumé rapide</h3>
            {[
              ["Total soutenances", data.total, "#7c3aed"],
              ["Planifiées", data.planifiees, "#7c3aed"],
              ["Terminées", data.terminees, "#10b981"],
              ["Moy. générale", data.moy ? data.moy + "/20" : "—", "#374151"],
              ["Réclamations", data.reclamations, "#ef4444"],
              ["Documents publiés", data.docs, "#f59e0b"],
            ].map(([l, v, c], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 5 ? "1px solid #f3f4f6" : "none", fontSize: 14 }}>
                <span style={{ color: "#6b7280" }}>{l}</span>
                <strong style={{ color: c }}>{v}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <div className="card" style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Répartition des Notes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={notesData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="note" type="category" />
                <YAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                <Tooltip formatter={(value) => [`Étudiants : ${value}`, '']} />
                <Bar dataKey="valeur" barSize={15} animationDuration={1500}>
                  {notesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.couleur} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Statut des Soutenances</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData.slice(0, visibleSegments)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-in-out"
                >
                  {pieData.slice(0, visibleSegments).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📆 Définir la période de soutenances</h3>
          {periodMsg && <div className="alert alert-success">✅ {periodMsg}</div>}
          <form onSubmit={handlePeriod} style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label">Date début</label>
              <input type="date" className="form-control" value={period.date_debut} onChange={e => setPeriod({...period, date_debut: e.target.value})} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label">Date fin</label>
              <input type="date" className="form-control" value={period.date_fin} onChange={e => setPeriod({...period, date_fin: e.target.value})} required />
            </div>
            <button type="submit" className="btn btn-primary">Définir</button>
          </form>
        </div>
      </div>
    </div>
  );
}
