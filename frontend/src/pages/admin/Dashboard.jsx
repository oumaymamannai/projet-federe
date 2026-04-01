import { useState, useEffect } from "react";
import api from "../../services/api";
import PlanificationWizard from './PlanificationWizard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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


  if (loading) return <div className="spinner" />;

  const stats = [
    { icon: "🎓", value: data.total, label: "Total soutenances", color: "#7c3aed" },
    { icon: "📅", value: data.planifiees, label: "Planifiées", color: "#7c3aed" },
    { icon: "⏳", value: data.en_attente, label: "En attente", color: "#f59e0b" },
    { icon: "✅", value: data.terminees, label: "Terminées", color: "#10b981" },
    { icon: "📈", value: data.taux + "%", label: "Taux de réussite", color: "#10b981" },
    { icon: "🔔", value: data.reclamations, label: "Réclamations", color: "#ef4444" },
  ];

  const rep = data.notesRepartition || {};
  /* Dégradé violet uniquement (du plus clair au plus soutenu, lisible sur fond blanc) */
  const notesData = [
    { note: "<10", valeur: rep.moins_10 || 0, couleur: "#ddd6fe" },
    { note: "10-12", valeur: rep.entre_10_12 || 0, couleur: "#c4b5fd" },
    { note: "12-14", valeur: rep.entre_12_14 || 0, couleur: "#a78bfa" },
    { note: "14-16", valeur: rep.entre_14_16 || 0, couleur: "#8b5cf6" },
    { note: ">16", valeur: rep.plus_16 || 0, couleur: "#6d28d9" }
  ];

  const maxNote = Math.max(...notesData.map(d => d.valeur), 1);

  const pieData = [
    { name: 'Terminées', value: data.terminees || 0, color: '#10b981' },
    { name: 'Planifiées', value: data.planifiees || 0, color: '#7c3aed' },
    { name: 'En attente', value: data.en_attente || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  return (
    <div>
      <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div><h1>📊 Tableau de bord</h1><p>Vue d'ensemble de la plateforme GradFlow</p></div>
        <PlanificationWizard onDone={() => api.get("/admin/dashboard").then(r => setData(r.data)).catch(() => {})} />
      </div>
      <div className="page-content">
        <div className="alert alert-info" style={{ marginBottom: 24 }}>
          💡 Appuyez sur "Planification de dates", définir la période de soutenances, puis affecter automatiquement les dates.
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
              { label: "Documents publiés", value: data.docs > 0 ? Math.min(Math.round(data.docs / 5 * 100), 100) : 0, color: "#f59e0b" },
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
                <YAxis type="number" domain={[0, maxNote + 1]} allowDecimals={false} />
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
      </div>
    </div>
  );
}
