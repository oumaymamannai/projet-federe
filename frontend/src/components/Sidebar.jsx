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
  MessageSquare,
  X,
} from 'lucide-react';

const studentNav = [
  { to: '/student', icon: <LayoutDashboard size={17} />, label: 'Tableau de bord' },
  { to: '/student/stage', icon: <FileText size={17} />, label: 'Dépôt dossier' },
  { to: '/student/documents', icon: <ClipboardList size={17} />, label: 'Documents' },
  { to: '/student/reclamations', icon: <Bell size={17} />, label: 'Réclamations' },
];
const juryNav = [
  { to: '/jury/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/jury', icon: <Calendar size={18} />, label: 'Planning et Evaluations'},
  { to: '/jury/messages', icon: <MessageSquare size={18} />, label: 'Messages' },
];
const adminNav = [
  { to: '/admin', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
  { to: '/admin/soutenances', icon: <Calendar size={17} />, label: 'Soutenances' },
  { to: '/admin/jury', icon: <Users size={17} />, label: 'Jury' },
  { to: '/admin/submissions', icon: <CheckCircle size={17} />, label: 'Soumissions' },
  { to: '/admin/reclamations', icon: <Bell size={17} />, label: 'Réclamations' },
  { to: '/admin/documents', icon: <FileText size={17} />, label: 'Documents' },
];
const roleLabels = { etudiant: 'ÉTUDIANT', jury: 'JURY', admin: 'RESPONSABLE' };
const MESSAGE_PATHS = ['/jury/messages', '/student/messages'];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function Sidebar({ sidebarOpen: controlledOpen, setSidebarOpen: controlledSetOpen }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Si les props ne sont pas fournies (utilisation sans contrôle parent), on utilise un état interne
  const [internalOpen, setInternalOpen] = useState(false);
  const sidebarOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setSidebarOpen = controlledSetOpen !== undefined ? controlledSetOpen : setInternalOpen;

  const [pendingCount, setPendingCount] = useState(0);
  const [reclamationsAdminCount, setReclamationsAdminCount] = useState(0);
  const [reclamationsCount, setReclamationsCount] = useState(0);
  const [messagesNonLus, setMessagesNonLus] = useState(0);
  const [aDejaSoumis, setADejaSoumis] = useState(false);

  const isOnMessagesPage = MESSAGE_PATHS.includes(location.pathname);

  // Fermer la sidebar automatiquement sur mobile lors du changement de page
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile, setSidebarOpen]);

  // Gestion du scroll body quand la sidebar est ouverte sur mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, sidebarOpen]);

  const checkDejaSoumis = useCallback(async () => {
    if (user?.role === 'etudiant') {
      try {
        const res = await api.get('/etudiant/a-deja-soumis');
        setADejaSoumis(res.data.dejaSoumis);
      } catch (err) { console.error(err); }
    }
  }, [user]);

  const loadPendingCount = useCallback(() => {
    if (user?.role === 'admin') {
      api.get('/admin/soumissions')
        .then(res => {
          const pending = res.data.filter(s => s.statut !== 'traite' && s.statut !== 'valide');
          setPendingCount(pending.length);
        })
        .catch(console.error);
    }
  }, [user]);

  const loadReclamationsAdminCount = useCallback(() => {
    if (user?.role === 'admin') {
      api.get('/admin/reclamations')
        .then(res => {
          setReclamationsAdminCount(res.data.filter(r => r.statut === 'en_attente').length);
        })
        .catch(console.error);
    }
  }, [user]);

  const loadReclamationsCount = useCallback(async () => {
    if (user?.role === 'etudiant') {
      try {
        const res = await api.get('/etudiant/reclamations');
        const reponsesVues = JSON.parse(localStorage.getItem('reponsesVues') || '{}');
        let count = 0;
        res.data.forEach(r => {
          if (r.statut === 'traitee' && r.reponse) {
            if (!reponsesVues[`${r.id}_${r.reponse_at || r.updated_at}`]) count++;
          }
        });
        setReclamationsCount(count);
      } catch (err) { console.error(err); }
    }
  }, [user]);

  const handleReclamationsClick = useCallback(async () => {
    if (reclamationsCount > 0) {
      try {
        const res = await api.get('/etudiant/reclamations');
        const reponsesVues = JSON.parse(localStorage.getItem('reponsesVues') || '{}');
        res.data.forEach(r => {
          if (r.statut === 'traitee' && r.reponse)
            reponsesVues[`${r.id}_${r.reponse_at || r.updated_at}`] = true;
        });
        localStorage.setItem('reponsesVues', JSON.stringify(reponsesVues));
        setReclamationsCount(0);
      } catch (err) { console.error(err); }
    }
  }, [reclamationsCount]);

  const fetchNonLus = useCallback(() => {
    if (isOnMessagesPage) return;
    api.get('/messages/non-lus')
      .then(res => setMessagesNonLus(res.data.non_lus || 0))
      .catch(() => {});
  }, [isOnMessagesPage]);

  useEffect(() => {
    if (user?.role !== 'jury' && user?.role !== 'etudiant') return;
    const handler = e => setMessagesNonLus(e.detail.count);
    window.addEventListener('messages-non-lus-updated', handler);
    return () => window.removeEventListener('messages-non-lus-updated', handler);
  }, [user]);

  useEffect(() => {
    if (!isOnMessagesPage && (user?.role === 'jury' || user?.role === 'etudiant')) {
      const t = setTimeout(() => {
        api.get('/messages/non-lus')
          .then(res => setMessagesNonLus(res.data.non_lus || 0))
          .catch(() => {});
      }, 500);
      return () => clearTimeout(t);
    }
  }, [isOnMessagesPage, user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadPendingCount();
      loadReclamationsAdminCount();

      const interval = setInterval(() => {
        loadPendingCount();
        loadReclamationsAdminCount();
      }, 30000);

      const handleSubmissionUpdate   = () => loadPendingCount();
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
      checkDejaSoumis();
      fetchNonLus();
      
      const interval = setInterval(() => {
        loadReclamationsCount();
        fetchNonLus();
        checkDejaSoumis();
      }, 30000);
      
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          loadReclamationsCount();
          fetchNonLus();
          checkDejaSoumis();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    if (user?.role === 'jury') {
      fetchNonLus();
      const interval = setInterval(fetchNonLus, 30000);
      return () => clearInterval(interval);
    }
  }, [user, loadPendingCount, loadReclamationsAdminCount, loadReclamationsCount, checkDejaSoumis, fetchNonLus]);

  let nav = [];
  if (user?.role === 'etudiant')   nav = studentNav;
  else if (user?.role === 'jury')  nav = juryNav;
  else if (user?.role === 'admin') nav = adminNav;

  nav = nav.map(item =>
    item.to === '/student/stage'
      ? { ...item, disabled: aDejaSoumis }
      : item
  );

  const sidebarContent = (
    <aside className={`sidebar ${isMobile && sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-wrap">
          <div className="logo-icon">🎓</div>
          <div>
            <h2>GradFlow</h2>
            <p>Soutenances académiques</p>
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Fermer le menu"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="sidebar-role">
        <span>{user ? roleLabels[user.role] : ''}</span>
        <p>{user?.prenom} {user?.nom}</p>
        <small>{user?.email}</small>
      </div>

      <nav className="sidebar-nav">
        {nav.map(item => {
          const isDisabled = item.disabled === true;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={e => {
                if (isDisabled) { e.preventDefault(); return; }
                if (item.label === 'Réclamations') {
                  if (user?.role === 'etudiant') handleReclamationsClick();
                }
              }}
              className={`nav-item ${location.pathname === item.to ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
              style={{
                opacity: isDisabled ? 0.45 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                pointerEvents: isDisabled ? 'none' : 'auto',
              }}
              title={isDisabled ? 'Vous avez déjà soumis votre formulaire.' : ''}
              aria-current={location.pathname === item.to ? 'page' : undefined}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>

              {item.to === '/admin/submissions' && pendingCount > 0 && (
                <span className="badge-notification">{pendingCount > 99 ? '99+' : pendingCount}</span>
              )}
              {item.to === '/admin/reclamations' && user?.role === 'admin' && reclamationsAdminCount > 0 && (
                <span className="badge-notification">{reclamationsAdminCount > 99 ? '99+' : reclamationsAdminCount}</span>
              )}
              {item.label === 'Réclamations' && user?.role === 'etudiant' && reclamationsCount > 0 && (
                <span className="badge-notification">{reclamationsCount > 99 ? '99+' : reclamationsCount}</span>
              )}
              {item.label === 'Messages' && messagesNonLus > 0 && (
                <span className="badge-notification">{messagesNonLus > 99 ? '99+' : messagesNonLus}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={logout}>
          <LogOut size={15} /> Déconnexion
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Header mobile avec hamburger */}
      {isMobile && (
        <header className="mobile-header">
          <div className="mobile-header-brand">
            <div className="logo-icon">🎓</div>
            GradFlow
          </div>
          <button
            className={`hamburger ${sidebarOpen ? 'open' : ''}`}
            onClick={() => setSidebarOpen(v => !v)}
            aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={sidebarOpen}
          >
            <span /><span /><span />
          </button>
        </header>
      )}

      {/* Overlay mobile : rendu UNIQUEMENT si la sidebar est ouverte */}
      {isMobile && sidebarOpen && (
        <div
          className="sidebar-overlay visible"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {sidebarContent}
    </>
  );
}