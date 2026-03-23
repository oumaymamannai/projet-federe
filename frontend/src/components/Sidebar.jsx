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
  const [reclamationsCount, setReclamationsCount] = useState(0);

  // Fonction pour charger les soumissions en attente (admin)
  const loadPendingCount = () => {
    if (user?.role === 'admin') {
      api.get('/admin/soumissions')
        .then(res => {
          const enAttente = res.data.filter(s => s.statut !== "traite");
          setPendingCount(enAttente.length);
        })
        .catch(err => console.error('Erreur chargement soumissions:', err));
    }
  };

  // Fonction pour charger les réclamations non lues (étudiant)
  const loadReclamationsCount = async () => {
    if (user?.role === 'etudiant') {
      try {
        const res = await api.get('/etudiant/reclamations');
        const reclamations = res.data;
        
        // Récupérer la date de dernière visite
        const lastVisit = localStorage.getItem('lastReclamationsVisit');
        
        // Compter les réclamations traitées qui sont postérieures à la dernière visite
        const newResponses = reclamations.filter(r => {
          if (r.statut !== 'traitee') return false;
          if (!lastVisit) return true;
          const responseDate = new Date(r.reponse_at || r.updated_at || r.created_at);
          return responseDate > new Date(lastVisit);
        });
        
        setReclamationsCount(newResponses.length);
      } catch (error) {
        console.error('Erreur chargement réclamations:', error);
      }
    }
  };

  // Marquer les réclamations comme lues quand on clique
  const handleReclamationsClick = () => {
    if (reclamationsCount > 0) {
      localStorage.setItem('lastReclamationsVisit', new Date().toISOString());
      setReclamationsCount(0);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadPendingCount();
      const interval = setInterval(loadPendingCount, 30000);
      window.addEventListener('submissionUpdated', loadPendingCount);
      return () => {
        clearInterval(interval);
        window.removeEventListener('submissionUpdated', loadPendingCount);
      };
    }
    
    if (user?.role === 'etudiant') {
      loadReclamationsCount();
      const interval = setInterval(loadReclamationsCount, 30000);
      return () => clearInterval(interval);
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
            onClick={item.label === 'Réclamations' && user?.role === 'etudiant' ? handleReclamationsClick : undefined}
            className={"nav-item " + (location.pathname === item.to ? "active" : "")}
            style={{ position: 'relative' }}
          >
            {item.icon}
            {item.label}
            {/* Badge pour les soumissions (admin) */}
            {item.to === '/admin/submissions' && pendingCount > 0 && (
              <span className="badge-notification">{pendingCount}</span>
            )}
            {/* Badge pour les réclamations (étudiant) */}
            {item.label === 'Réclamations' && user?.role === 'etudiant' && reclamationsCount > 0 && (
              <span className="badge-notification">{reclamationsCount}</span>
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