import { Link, useLocation } from 'react-router-dom'; // Importation de Link et useLocation
import { useAuth } from '../context/AuthContext'; // Importation de useAuth
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api'; // Importation de api
import {
  LayoutDashboard, // Importation de LayoutDashboard
  Calendar,
  Users,
  Bell, // Importation de Bell
  FileText,
  LogOut, // Importation de LogOut
  ClipboardList,
  CheckCircle, // Importation de CheckCircle
  MessageSquare,
  X,FolderOpen,
} from 'lucide-react'; // Importation de X

const studentNav = [ // Définition des éléments de navigation pour l'étudiant
  { to: '/student', icon: <LayoutDashboard size={17} />, label: 'Tableau de bord' },
  { to: '/student/stage', icon: <FileText size={17} />, label: 'Dépôt dossier' },
  { to: '/student/documents', icon: <FolderOpen size={17} />, label: 'Documents' },
  { to: '/student/reclamations', icon: <Bell size={17} />, label: 'Réclamations' },
];
const juryNav = [ // Définition des éléments de navigation pour le jury
  { to: '/jury/dashboard', icon: <LayoutDashboard size={18} />, label: 'Tableau de bord' },
  { to: '/jury', icon: <Calendar size={18} />, label: 'Planning et Evaluations'},
  { to: '/jury/messages', icon: <MessageSquare size={18} />, label: 'Messages' },
];
const adminNav = [ // Définition des éléments de navigation pour l'administrateur
  { to: '/admin', icon: <LayoutDashboard size={17} />, label: 'Tableau de bord' },
  { to: '/admin/soutenances', icon: <Calendar size={17} />, label: 'Soutenances' },
  { to: '/admin/jury', icon: <Users size={17} />, label: 'Jury' },
  { to: '/admin/submissions', icon: <FileText size={17} />, label: 'Soumissions' },
  { to: '/admin/reclamations', icon: <Bell size={17} />, label: 'Réclamations' },
  { to: '/admin/documents', icon: <FolderOpen size={17} />, label: 'Documents' },
];
const roleLabels = { etudiant: 'ÉTUDIANT', jury: 'JURY', admin: 'RESPONSABLE' }; // Définition des labels des rôles   
const MESSAGE_PATHS = ['/jury/messages', '/student/messages']; // Définition des chemins des pages de messages

function useIsMobile() { // Fonction pour vérifier si le dispositif est mobile
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => { // Effet pour vérifier si le dispositif est mobile
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler); // Écouteur d'événement pour vérifier si le dispositif est mobile
    return () => window.removeEventListener('resize', handler); // Suppression de l'écouteur d'événement pour vérifier si le dispositif est mobile
  }, []);
  return isMobile;
} // Fin de la fonction pour vérifier si le dispositif est mobile

export default function Sidebar({ sidebarOpen: controlledOpen, setSidebarOpen: controlledSetOpen }) { // Fonction pour afficher la sidebar
  const { user, logout } = useAuth();
  const location = useLocation(); // Récupération de l'URL actuelle
  const isMobile = useIsMobile(); // Vérification si le dispositif est mobile
  
  // Si les props ne sont pas fournies (utilisation sans contrôle parent), on utilise un état interne
  const [internalOpen, setInternalOpen] = useState(false); // État interne pour la sidebar
  const sidebarOpen = controlledOpen !== undefined ? controlledOpen : internalOpen; // Ouverture de la sidebar
  const setSidebarOpen = controlledSetOpen !== undefined ? controlledSetOpen : setInternalOpen; // Fermeture de la sidebar

  const [pendingCount, setPendingCount] = useState(0); // État interne pour le nombre de soumissions en attente
  const [reclamationsAdminCount, setReclamationsAdminCount] = useState(0); // État interne pour le nombre de réclamations en attente
  const [reclamationsCount, setReclamationsCount] = useState(0);
  const [messagesNonLus, setMessagesNonLus] = useState(0); // État interne pour le nombre de messages non lus
  const [aDejaSoumis, setADejaSoumis] = useState(false); // État interne pour savoir si l'étudiant a déjà soumis son formulaire

  const isOnMessagesPage = MESSAGE_PATHS.includes(location.pathname); // Vérification si la page est une page de messages

  // Fermer la sidebar automatiquement sur mobile lors du changement de page
  useEffect(() => { // Effet pour fermer la sidebar automatiquement sur mobile lors du changement de page
    if (isMobile) setSidebarOpen(false); // Fermeture de la sidebar
  }, [location.pathname, isMobile, setSidebarOpen]); // Dépendances

  // Gestion du scroll body quand la sidebar est ouverte sur mobile
  useEffect(() => { // Effet pour gérer le scroll body quand la sidebar est ouverte sur mobile      
    if (isMobile && sidebarOpen) {  
      document.body.style.overflow = 'hidden'; // Masquer le scroll
    } else {
      document.body.style.overflow = ''; // Afficher le scroll
    }
    return () => { document.body.style.overflow = ''; }; // Suppression de l'écouteur d'événement pour gérer le scroll body quand la sidebar est ouverte sur mobile
  }, [isMobile, sidebarOpen]);

  const checkDejaSoumis = useCallback(async () => { // Fonction pour vérifier si l'étudiant a déjà soumis son formulaire
    if (user?.role === 'etudiant') { // Si l'utilisateur est un étudiant
      try { // Essayer de vérifier si l'étudiant a déjà soumis son formulaire
        const res = await api.get('/etudiant/a-deja-soumis'); // Récupération des données de l'étudiant
        setADejaSoumis(res.data.dejaSoumis); // Définition de l'état interne pour savoir si l'étudiant a déjà soumis son formulaire
      } catch (err) { console.error(err); } // Gestion des erreurs
    }
  }, [user]); // Dépendances

  const loadPendingCount = useCallback(() => { // Fonction pour charger le nombre de soumissions en attente
    if (user?.role === 'admin') { // Si l'utilisateur est un administrateur
      api.get('/admin/soumissions')
        .then(res => { // Récupération des données des soumissions
          const pending = res.data.filter(s => s.statut !== 'traite' && s.statut !== 'valide'); // Filtrer les soumissions en attente
          setPendingCount(pending.length); // Définition de l'état interne pour le nombre de soumissions en attente
        })
        .catch(console.error); // Gestion des erreurs
    }
  }, [user]); // Dépendances

  const loadReclamationsAdminCount = useCallback(() => { // Fonction pour charger le nombre de réclamations en attente
    if (user?.role === 'admin') {
      api.get('/admin/reclamations')
        .then(res => { // Récupération des données des réclamations
          setReclamationsAdminCount(res.data.filter(r => r.statut === 'en_attente').length); // Définition de l'état interne pour le nombre de réclamations en attente
        })
        .catch(console.error); // Gestion des erreurs
    }
  }, [user]); // Dépendances

  const loadReclamationsCount = useCallback(async () => { // Fonction pour charger le nombre de réclamations    
    if (user?.role === 'etudiant') { // Si l'utilisateur est un étudiant
      try {   
        const res = await api.get('/etudiant/reclamations'); // Récupération des données des réclamations
        const reponsesVues = JSON.parse(localStorage.getItem('reponsesVues') || '{}'); // Récupération des données des réponses vues
        let count = 0; // Initialisation du compteur
        res.data.forEach(r => { // Boucle pour parcourir les réclamations
          if (r.statut === 'traitee' && r.reponse) {
            if (!reponsesVues[`${r.id}_${r.reponse_at || r.updated_at}`]) count++;
          }
        });
        setReclamationsCount(count); // Définition de l'état interne pour le nombre de réclamations
      } catch (err) { console.error(err); } // Gestion des erreurs
    }
  }, [user]); // Dépendances

  const handleReclamationsClick = useCallback(async () => { // Fonction pour gérer le clic sur les réclamations
    if (reclamationsCount > 0) {
      try {
        const res = await api.get('/etudiant/reclamations'); // Récupération des données des réclamations
        const reponsesVues = JSON.parse(localStorage.getItem('reponsesVues') || '{}'); // Récupération des données des réponses vues
        res.data.forEach(r => { // Boucle pour parcourir les réclamations
          if (r.statut === 'traitee' && r.reponse)
            reponsesVues[`${r.id}_${r.reponse_at || r.updated_at}`] = true;
        });
        localStorage.setItem('reponsesVues', JSON.stringify(reponsesVues)); // Stockage des données des réponses vues
        setReclamationsCount(0); // Définition de l'état interne pour le nombre de réclamations
      } catch (err) { console.error(err); }
    }
  }, [reclamationsCount]); // Dépendances

  const fetchNonLus = useCallback(() => { // Fonction pour charger le nombre de messages non lus
    if (isOnMessagesPage) return;
    api.get('/messages/non-lus')
      .then(res => setMessagesNonLus(res.data.non_lus || 0))
      .catch(() => {});
  }, [isOnMessagesPage]); // Dépendances

  useEffect(() => {
    if (user?.role !== 'jury' && user?.role !== 'etudiant') return; // Si l'utilisateur n'est pas un jury ou un étudiant
    const handler = e => setMessagesNonLus(e.detail.count);
    window.addEventListener('messages-non-lus-updated', handler);
    return () => window.removeEventListener('messages-non-lus-updated', handler); // Suppression de l'écouteur d'événement pour charger le nombre de messages non lus
  }, [user]); // Dépendances

  useEffect(() => {
    if (!isOnMessagesPage && (user?.role === 'jury' || user?.role === 'etudiant')) { // Si la page n'est pas une page de messages et que l'utilisateur est un jury ou un étudiant et que l'on est pas sur une page de messages    
      const t = setTimeout(() => { // Délai pour charger le nombre de messages non lus
        api.get('/messages/non-lus')
          .then(res => setMessagesNonLus(res.data.non_lus || 0)) // Définition de l'état interne pour le nombre de messages non lus
          .catch(() => {}); // Gestion des erreurs
      }, 500); // Délai pour charger le nombre de messages non lus
      return () => clearTimeout(t); // Suppression de l'écouteur d'événement pour charger le nombre de messages non lus
    }
  }, [isOnMessagesPage, user]); // Dépendances

  useEffect(() => { // Effet pour charger le nombre de soumissions en attente
    if (user?.role === 'admin') { // Si l'utilisateur est un administrateur
      loadPendingCount(); // Chargement du nombre de soumissions en attente
      loadReclamationsAdminCount(); // Chargement du nombre de réclamations en attente

      const interval = setInterval(() => { // Intervalle pour charger le nombre de soumissions en attente et le nombre de réclamations en attente (30 secondes)
        loadPendingCount(); // Chargement du nombre de soumissions en attente
        loadReclamationsAdminCount(); // Chargement du nombre de réclamations en attente
      }, 30000); // Intervalle pour charger le nombre de soumissions en attente et le nombre de réclamations en attente (30 secondes)

      const handleSubmissionUpdate   = () => loadPendingCount(); // Fonction pour charger le nombre de soumissions en attente
      const handleReclamationsUpdate = () => loadReclamationsAdminCount(); // Fonction pour charger le nombre de réclamations en attente

      window.addEventListener('submissionUpdated', handleSubmissionUpdate); // Écouteur d'événement pour charger le nombre de soumissions en attente
      window.addEventListener('reclamations-admin-updated', handleReclamationsUpdate); // Écouteur d'événement pour charger le nombre de réclamations en attente

      return () => {
        clearInterval(interval); // Suppression de l'intervalle pour charger le nombre de soumissions en attente et le nombre de réclamations en attente (30 secondes)
        window.removeEventListener('submissionUpdated', handleSubmissionUpdate);
        window.removeEventListener('reclamations-admin-updated', handleReclamationsUpdate); // Suppression de l'écouteur d'événement pour charger le nombre de réclamations en attente
      };
    }

    if (user?.role === 'etudiant') { // Si l'utilisateur est un étudiant
      loadReclamationsCount(); // Chargement du nombre de réclamations
      checkDejaSoumis(); // Vérification si l'étudiant a déjà soumis son formulaire
      fetchNonLus(); // Chargement du nombre de messages non lus
      
      const interval = setInterval(() => { // Intervalle pour charger le nombre de réclamations et le nombre de messages non lus (30 secondes)
        loadReclamationsCount(); // Chargement du nombre de réclamations
        fetchNonLus(); // Chargement du nombre de messages non lus
        checkDejaSoumis(); // Vérification si l'étudiant a déjà soumis son formulaire
      }, 30000); // Intervalle pour charger le nombre de réclamations et le nombre de messages non lus (30 secondes)
      
      const handleVisibilityChange = () => { // Fonction pour gérer le changement de visibilité
        if (document.visibilityState === 'visible') {
          loadReclamationsCount(); // Chargement du nombre de réclamations
          fetchNonLus(); // Chargement du nombre de messages non lus
          checkDejaSoumis(); // Vérification si l'étudiant a déjà soumis son formulaire
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange); // Écouteur d'événement pour gérer le changement de visibilité
      return () => {
        clearInterval(interval); // Suppression de l'intervalle pour charger le nombre de réclamations et le nombre de messages non lus (30 secondes)
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    if (user?.role === 'jury') { // Si l'utilisateur est un jury
      fetchNonLus(); // Chargement du nombre de messages non lus
      const interval = setInterval(fetchNonLus, 30000); // Intervalle pour charger le nombre de messages non lus (30 secondes)
      return () => clearInterval(interval); // Suppression de l'intervalle pour charger le nombre de messages non lus (30 secondes)
    }
  }, [user, loadPendingCount, loadReclamationsAdminCount, loadReclamationsCount, checkDejaSoumis, fetchNonLus]); // Dépendances

  let nav = []; // Définition des éléments de navigation pour l'utilisateur
  if (user?.role === 'etudiant')   nav = studentNav; // Définition des éléments de navigation pour l'étudiant
  else if (user?.role === 'jury')  nav = juryNav; // Définition des éléments de navigation pour le jury
  else if (user?.role === 'admin') nav = adminNav; // Définition des éléments de navigation pour l'administrateur

  nav = nav.map(item => // Boucle pour parcourir les éléments de navigation et désactiver le bouton si l'étudiant a déjà soumis son formulaire
    item.to === '/student/stage'
      ? { ...item, disabled: aDejaSoumis } // Désactivation du bouton si l'étudiant a déjà soumis son formulaire
      : item // Retourne l'élément de navigation
  ); // Fin de la boucle pour parcourir les éléments de navigation et désactiver le bouton si l'étudiant a déjà soumis son formulaire

  const sidebarContent = ( // Contenu de la sidebar
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
              onClick={() => setSidebarOpen(false)} // Fermeture de la sidebar
              style={{
                marginLeft: 'auto', // Marge à gauche
                background: 'none', // Couleur de fond
                border: 'none', // Bordure
                color: 'rgba(255,255,255,.6)', // Couleur du texte
                cursor: 'pointer', // Cursor de pointeur
                display: 'flex', // Afficher en flex
                alignItems: 'center', // Aligner les éléments en centre
              }}
              aria-label="Fermer le menu" // Étiquette pour le bouton
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
        {nav.map(item => { // Boucle pour parcourir les éléments de navigation et désactiver le bouton si l'étudiant a déjà soumis son formulaire
          const isDisabled = item.disabled === true; // Désactivation du bouton si l'étudiant a déjà soumis son formulaire
          return (
            <Link
              key={item.to} // Clé pour l'élément de navigation
              to={item.to} // Lien vers la page
              onClick={e => { // Fonction pour gérer le clic sur les éléments de navigation
                if (isDisabled) { e.preventDefault(); return; } // Si le bouton est désactivé, prévenir le clic
                if (item.label === 'Réclamations') { // Si l'élément de navigation est une réclamation
                  if (user?.role === 'etudiant') handleReclamationsClick(); // Fonction pour gérer le clic sur les réclamations
                }
              }} // Fin de la fonction pour gérer le clic sur les éléments de navigation
              className={`nav-item ${location.pathname === item.to ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`} // Classe pour l'élément de navigation
              style={{
                opacity: isDisabled ? 0.45 : 1, // Opacité du texte
                cursor: isDisabled ? 'not-allowed' : 'pointer', // Cursor de pointeur
                pointerEvents: isDisabled ? 'none' : 'auto', // Événements pour le pointeur
              }}
              title={isDisabled ? 'Vous avez déjà soumis votre formulaire.' : ''}
              aria-current={location.pathname === item.to ? 'page' : undefined}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>

              {item.to === '/admin/submissions' && pendingCount > 0 && ( // Si l'élément de navigation est une soumission et que le nombre de soumissions en attente est supérieur à 0
                <span className="badge-notification">{pendingCount > 99 ? '99+' : pendingCount}</span> // Affichage du nombre de soumissions en attente
              )}
              {item.to === '/admin/reclamations' && user?.role === 'admin' && reclamationsAdminCount > 0 && ( // Si l'élément de navigation est une réclamation et que le nombre de réclamations en attente est supérieur à 0
                <span className="badge-notification">{reclamationsAdminCount > 99 ? '99+' : reclamationsAdminCount}</span> // Affichage du nombre de réclamations en attente
              )}
              {item.label === 'Réclamations' && user?.role === 'etudiant' && reclamationsCount > 0 && ( // Si l'élément de navigation est une réclamation et que le nombre de réclamations est supérieur à 0
                <span className="badge-notification">{reclamationsCount > 99 ? '99+' : reclamationsCount}</span> // Affichage du nombre de réclamations
              )}
              {item.label === 'Messages' && messagesNonLus > 0 && ( // Si l'élément de navigation est une message et que le nombre de messages non lus est supérieur à 0
                <span className="badge-notification">{messagesNonLus > 99 ? '99+' : messagesNonLus}</span> // Affichage du nombre de messages non lus
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
          <button // Bouton pour ouvrir la sidebar
            className={`hamburger ${sidebarOpen ? 'open' : ''}`} // Classe pour le bouton
            onClick={() => setSidebarOpen(v => !v)} // Fonction pour ouvrir la sidebar
            aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'} // Étiquette pour le bouton
            aria-expanded={sidebarOpen} // État du bouton
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