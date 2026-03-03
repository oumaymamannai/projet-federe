import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => setData(res.data.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-center"><div className="loading-spinner" /><span>Chargement...</span></div>

  const { stats, notesParSoutenance } = data || {}

  const chartData = {
    labels: (notesParSoutenance || []).map(n => `${n.prenom} ${n.nom}`),
    datasets: [{
      label: 'Note (/20)',
      data: (notesParSoutenance || []).map(n => parseFloat(n.moyenne || 0).toFixed(2)),
      backgroundColor: (notesParSoutenance || []).map(n =>
        n.moyenne >= 16 ? 'rgba(5, 150, 105, 0.8)' :
        n.moyenne >= 14 ? 'rgba(59, 130, 246, 0.8)' :
        n.moyenne >= 10 ? 'rgba(123, 31, 162, 0.8)' :
        'rgba(220, 38, 38, 0.8)'
      ),
      borderRadius: 8,
      borderSkipped: false,
    }]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` Note: ${ctx.parsed.y}/20`
        }
      }
    },
    scales: {
      y: { beginAtZero: true, max: 20, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } }
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble de la plateforme GradFlow</p>
      </div>

      <div className="stat-grid">
        {[
          { label: 'En attente', value: stats?.en_attente || 0, icon: '⏳', color: 'amber' },
          { label: 'Planifiées', value: stats?.planifiees || 0, icon: '📅', color: 'indigo' },
          { label: 'Terminées', value: stats?.terminees || 0, icon: '✅', color: 'emerald' },
          { label: 'Total Étudiants', value: stats?.total_etudiants || 0, icon: '🎓', color: 'violet' },
          { label: 'Taux de réussite', value: `${stats?.taux_reussite || 0}%`, icon: '📈', color: 'rose' },
          { label: 'Réclamations', value: stats?.reclamations_attente || 0, icon: '📩', color: 'rose' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {notesParSoutenance?.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span className="card-title">📊 Diagramme des Notes</span>
            <div style={{ display: 'flex', gap: 12 }}>
              {[['#059669', 'Très Bien (≥16)'], ['#3b82f6', 'Bien (≥14)'], ['#7b1fa2', 'Passable (≥10)'], ['#dc2626', 'Ajourné (<10)']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: c, display: 'inline-block' }} />
                  {l}
                </div>
              ))}
            </div>
          </div>
          <div className="card-body">
            <Bar data={chartData} options={chartOptions} height={80} />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 Répartition des soutenances</span>
          </div>
          <div className="card-body">
            {[
              { label: 'En attente', val: stats?.en_attente || 0, total: (stats?.en_attente || 0) + (stats?.planifiees || 0) + (stats?.terminees || 0), color: '#d97706' },
              { label: 'Planifiées', val: stats?.planifiees || 0, total: (stats?.en_attente || 0) + (stats?.planifiees || 0) + (stats?.terminees || 0), color: '#2563eb' },
              { label: 'Terminées', val: stats?.terminees || 0, total: (stats?.en_attente || 0) + (stats?.planifiees || 0) + (stats?.terminees || 0), color: '#059669' },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>
                  <span>{item.label}</span>
                  <span style={{ color: 'var(--violet-dark)' }}>{item.val}</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${item.total ? (item.val / item.total) * 100 : 0}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">🔢 Statistiques rapides</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Jurys', val: stats?.total_jurys || 0, icon: '⚖️' },
                { label: 'Documents', val: stats?.total_documents || 0, icon: '📄' },
                { label: 'Réussite', val: `${stats?.taux_reussite || 0}%`, icon: '🏆' },
                { label: 'Total', val: (stats?.en_attente || 0) + (stats?.planifiees || 0) + (stats?.terminees || 0), icon: '📊' },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--lavender-50)', borderRadius: 'var(--radius-md)', padding: 16, textAlign: 'center', border: '1px solid var(--lavender-200)' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--violet-deep)', fontFamily: 'var(--font-display)' }}>{item.val}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
