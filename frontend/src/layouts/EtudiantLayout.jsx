import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const navItems = [
  { to: '/etudiant', label: 'Ma Soutenance', icon: 'home', end: true },
  { to: '/etudiant/formulaire', label: 'Formulaire de Stage', icon: 'formulaire' },
  { to: '/etudiant/documents', label: 'Documents', icon: 'documents' },
  { to: '/etudiant/reclamation', label: 'Réclamations', icon: 'reclamations' },
  { to: '/etudiant/resultats', label: 'Mes Résultats', icon: 'resultats' },
]

const titles = {
  '/etudiant': 'Ma Soutenance',
  '/etudiant/formulaire': 'Formulaire de Stage',
  '/etudiant/documents': 'Documents',
  '/etudiant/reclamation': 'Réclamations',
  '/etudiant/resultats': 'Mes Résultats',
}

export default function EtudiantLayout() {
  const { pathname } = useLocation()
  return (
    <div className="app-layout">
      <Sidebar navItems={navItems} title="Espace Étudiant" />
      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">{titles[pathname] || 'GradFlow'}</span>
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
