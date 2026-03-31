import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Bell, 
  FileText, 
  LogOut, 
  ClipboardList,
  CheckCircle,
  BarChart3
} from 'lucide-react';

const studentNav = [
  { to: '/student', icon: <LayoutDashboard size={18} />, label: 'Tableau de bord' },
  { to: '/student/stage', icon: <FileText size={18} />, label: 'Depot dossier' },
  { to: '/student/documents', icon: <ClipboardList size={18} />, label: 'Documents' },
  { to: '/student/reclamations', icon: <Bell size={18} />, label: 'Réclamations' },
];

const juryNav = [
  { to: '/jury/dashboard', icon: <LayoutDashboard size={18} />, label: 'JuryDashboard' },  // ← NOUVEAU
  { to: '/jury', icon: <Calendar size={18} />, label: 'Planning' },
  { to: '/jury/evaluations', icon: <BarChart3 size={18} />, label: 'Évaluations' },   // ← NOUVEAU
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
  const [reclamationsAdminCount, setReclamationsAdminCount] = useState(0);
  const [reclamationsCount, setReclamationsCount] = useState(0);

  const loadPendingCount = useCallback(() => {
    if (user?.role === 'admin') {
      api.get('/admin/soumissions')
        .then(res => {
          const enAttente = res.data.filter(s => s.statut !== "traite" && s.statut !== "valide");
          setPendingCount(enAttente.length);
        })
        .catch(err => console.error('Erreur chargement soumissions:', err));
    }
  }, [user]);

  const loadReclamationsAdminCount = useCallback(() => {
    if (user?.role === 'admin') {
      api.get('/admin/reclamations')
        .then(res => {
          const enAttente = res.data.filter(r => r.statut === 'en_attente');
          setReclamationsAdminCount(enAttente.length);
        })
        .catch(err => console.error('Erreur chargement réclamations admin:', err));
    }
  }, [user]);

  const loadReclamationsCount = useCallback(async () => {
    if (user?.role === 'etudiant') {
      try {
        const res = await api.get('/etudiant/reclamations');
        const reclamations = res.data;
        
        const reponsesVues = JSON.parse(localStorage.getItem('reponsesVues') || '{}');
        
        let newCount = 0;
        
        reclamations.forEach(r => {
          if (r.statut === 'traitee' && r.reponse) {
            const reponseId = `${r.id}_${r.reponse_at || r.updated_at}`;
            if (!reponsesVues[reponseId]) {
              newCount++;
            }
          }
        });
        
        setReclamationsCount(newCount);
        
      } catch (error) {
        console.error('Erreur chargement réclamations étudiant:', error);
      }
    }
  }, [user]);

  const handleReclamationsClick = useCallback(async () => {
    if (reclamationsCount > 0) {
      try {
        const res = await api.get('/etudiant/reclamations');
        const reclamations = res.data;
        
        const reponsesVues = JSON.parse(localStorage.getItem('reponsesVues') || '{}');
        
        reclamations.forEach(r => {
          if (r.statut === 'traitee' && r.reponse) {
            const reponseId = `${r.id}_${r.reponse_at || r.updated_at}`;
            reponsesVues[reponseId] = true;
          }
        });
        
        localStorage.setItem('reponsesVues', JSON.stringify(reponsesVues));
        setReclamationsCount(0);
        
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  }, [reclamationsCount]);

  const handleAdminReclamationsClick = useCallback(() => {
    // Ne pas mettre à 0 immédiatement, laisser le chargement se faire
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadPendingCount();
      loadReclamationsAdminCount();
      
      const interval = setInterval(() => {
        loadPendingCount();
        loadReclamationsAdminCount();
      }, 30000);
      
      const handleSubmissionUpdate = () => loadPendingCount();
      const handleReclamationsUpdate = () => loadReclamationsAdminCount();
      
      window.addEventListener('submissionUpdated', handleSubmissionUpdate);
      window.addEventListener('reclamations-admin-updated', handleReclamationsUpdate);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('submissionUpdated', handleSubmissionUpdate);
        window.removeEventListener('reclamations-admin-updated', handleReclamationsUpdate);
      };
    }
    
    if (user?.role === 'etudiant') {
      loadReclamationsCount();
      const interval = setInterval(loadReclamationsCount, 30000);
      
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          loadReclamationsCount();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [user, loadPendingCount, loadReclamationsAdminCount, loadReclamationsCount]);

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
            onClick={() => {
              if (item.label === 'Réclamations') {
                if (user?.role === 'etudiant') {
                  handleReclamationsClick();
                }
                if (user?.role === 'admin') {
                  handleAdminReclamationsClick();
                }
              }
            }}
            className={`nav-item ${location.pathname === item.to ? 'active' : ''}`}
            style={{ position: 'relative' }}
          >
            {item.icon}
            {item.label}
            {item.to === '/admin/submissions' && pendingCount > 0 && (
              <span className="badge-notification">{pendingCount > 99 ? '99+' : pendingCount}</span>
            )}
            {item.to === '/admin/reclamations' && user?.role === 'admin' && reclamationsAdminCount > 0 && (
              <span className="badge-notification">{reclamationsAdminCount > 99 ? '99+' : reclamationsAdminCount}</span>
            )}
            {item.label === 'Réclamations' && user?.role === 'etudiant' && reclamationsCount > 0 && (
              <span className="badge-notification">{reclamationsCount > 99 ? '99+' : reclamationsCount}</span>
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