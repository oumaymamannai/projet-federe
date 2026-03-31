import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import Sidebar from "./components/Sidebar";
import { Toaster } from 'react-hot-toast';

// Student pages
import StudentDashboard from "./pages/student/Dashboard";
import StudentStage from "./pages/student/Stage";
import StudentDocuments from "./pages/student/Documents";
import StudentReclamations from "./pages/student/Reclamations";

// Jury pages
import JuryDashboard from "./pages/jury/JuryDashboard";
import JuryPlanning from "./pages/jury/Planning";
import JuryEvaluations from "./pages/jury/Evaluations";
import MessagesPage from "./pages/jury/MessagesPage";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSoutenances from "./pages/admin/Soutenances";
import AdminJury from "./pages/admin/Jury";
import AdminReclamations from "./pages/admin/Reclamations";
import AdminDocuments from "./pages/admin/Documents";
import AdminSubmissions from './pages/admin/ValidationSoumissions';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        user ? <Navigate to={user.role === "admin" ? "/admin" : user.role === "jury" ? "/jury/dashboard" : "/student"} />
             : <Navigate to="/login" />
      } />

      {/* Student routes */}
      <Route path="/student" element={<ProtectedRoute roles={["etudiant"]}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/stage" element={<ProtectedRoute roles={["etudiant"]}><StudentStage /></ProtectedRoute>} />
      <Route path="/student/documents" element={<ProtectedRoute roles={["etudiant"]}><StudentDocuments /></ProtectedRoute>} />
      <Route path="/student/reclamations" element={<ProtectedRoute roles={["etudiant"]}><StudentReclamations /></ProtectedRoute>} />
      <Route path="/student/messages" element={<ProtectedRoute roles={["etudiant"]}><MessagesPage /></ProtectedRoute>} /> 

      {/* Jury routes */}
      <Route path="/jury/dashboard" element={<ProtectedRoute roles={["jury"]}><JuryDashboard /></ProtectedRoute>} />
      <Route path="/jury" element={<ProtectedRoute roles={["jury"]}><JuryPlanning /></ProtectedRoute>} />
      <Route path="/jury/evaluations" element={<ProtectedRoute roles={["jury"]}><JuryEvaluations /></ProtectedRoute>} />
      <Route path="/jury/evaluations/:soutenanceId" element={<ProtectedRoute roles={["jury"]}><JuryEvaluations /></ProtectedRoute>} />
      <Route path="/jury/messages" element={<ProtectedRoute roles={["jury"]}><MessagesPage /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/soutenances" element={<ProtectedRoute roles={["admin"]}><AdminSoutenances /></ProtectedRoute>} />
      <Route path="/admin/jury" element={<ProtectedRoute roles={["admin"]}><AdminJury /></ProtectedRoute>} />
      <Route path="/admin/reclamations" element={<ProtectedRoute roles={["admin"]}><AdminReclamations /></ProtectedRoute>} />
      <Route path="/admin/documents" element={<ProtectedRoute roles={["admin"]}><AdminDocuments /></ProtectedRoute>} />
      <Route path="/admin/submissions" element={<ProtectedRoute roles={["admin"]}><AdminSubmissions /></ProtectedRoute>} />
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
            style: { background: '#363636', color: '#fff' },
            success: { duration: 3000, style: { background: '#10b981', color: '#fff' } },
            error: { duration: 4000, style: { background: '#ef4444', color: '#fff' } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}