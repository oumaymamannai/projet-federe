import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import PlanificationWizard from './PlanificationWizard'
import { 
  Calendar, Clock, CheckCircle, Clock3,
  TrendingUp, AlertCircle, FileText, Award, Trophy, Medal, Star, Users
} from 'lucide-react'
// Enregistrement des composants Chart.js nécessaires au rendu du graphique en barres
// (obligatoire avec Chart.js v3+ qui est "tree-shakable" : on n'importe que ce qu'on utilise)
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Génère les initiales d'un nom complet (ex: "Jean Dupont" → "JD")
// Fallback sur les 2 premiers caractères si le nom est sur un seul mot
function initiales(nom) {
  if (!nom) return '?'
  const parts = nom.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : nom.slice(0, 2).toUpperCase()
}

// ── Couleurs avatar déterministes ────────────────────────────────────────────
const AVATAR_COLORS = ['#46215c', '#643981', '#8860b2', '#b690d6', '#46215c', '#643981']
function avatarColor(id) { return AVATAR_COLORS[id % AVATAR_COLORS.length] }

// Mapping des rôles jury vers leurs libellés courts et couleurs d'affichage
const ROLE_LABELS = {
  encadreur: { label: 'Enc.', color: '#ad77dd', bg: '#f5edfe' },
  president: { label: 'Prés.', color: '#864ab7', bg: '#f2e6ff' },
  membre:    { label: 'Mbr.', color: '#c5a9ec', bg: '#f7f2fe' },
}

// Convertit une note numérique en mention textuelle
// Retourne '—' si la note est absente (soutenance non encore notée)
function getMention(note) {
  if (note == null) return '—'
  if (note >= 16) return 'Très bien'
  if (note >= 14) return 'Bien'
  if (note >= 12) return 'Assez bien'
  if (note >= 10) return 'Passable'
  return 'Insuffisant'
}

// ── Top performer card ───────────────────────────────────────────────────────
//rank    {number}  — indice 0/1/2 → détermine l'icône et la couleur
function TopCard({ rank, student }) {
  const icons    = [Trophy, Medal, Star]
  const colors   = ['#F59E0B', '#a494b8', '#C084FC']
  const bgColors = ['#FEF3C7', '#F1F5F9', '#FAF5FF']
  const Icon     = icons[rank]
  // État vide : le rang existe mais aucun étudiant n'a de note
  if (!student) return (
    <div className="top-card top-card--empty">
      <div className="top-rank-icon" style={{ color: colors[rank], background: bgColors[rank] }}><Icon size={18} /></div>
      <div className="top-info"><div className="top-name muted">Aucun résultat</div><div className="top-mention">—</div></div>
      <div className="top-note muted">—</div>
    </div>
  )

  return (
    <div className="top-card">
      <div className="top-rank-icon" style={{ color: colors[rank], background: bgColors[rank] }}><Icon size={18} /></div>
      <div className="top-info">
        <div className="top-name">{student.etudiant}</div>
        <div className="top-mention">{getMention(student.note_finale)}</div>
      </div>
      {/* note_finale est une chaîne SQL, parseFloat assure le formatage correct */}
      <div className="top-note" style={{ color: colors[rank] }}>{parseFloat(student.note_finale).toFixed(1)}/20</div>
    </div>
  )
}
// ============================================================
// SOUS-COMPOSANT : JuryPanel
// Affiche la liste des membres du jury avec leur charge de travail
// sous forme de barres de progression segmentées par rôle.
// Props :
//   juryStats {Array} — tableau d'objets { id, nom, encadreur, president, membre, total }
// ============================================================
function JuryPanel({ juryStats }) {
  // État vide : aucun jury affecté pour l'instant
  if (!juryStats || juryStats.length === 0) return (
    <div className="jury-empty">
      <Users size={32} style={{ opacity: 0.25 }} />
      <p>Aucun jury assigné pour le moment.</p>
    </div>
  )
  // Valeur max utilisée pour normaliser la largeur des barres (évite division par 0)
  const max = Math.max(...juryStats.map(j => j.total), 1)

  return (
    <div className="jury-list">
      {juryStats.map((jury) => (
        <div key={jury.id} className="jury-row">
          {/* Avatar circulaire avec initiales et couleur déterministe */}
          <div className="jury-avatar" style={{ background: avatarColor(jury.id) }}>
            {initiales(jury.nom)}
          </div>
          {/* Nom + badges de rôles — un badge n'est rendu que si le compte > 0 */}
          <div className="jury-info">
            <div className="jury-name">{jury.nom}</div>
            <div className="jury-roles">
              {jury.encadreur > 0 && (
                <span className="role-badge" style={{ color: ROLE_LABELS.encadreur.color, background: ROLE_LABELS.encadreur.bg }}>
                  {jury.encadreur} {ROLE_LABELS.encadreur.label}
                </span>
              )}
              {jury.president > 0 && (
                <span className="role-badge" style={{ color: ROLE_LABELS.president.color, background: ROLE_LABELS.president.bg }}>
                  {jury.president} {ROLE_LABELS.president.label}
                </span>
              )}
              {jury.membre > 0 && (
                <span className="role-badge" style={{ color: ROLE_LABELS.membre.color, background: ROLE_LABELS.membre.bg }}>
                  {jury.membre} {ROLE_LABELS.membre.label}
                </span>
              )}
            </div>
          </div>
          {/* Barre de progression segmentée : chaque segment représente un rôle,
              sa largeur est proportionnelle à son nombre par rapport au maximum global */}
          <div className="jury-bar-wrap">
            <div className="jury-bar">
              {jury.encadreur > 0 && (
                <div className="jury-bar-seg" style={{ width: `${(jury.encadreur / max) * 100}%`, background: ROLE_LABELS.encadreur.color }} />
              )}
              {jury.president > 0 && (
                <div className="jury-bar-seg" style={{ width: `${(jury.president / max) * 100}%`, background: ROLE_LABELS.president.color }} />
              )}
              {jury.membre > 0 && (
                <div className="jury-bar-seg" style={{ width: `${(jury.membre / max) * 100}%`, background: ROLE_LABELS.membre.color }} />
              )}
            </div>
          </div>
          {/* Total des interventions toutes missions confondues */}
          <div className="jury-total">{jury.total}</div>
        </div>
      ))}
    </div>
  )
}
// COMPOSANT PRINCIPAL : AdminDashboard
// Page d'accueil de l'espace administrateur.
// Récupère les données agrégées depuis l'API et les présente en :
//   - 4 cartes principales (totaux soutenances)
//   - Graphique de distribution des notes (Chart.js)
//   - Panneau de charge du jury (JuryPanel)
//   - 4 statistiques secondaires (taux, moyenne, réclamations, docs)
//   - Podium Top 3 étudiants (TopCard)
export default function AdminDashboard() {
  const [data, setData] = useState(null)// Données renvoyées par GET /api/admin/dashboard
  const [loading, setLoading] = useState(true) // Affiche le spinner pendant le fetch initial
  // Fonction extraite pour pouvoir être rappelée après une action
  // (ex: PlanificationWizard rappelle onDone une fois la planification terminée)
  const fetchData = () =>
    adminAPI.getDashboard()
      .then(res => setData(res.data))
      .finally(() => setLoading(false))

  useEffect(() => { fetchData() }, [])
  // Spinner centré affiché tant que la requête n'est pas résolue
  if (loading) return (
    <div className="loading-center">
      <div className="loading-spinner" />
      <span>Chargement du tableau de bord...</span>
    </div>
  )
  // Total des soutenances = somme des trois statuts possibles
  const total = (data?.en_attente || 0) + (data?.planifiees || 0) + (data?.terminees || 0)
  // Objet contenant les compteurs par tranche de note (peut être vide si aucune note)
  const notesRepartition = data?.notesRepartition || {}
  // Top 3 : on filtre les étudiants sans note, trie par note décroissante, prend les 3 premiers
  const top3 = [...(data?.notes || [])]
    .filter(n => n.note_finale != null)
    .sort((a, b) => b.note_finale - a.note_finale)
    .slice(0, 3)
  // Intervalles de notes avec leur couleur pour le graphique et la légende
  const intervals = [
    { label: '< 10',  count: notesRepartition.moins_10     || 0, color: '#d6b3f4' },
    { label: '10-12', count: notesRepartition.entre_10_12  || 0, color: '#b690d6' },
    { label: '12-14', count: notesRepartition.entre_12_14  || 0, color: '#8860b2' },
    { label: '14-16', count: notesRepartition.entre_14_16  || 0, color: '#643981' },
    { label: '≥ 16',  count: notesRepartition.plus_16      || 0, color: '#46215c' },
  ]
  // Dataset Chart.js — une barre par tranche, couleur issue du tableau intervals
  const chartData = {
    labels: intervals.map(i => i.label),
    datasets: [{
      label: "Nombre d'étudiants",
      data: intervals.map(i => i.count),
      backgroundColor: intervals.map(i => i.color),
      borderRadius: 8, barPercentage: 0.65, categoryPercentage: 0.8,
    }]
  }
  // Options Chart.js : légende masquée (gérée manuellement), tooltips stylisés,
  // axes avec titres et grille minimaliste
  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },// Légende personnalisée dans le card-header
      tooltip: {
        backgroundColor: '#1f2937', titleColor: '#f3f4f6', bodyColor: '#d1d5db',
        padding: 10, cornerRadius: 8,
        callbacks: { label: ctx => `Étudiants : ${ctx.parsed.y}`, title: ctx => `Note : ${ctx.label}` }
      }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#e5e7eb', drawBorder: false },
           title: { display: true, text: "Nombre d'étudiants", color: '#6b7280', font: { size: 12 } },
           ticks: { stepSize: 1, precision: 0 } },// Entiers uniquement (pas de "2.5 étudiants")
      x: { grid: { display: false },
           title: { display: true, text: 'Tranches de notes', color: '#6b7280', font: { size: 12 } },
           ticks: { font: { size: 12 } } }
    }
  }

  // Cartes principales
  const mainCards = [
    { label: 'Soutenances totales', value: total, icon: Calendar, color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Terminées', value: data?.terminees || 0, icon: CheckCircle, color: '#10b981', bg: '#d1fae5' },
    { label: 'Planifiées', value: data?.planifiees || 0, icon: Clock, color: '#f59e0b', bg: '#fef3c7' },
    { label: 'En attente', value: data?.en_attente || 0, icon: Clock3, color: '#ef4444', bg: '#fee2e2' },
  ]

  // Statistiques secondaires
  const secondaryStats = [
    { label: 'Taux de réussite', value: `${data?.taux || 0}%`, icon: TrendingUp, color: '#10b981', bg: '#d1fae5', description: 'des étudiants admis' },
    { label: 'Moyenne générale', value: data?.moy ? `${parseFloat(data.moy).toFixed(1)}/20` : '—', icon: Award, color: '#7c3aed', bg: '#ede9fe', description: 'sur 20 points' },
    { label: 'Réclamations', value: data?.reclamations || 0, icon: AlertCircle, color: '#ef4444', bg: '#fee2e2', description: 'en attente' },
    { label: 'Documents', value: data?.docs || 0, icon: FileText, color: '#7c3aed', bg: '#ede9fe', description: 'publiés' },
  ]

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>
            Tableau de bord
          </h1>
          <p className="dashboard-subtitle">Vue d'ensemble des soutenances et statistiques</p>
        </div>
        {/* onDone = fetchData : rafraîchit le dashboard après une planification réussie */}
        <PlanificationWizard onDone={fetchData} />
      </div>
      {/* Cartes principales */}
      <div className="cards-grid">
        {mainCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className="stat-card-main" style={{ borderLeftColor: card.color }}>
              <div className="stat-card-header">
                <div className="stat-icon-wrapper" style={{ background: card.bg, color: card.color }}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          )
        })}
      </div>
      {/* graphique des notes + charge du jury */}
      <div className="two-columns">
        <div className="card">
          <div className="card-header">
            <div className="card-title-wrapper">
              <Award size={18} className="card-icon" />
              <span className="card-title">Distribution des notes</span>
            </div>
            <div className="legend-group">
              {intervals.map(l => (
                <div key={l.label} className="legend-item">
                  <span className="legend-dot" style={{ background: l.color }} />
                  <span className="legend-label">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card-body chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
        {/* Panneau de charge des membres du jury */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-wrapper">
              <Users size={18} className="card-icon" />
              <span className="card-title">Charge des membres du jury</span>
            </div>
            {/* Légende des rôles en en-tête de carte */}
            <div className="jury-legend-header">
              {Object.entries(ROLE_LABELS).map(([key, r]) => (
                <span key={key} className="role-badge" style={{ color: r.color, background: r.bg }}>{r.label}</span>
              ))}
            </div>
          </div>
          <div className="card-body">
            <JuryPanel juryStats={data?.juryStats} />
          </div>
        </div>
      </div>
      {/* Statistiques secondaires : taux, moyenne, réclamations, documents */}
      <div className="secondary-cards">
        {secondaryStats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="stat-card-secondary">
              <div className="stat-icon-secondary" style={{ background: stat.bg, color: stat.color }}>
                <Icon size={18} />
              </div>
              <div className="stat-content">
                <div className="stat-value-secondary">{stat.value}</div>
                <div className="stat-label-secondary">{stat.label}</div>
                <div className="stat-description">{stat.description}</div>
              </div>
            </div>
          )
        })}
      </div>
      {/* Podium des 3 meilleurs étudiants */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-wrapper">
            <Trophy size={18} className="card-icon" />
            <span className="card-title">Meilleures performances</span>
          </div>
          <span className="card-badge">Top 3 étudiants</span>
        </div>
        <div className="card-body">
          {top3.length === 0 ? (
            //Aucune note enregistrée pour l'instant
            <div className="top-empty">
              <Trophy size={32} style={{ opacity: 0.25 }} />
              <p>Aucun résultat disponible pour le moment.</p>
            </div>
          ) : (
            // On itère toujours sur [0,1,2] pour afficher les 3 rangs,
            // même si top3 contient moins de 3 entrées (TopCard gère le cas null)
            <div className="top-list">
              {[0, 1, 2].map(rank => (
                <TopCard key={rank} rank={rank} student={top3[rank] || null} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .admin-dashboard { max-width: 1400px; margin: 0 auto; padding: 24px 0 32px; }
        .dashboard-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
        .dashboard-title { font-size: 22px; font-weight: 500; color: var(--color-text-primary); margin: 0; }
        .dashboard-subtitle { font-size: 13px; color: var(--color-text-secondary); margin: 4px 0 0; }

        .cards-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
        .stat-card-main { background: var(--color-background-primary); border-radius: 12px; padding: 20px; border-left: 4px solid; border-top: 0.5px solid var(--color-border-tertiary); border-right: 0.5px solid var(--color-border-tertiary); border-bottom: 0.5px solid var(--color-border-tertiary); box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06); transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .stat-card-main:hover { transform: translateY(-5px) scale(1.02); box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12); }
        .stat-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .stat-icon-wrapper { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: transform 0.3s ease; }
        .stat-card-main:hover .stat-icon-wrapper { transform: scale(1.05); }
        .stat-value { font-size: 28px; font-weight: 500; color: var(--color-text-primary); margin-bottom: 5px; line-height: 1; }
        .stat-label { font-size: 12px; color: var(--color-text-secondary); }

        .two-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .card { background: var(--color-background-primary); border-radius: 12px; border: 0.5px solid var(--color-border-tertiary); overflow: hidden; }
        .secondary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
        .card-header { padding: 16px 20px; border-bottom: 0.5px solid var(--color-border-tertiary); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
        .card-title-wrapper { display: flex; align-items: center; gap: 8px; }
        .card-icon { color: #724ab7; }
        .card-title { font-weight: 500; font-size: 14px; color: var(--color-text-primary); }
        .card-badge { font-size: 11px; background: var(--color-background-secondary); padding: 3px 10px; border-radius: 99px; color: var(--color-text-secondary); }
        .card-body { padding: 20px; }
        .chart-container { height: 280px; }

        .legend-group { display: flex; gap: 10px; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 5px; }
        .legend-dot { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
        .legend-label { font-size: 11px; color: var(--color-text-secondary); }

        .jury-legend-header { display: flex; gap: 6px; }
        .role-badge { font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 99px; white-space: nowrap; }
        .jury-list { display: flex; flex-direction: column; gap: 14px; }
        .jury-row { display: flex; align-items: center; gap: 12px; }
        .jury-avatar { width: 34px; height: 34px; min-width: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 600; letter-spacing: 0.02em; }
        .jury-info { width: 130px; min-width: 130px; }
        .jury-name { font-size: 12px; font-weight: 500; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .jury-roles { display: flex; gap: 4px; margin-top: 3px; flex-wrap: wrap; }
        .jury-bar-wrap { flex: 1; }
        .jury-bar { display: flex; height: 8px; border-radius: 99px; overflow: hidden; background: var(--color-background-secondary); gap: 2px; }
        .jury-bar-seg { height: 100%; border-radius: 99px; transition: width 0.5s ease; min-width: 4px; }
        .jury-total { font-size: 13px; font-weight: 600; color: var(--color-text-primary); min-width: 24px; text-align: right; }
        .jury-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 32px 0; color: var(--color-text-secondary); font-size: 13px; }

        .stat-card-secondary { background: var(--color-background-primary); border-radius: 12px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; border: 0.5px solid var(--color-border-tertiary); transition: transform 0.2s; }
        .stat-card-secondary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .stat-icon-secondary { width: 42px; height: 42px; min-width: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .stat-content { flex: 1; min-width: 0; }
        .stat-value-secondary { font-size: 20px; font-weight: 500; color: var(--color-text-primary); line-height: 1.2; }
        .stat-label-secondary { font-size: 12px; color: var(--color-text-secondary); margin-top: 3px; }
        .stat-description { font-size: 11px; color: var(--color-text-secondary); margin-top: 2px; opacity: 0.7; }

        .top-list { display: flex; flex-direction: column; gap: 10px; }
        .top-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 10px; background: var(--color-background-secondary); }
        .top-card--empty { opacity: 0.45; }
        .top-rank-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .top-info { flex: 1; min-width: 0; }
        .top-name { font-size: 13px; font-weight: 500; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .top-name.muted { color: var(--color-text-secondary); }
        .top-mention { font-size: 11px; color: var(--color-text-secondary); margin-top: 2px; }
        .top-note { font-size: 16px; font-weight: 600; flex-shrink: 0; }
        .top-note.muted { color: var(--color-text-secondary); }
        .top-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 28px 0; color: var(--color-text-secondary); font-size: 13px; }

        @media (max-width: 1024px) {
          .cards-grid, .secondary-cards { grid-template-columns: repeat(2, 1fr); }
          .two-columns { grid-template-columns: 1fr; }
          .jury-info { width: 110px; min-width: 110px; }
        }
        @media (max-width: 640px) {
          .admin-dashboard { padding: 12px 0; }
          .cards-grid, .secondary-cards { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}