import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Bell, 
  FileText, 
  LogOut, 
  BarChart3, 
  ClipboardList,
  CheckCircle
} from 'lucide-react';

const studentNav = [
  { to: '/student', icon: <LayoutDashboard size={18} />, label: 'Tableau de bord' },
  { to: '/student/stage', icon: <FileText size={18} />, label: 'Depot dossier' },
  { to: '/student/documents', icon: <ClipboardList size={18} />, label: 'Documents' },
  { to: '/student/reclamations', icon: <Bell size={18} />, label: 'Réclamations' },
];

const juryNav = [
  { to: '/jury', icon: <Calendar size={18} />, label: 'Planning' },
  { to: '/jury/evaluations', icon: <BarChart3 size={18} />, label: 'Évaluations' },
];

const adminNav = [
  { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/admin/soutenances', icon: <Calendar size={18} />, label: 'Soutenances' },
  { to: '/admin/jury', icon: <Users size={18} />, label: 'Jury' },
  { to: '/admin/submissions', icon: <CheckCircle size={18} />, label: 'Soumissions' },
  { to: '/admin/reclamations', icon: <Bell size={18} />, label: 'Réclamations' },
  { to: '/admin/documents', icon: <FileText size={18} />, label: 'Documents' },
];

const roleLabels = { 
  etudiant: 'ÉTUDIANT', 
  jury: 'JURY', 
  admin: 'RESPONSABLE' 
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  // Fonction pour charger UNIQUEMENT les soumissions en attente
  const loadPendingCount = () => {
    if (user?.role === 'admin') {
      // Récupérer TOUTES les soumissions et filtrer côté client
      api.get('/admin/soumissions')
        .then(res => {
          // NE COMPTER QUE celles qui ne sont PAS "traite"
          const enAttente = res.data.filter(s => s.statut !== "traite");
          
          console.log('=== DEBUG SIDEBAR ===');
          console.log('Total soumissions:', res.data.length);
          console.log('Statuts:', res.data.map(s => s.statut));
          console.log('En attente:', enAttente.length);
          console.log('====================');
          
          setPendingCount(enAttente.length);
        })
        .catch(err => console.error('Erreur chargement soumissions:', err));
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      // Chargement initial
      loadPendingCount();
      
      // Rafraîchir toutes les 30 secondes
      const interval = setInterval(loadPendingCount, 30000);
      
      // Écouter l'événement de mise à jour
      window.addEventListener('submissionUpdated', loadPendingCount);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('submissionUpdated', loadPendingCount);
      };
    }
  }, [user]);

  const nav = user?.role === 'etudiant' ? studentNav : 
              user?.role === 'jury' ? juryNav : 
              adminNav;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🎓</div>
        <h2>GradFlow</h2>
        <p>Soutenances académiques</p>
      </div>
      <div className="sidebar-role">
        <span>{user ? roleLabels[user.role] : ""}</span>
        <p>{user?.prenom} {user?.nom}</p>
        <small>{user?.email}</small>
      </div>
      <nav className="sidebar-nav">
        {nav.map(item => (
          <Link 
            key={item.to} 
            to={item.to}
            className={"nav-item " + (location.pathname === item.to ? "active" : "")}
            style={{ position: 'relative' }}
          >
            {item.icon}
            {item.label}
            {/* Le badge n'apparaît que si pendingCount > 0 */}
            {item.to === '/admin/submissions' && pendingCount > 0 && (
              <span className="badge-notification">{pendingCount}</span>
            )}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={logout}>
          <LogOut size={16} /> Déconnexion
        </button>
      </div>
    </aside>
  );
}