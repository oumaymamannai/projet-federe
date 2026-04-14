import { useLocation,BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"; 
import { useState, useEffect } from "react"; // Importation de useState et useEffect  
import { AuthProvider, useAuth } from "./context/AuthContext"; // Importation de AuthProvider et useAuth
import LoginPage from "./pages/LoginPage"; // Importation de LoginPage
import Sidebar from "./components/Sidebar"; // Importation de Sidebar
import FloatingChat from './components/FloatingChat'; // Importation de FloatingChat
import { Toaster } from 'react-hot-toast'; // Importation de Toaster

// Student pages
import StudentDashboard   from "./pages/student/Dashboard"; // Importation de StudentDashboard
import StudentStage       from "./pages/student/Stage"; // Importation de StudentStage
import StudentDocuments   from "./pages/student/Documents"; // Importation de StudentDocuments
import StudentReclamations from "./pages/student/Reclamations"; // Importation de StudentReclamations

// Jury pages
import JuryDashboard  from "./pages/jury/JuryDashboard"; // Importation de JuryDashboard
import JuryPlanning   from "./pages/jury/Planning"; // Importation de JuryPlanning
import JuryEvaluations from "./pages/jury/Evaluations"; // Importation de JuryEvaluations
import MessagesPage   from "./pages/jury/MessagesPage"; // Importation de MessagesPage

// Admin pages
import AdminDashboard   from "./pages/admin/Dashboard"; // Importation de AdminDashboard
import AdminSoutenances from "./pages/admin/Soutenances"; // Importation de AdminSoutenances
import AdminJury        from "./pages/admin/Jury"; // Importation de AdminJury
import AdminReclamations from "./pages/admin/Reclamations"; // Importation de AdminReclamations
import AdminDocuments   from "./pages/admin/Documents"; // Importation de AdminDocuments
import AdminSubmissions from './pages/admin/ValidationSoumissions'; // Importation de AdminSubmissions

// Layout protégé avec sidebar et gestion mobile
function ProtectedLayout({ roles }) {
  const { user, loading } = useAuth();

const location = useLocation(); // Récupération de l'emplacement de la page   
  const [sidebarOpen, setSidebarOpen] = useState(true); // État de la sidebar
  const isMobile = window.innerWidth <= 768; // Vérification si le dispositif est mobile

  // Ferme la sidebar uniquement sur mobile (appelable par les pages enfants) 
  const closeSidebarOnMobile = () => {
    if (isMobile) setSidebarOpen(false); // Fermeture de la sidebar
  }; // Fermeture de la sidebar uniquement sur mobile

  // Réouvre la sidebar quand on change de page (optionnel)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false); // Fermeture de la sidebar
  }, [location.pathname, isMobile]); // nécessite useLocation, voir plus bas

  if (loading) return <div className="spinner" />; // Affichage du spinner
  if (!user) return <Navigate to="/login" replace />; // Redirection vers la page de connexion
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />; // Redirection vers la page de connexion

  return (
    <div className="app-layout">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} /> 
      <main className="main-content">
        <Outlet context={{ closeSidebarOnMobile }} />
        {user?.role === 'etudiant' && <FloatingChat />}
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth(); // Récupération de l'utilisateur
  const defaultRoute = user
    ? user.role === 'admin' ? '/admin' // Redirection vers la page de dashboard admin
    : user.role === 'jury'  ? '/jury/dashboard' // Redirection vers la page de dashboard jury
    : '/student' // Redirection vers la page de dashboard étudiant
    : '/login'; // Redirection vers la page de connexion

  return ( // Retourne les routes
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to={defaultRoute} replace />} /> 

      {/* Routes Student */}
      <Route element={<ProtectedLayout roles={["etudiant"]} />}>
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/stage" element={<StudentStage />} />
        <Route path="/student/documents" element={<StudentDocuments />} />
        <Route path="/student/reclamations" element={<StudentReclamations />} />
      </Route>

      {/* Routes Jury */}
      <Route element={<ProtectedLayout roles={["jury"]} />}>
        <Route path="/jury/dashboard" element={<JuryDashboard />} />
        <Route path="/jury" element={<JuryPlanning />} />
        <Route path="/jury/evaluations" element={<JuryEvaluations />} />
        <Route path="/jury/evaluations/:soutenanceId" element={<JuryEvaluations />} />
        <Route path="/jury/messages" element={<MessagesPage />} />
      </Route>

      {/* Routes Admin */}
      <Route element={<ProtectedLayout roles={["admin"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/soutenances" element={<AdminSoutenances />} />
        <Route path="/admin/jury" element={<AdminJury />} />
        <Route path="/admin/reclamations" element={<AdminReclamations />} />
        <Route path="/admin/documents" element={<AdminDocuments />} />
        <Route path="/admin/submissions" element={<AdminSubmissions />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#363636', color: '#fff', fontFamily: 'Plus Jakarta Sans, sans-serif' },
            success: { duration: 3000, style: { background: '#10b981', color: '#fff' } },
            error:   { duration: 4000, style: { background: '#ef4444', color: '#fff' } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}