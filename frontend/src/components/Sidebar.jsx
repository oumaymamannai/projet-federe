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
          const enAttente = res.data.filter(r => r.statut === 'en_attente' && !r.reponse);
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
        
        // Récupérer les réponses déjà vues
        const reponsesVues = JSON.parse(localStorage.getItem('reponsesVues') || '{}');
        
        let newCount = 0;
        
        reclamations.forEach(r => {
          // Si réclamation traitée avec réponse
          if (r.statut === 'traitee' && r.reponse) {
            const reponseId = `${r.id}_${r.reponse_at || r.updated_at}`;
            // Si cette réponse n'a pas encore été vue
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
        // Récupérer toutes les réclamations pour marquer les réponses comme vues
        const res = await api.get('/etudiant/reclamations');
        const reclamations = res.data;
        
        // Récupérer les réponses déjà vues
        const reponsesVues = JSON.parse(localStorage.getItem('reponsesVues') || '{}');
        
        // Marquer toutes les réponses comme vues
        reclamations.forEach(r => {
          if (r.statut === 'traitee' && r.reponse) {
            const reponseId = `${r.id}_${r.reponse_at || r.updated_at}`;
            reponsesVues[reponseId] = true;
          }
        });
        
        // Sauvegarder dans localStorage
        localStorage.setItem('reponsesVues', JSON.stringify(reponsesVues));
        
        // Effacer le badge
        setReclamationsCount(0);
        
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  }, [reclamationsCount]);

  const handleAdminReclamationsClick = useCallback(() => {
    if (reclamationsAdminCount > 0) {
      setReclamationsAdminCount(0);
    }
  }, [reclamationsAdminCount]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadPendingCount();
      loadReclamationsAdminCount();
      const interval = setInterval(() => {
        loadPendingCount();
        loadReclamationsAdminCount();
      }, 30000);
      const handleSubmissionUpdate = () => loadPendingCount();
      window.addEventListener('submissionUpdated', handleSubmissionUpdate);
      return () => {
        clearInterval(interval);
        window.removeEventListener('submissionUpdated', handleSubmissionUpdate);
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