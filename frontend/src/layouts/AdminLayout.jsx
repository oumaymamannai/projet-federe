import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const navItems = [
  { to: '/admin', label: 'Tableau de bord', icon: 'dashboard', end: true },
  { to: '/admin/soutenances', label: 'Soutenances', icon: 'soutenances' },
  { to: '/admin/periode', label: 'Période & Dates', icon: 'periode' },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: 'utilisateurs' },
  { to: '/admin/formulaires', label: 'Formulaires Stage', icon: 'formulaires' },
  { to: '/admin/documents', label: 'Documents', icon: 'documents' },
  { to: '/admin/reclamations', label: 'Réclamations', icon: 'reclamations' },
]

const titles = {
  '/admin': 'Tableau de bord',
  '/admin/soutenances': 'Soutenances',
  '/admin/periode': 'Période & Dates',
  '/admin/utilisateurs': 'Utilisateurs',
  '/admin/formulaires': 'Formulaires Stage',
  '/admin/documents': 'Documents',
  '/admin/reclamations': 'Réclamations',
}

export default function AdminLayout() {
  const { pathname } = useLocation()

  return (
    <div className="app-layout">
      <Sidebar navItems={navItems} title="Administration" />
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
