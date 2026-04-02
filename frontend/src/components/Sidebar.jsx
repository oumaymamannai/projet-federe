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
} from 'lucide-react';

const studentNav = [
  { to: '/student', icon: <LayoutDashboard size={18} />, label: 'Tableau de bord' },
  { to: '/student/stage', icon: <FileText size={18} />, label: 'Depot dossier', disabled: false },
  { to: '/student/documents', icon: <ClipboardList size={18} />, label: 'Documents' },
  { to: '/student/reclamations', icon: <Bell size={18} />, label: 'Réclamations' },
];

const juryNav = [
  { to: '/jury/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/jury', icon: <Calendar size={18} />, label: 'Planning' },
  { to: '/jury/messages', icon: <MessageSquare size={18} />, label: 'Messages' },
];

const adminNav = [
  { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/admin/soutenances', icon: <Calendar size={18} />, label: 'Soutenances' },
  { to: '/admin/jury', icon: <Users size={18} />, label: 'Jury' },
  { to: '/admin/submissions', icon: <CheckCircle size={18} />, label: 'Soumissions' },
  { to: '/admin/reclamations', icon: <Bell size={18} />, label: 'Réclamations' },
  { to: '/admin/documents', icon: <FileText size={18} />, label: 'Documents' },
];

const roleLabels = { etudiant: 'ÉTUDIANT', jury: 'JURY', admin: 'RESPONSABLE' };

/* ─────────────────────────────────────────────────────────────
   Paths des pages Messages selon le rôle.
   Utilisé pour détecter si on est sur la page Messages.
──────────────────────────────────────────────────────────────*/
const MESSAGE_PATHS = ['/jury/messages', '/student/messages'];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [pendingCount, setPendingCount]               = useState(0);
  const [reclamationsAdminCount, setReclamationsAdminCount] = useState(0);
  const [reclamationsCount, setReclamationsCount]     = useState(0);
  const [messagesNonLus, setMessagesNonLus]           = useState(0);
  const [aDejaSoumis, setADejaSoumis]                 = useState(false);

  const isOnMessagesPage = MESSAGE_PATHS.includes(location.pathname);

  /* ── Admin / étudiant / jury : logique inchangée ── */

  const checkDejaSoumis = useCallback(async () => {
    if (user?.role === 'etudiant') {
      try {
        const res = await api.get('/etudiant/a-deja-soumis');
        setADejaSoumis(res.data.dejaSoumis);
      } catch (err) { console.error('Erreur vérification soumission:', err); }
    }
  }, [user]);

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
        const reponsesVues = JSON.parse(localStorage.getItem('reponsesVues') || '{}');
        let newCount = 0;
        res.data.forEach(r => {
          if (r.statut === 'traitee' && r.reponse) {
            const id = `${r.id}_${r.reponse_at || r.updated_at}`;
            if (!reponsesVues[id]) newCount++;
          }
        });
        setReclamationsCount(newCount);
      } catch (error) { console.error('Erreur chargement réclamations étudiant:', error); }
    }
  }, [user]);

  const handleReclamationsClick = useCallback(async () => {
    if (reclamationsCount > 0) {
      try {
        const res = await api.get('/etudiant/reclamations');
        const reponsesVues = JSON.parse(localStorage.getItem('reponsesVues') || '{}');
        res.data.forEach(r => {
          if (r.statut === 'traitee' && r.reponse) {
            reponsesVues[`${r.id}_${r.reponse_at || r.updated_at}`] = true;
          }
        });
        localStorage.setItem('reponsesVues', JSON.stringify(reponsesVues));
        setReclamationsCount(0);
      } catch (error) { console.error('Erreur:', error); }
    }
  }, [reclamationsCount]);

  const handleAdminReclamationsClick = useCallback(() => {}, []);

  /* ─────────────────────────────────────────────────────────────
     Badge Messages — NOUVELLE LOGIQUE :

     QUAND on est sur la page Messages :
       → MessagesPage est la source de vérité.
         Elle émet 'messages-non-lus-updated' à chaque changement
         de son totalUnread (état local, identique à la sidebar conv).
         La Sidebar écoute et met à jour immédiatement.
         Le polling API ci-dessous est SUSPENDU pour éviter la divergence.

     QUAND on n'est PAS sur la page Messages :
       → La Sidebar fait son propre polling /messages/non-lus
         toutes les 30s pour détecter les nouveaux messages.

     C'est exactement le même principe que la sidebar de la conv :
     l'état local (ou l'événement qui le reflète) prime toujours
     sur le serveur.
  ──────────────────────────────────────────────────────────────*/

  /* Polling messages — actif seulement hors page Messages */
  const fetchNonLus = useCallback(() => {
    if (isOnMessagesPage) return; // MessagesPage gère via événement
    api.get('/messages/non-lus')
      .then(res => setMessagesNonLus(res.data.non_lus || 0))
      .catch(() => {});
  }, [isOnMessagesPage]);

  /* Écoute de l'événement émis par MessagesPage */
  useEffect(() => {
    if (user?.role !== 'jury' && user?.role !== 'etudiant') return;

    const handler = (e) => {
      // MessagesPage calcule totalUnread depuis son état local
      // (somme de tous les conv.non_lus), exactement comme la
      // sidebar de la conv calcule ses badges. On reçoit le même chiffre.
      setMessagesNonLus(e.detail.count);
    };

    window.addEventListener('messages-non-lus-updated', handler);
    return () => window.removeEventListener('messages-non-lus-updated', handler);
  }, [user]);

  /* Quand on quitte la page Messages, on re-fetch une fois
     pour avoir l'état réel du serveur (d'autres messages
     peuvent être arrivés depuis d'autres convs) */
  useEffect(() => {
    if (!isOnMessagesPage && (user?.role === 'jury' || user?.role === 'etudiant')) {
      // Petit délai pour laisser le serveur traiter les marquages
      const t = setTimeout(() => {
        api.get('/messages/non-lus')
          .then(res => setMessagesNonLus(res.data.non_lus || 0))
          .catch(() => {});
      }, 500);
      return () => clearTimeout(t);
    }
  }, [isOnMessagesPage, user]);

  /* Setup des effets selon le rôle */
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
  if (user?.role === 'etudiant')     nav = studentNav;
  else if (user?.role === 'jury')    nav = juryNav;
  else if (user?.role === 'admin')   nav = adminNav;

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
        {nav.map(item => {
          const isDisabled = item.disabled === true;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={(e) => {
                if (isDisabled) { e.preventDefault(); return; }
                if (item.label === 'Réclamations') {
                  if (user?.role === 'etudiant') handleReclamationsClick();
                  if (user?.role === 'admin') handleAdminReclamationsClick();
                }
              }}
              className={`nav-item ${location.pathname === item.to ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
              style={{
                position: 'relative',
                opacity: isDisabled ? 0.5 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                pointerEvents: isDisabled ? 'none' : 'auto',
              }}
              title={isDisabled ? "✅ Vous avez déjà soumis votre formulaire de stage. Une seule soumission est autorisée." : ""}
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
              {item.label === 'Messages' && messagesNonLus > 0 && (
                <span className="badge-notification">{messagesNonLus > 99 ? '99+' : messagesNonLus}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={logout}>
          <LogOut size={16} /> Déconnexion
        </button>
      </div>
    </aside>
  );
}