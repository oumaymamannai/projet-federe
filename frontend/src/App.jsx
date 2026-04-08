import { useLocation,BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import Sidebar from "./components/Sidebar";
import FloatingChat from './components/FloatingChat';
import { Toaster } from 'react-hot-toast';

// Student pages
import StudentDashboard   from "./pages/student/Dashboard";
import StudentStage       from "./pages/student/Stage";
import StudentDocuments   from "./pages/student/Documents";
import StudentReclamations from "./pages/student/Reclamations";

// Jury pages
import JuryDashboard  from "./pages/jury/JuryDashboard";
import JuryPlanning   from "./pages/jury/Planning";
import JuryEvaluations from "./pages/jury/Evaluations";
import MessagesPage   from "./pages/jury/MessagesPage";

// Admin pages
import AdminDashboard   from "./pages/admin/Dashboard";
import AdminSoutenances from "./pages/admin/Soutenances";
import AdminJury        from "./pages/admin/Jury";
import AdminReclamations from "./pages/admin/Reclamations";
import AdminDocuments   from "./pages/admin/Documents";
import AdminSubmissions from './pages/admin/ValidationSoumissions';

// Layout protégé avec sidebar et gestion mobile
function ProtectedLayout({ roles }) {
  const { user, loading } = useAuth();

const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = window.innerWidth <= 768;

  // Ferme la sidebar uniquement sur mobile (appelable par les pages enfants)
  const closeSidebarOnMobile = () => {
    if (isMobile) setSidebarOpen(false);
  };

  // Réouvre la sidebar quand on change de page (optionnel)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]); // nécessite useLocation, voir plus bas

  if (loading) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;

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
  const { user } = useAuth();
  const defaultRoute = user
    ? user.role === 'admin' ? '/admin'
    : user.role === 'jury'  ? '/jury/dashboard'
    : '/student'
    : '/login';

  return (
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