import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
// Définition des éléments de navigation du menu latéral
const navItems = [
  { to: '/jury', label: 'Mes Soutenances', icon: 'soutenances', end: true },
]
// Mapping des chemins vers les titres affichés dans l'en-tête
export default function JuryLayout() {
  const { pathname } = useLocation()
  const isEval = pathname.includes('/evaluation/')
  return (
    <div className="app-layout">
      <Sidebar navItems={navItems} title="Espace Jury" />
      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">{isEval ? 'Évaluation' : 'Mes Soutenances'}</span>
          <div className="topbar-right">
            <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>
              {new Date().toLocaleDateString('fr-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="page-container page-enter">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
