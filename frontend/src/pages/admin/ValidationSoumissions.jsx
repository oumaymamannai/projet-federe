import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import { FileText, CheckCircle, X, ChevronRight, Building2, User, BookOpen, AlignLeft, Paperclip, Calendar, Eye, XCircle } from "lucide-react";

// ── Drawer de détail ─────────────────────────────────────────────────────────
function DetailDrawer({ soumission, onClose, onValider, onRejeter }) {
  const drawerRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!soumission) return null;

  let files = [];
  if (soumission.fichiers) {
    try {
      files = typeof soumission.fichiers === 'string'
        ? JSON.parse(soumission.fichiers)
        : soumission.fichiers;
    } catch {}
  }

  const isPending = soumission.statut !== 'traite';

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <>
      {/* Overlay */}
      <div className="drawer-overlay" onClick={onClose} />

      {/* Drawer */}
      <div className="drawer" ref={drawerRef}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-header-left">
            <div className="drawer-avatar">
              {soumission.etudiant_nom?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <div className="drawer-title">{soumission.etudiant_nom}</div>
              <div className="drawer-sub">
                {isPending
                  ? <span className="badge-pill badge-warning-pill">⏳ En attente</span>
                  : <span className="badge-pill badge-success-pill">✅ Validé</span>
                }
              </div>
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Corps */}
        <div className="drawer-body">

          {/* Méta infos en grille */}
          <div className="drawer-meta-grid">
            <div className="meta-item">
              <div className="meta-icon"><BookOpen size={14} /></div>
              <div>
                <div className="meta-label">Sujet du projet</div>
                <div className="meta-value">{soumission.sujet || '—'}</div>
              </div>
            </div>
            <div className="meta-item">
              <div className="meta-icon"><Building2 size={14} /></div>
              <div>
                <div className="meta-label">Société / Entreprise</div>
                <div className="meta-value">{soumission.societe || '—'}</div>
              </div>
            </div>
            <div className="meta-item">
              <div className="meta-icon"><User size={14} /></div>
              <div>
                <div className="meta-label">Encadreur pédagogique</div>
                <div className="meta-value">{soumission.encadreur || <span style={{ color: '#9CA3AF' }}>Non renseigné</span>}</div>
              </div>
            </div>
            <div className="meta-item">
              <div className="meta-icon"><Calendar size={14} /></div>
              <div>
                <div className="meta-label">Date de soumission</div>
                <div className="meta-value">{formatDate(soumission.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Description complète */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <AlignLeft size={14} />
              <span>Description détaillée du projet</span>
            </div>
            {soumission.description ? (
              <div className="description-block">
                {soumission.description}
              </div>
            ) : (
              <div className="description-empty">Aucune description fournie.</div>
            )}
          </div>

          {/* Documents joints */}
          {files.length > 0 && (
            <div className="drawer-section">
              <div className="drawer-section-title">
                <Paperclip size={14} />
                <span>Documents joints ({files.length})</span>
              </div>
              <div className="files-list">
                {files.map((f, idx) => (
                  <a
                    key={idx}
                    href={`http://localhost:5000/uploads/${f}`}
                    target="_blank"
                    rel="noreferrer"
                    className="file-item"
                  >
                    <div className="file-icon"><FileText size={16} /></div>
                    <div className="file-name">Document {idx + 1}</div>
                    <ChevronRight size={14} className="file-arrow" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer avec actions */}
        {isPending && (
          <div className="drawer-footer">
            <div className="footer-actions">
              <button
                className="btn-rejeter"
                onClick={() => { onRejeter(soumission.id); onClose(); }}
              >
                <XCircle size={16} />
                Refuser
              </button>
              <button
                className="btn-valider"
                onClick={() => { onValider(soumission.id); onClose(); }}
              >
                <CheckCircle size={16} />
                Valider la soumission
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function AdminSubmissions() {
  const [soumissions, setSoumissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [msg, setMsg]                 = useState('');
  const [error, setError]             = useState('');

  const loadSoumissions = async () => {
    try {
      const response = await api.get('/admin/soumissions');
      setSoumissions(response.data);
    } catch {
      setError('Erreur lors du chargement des soumissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSoumissions(); }, []);

  const validerSoumission = async (id) => {
    try {
      await api.post(`/admin/soumissions/${id}/valider`);
      await loadSoumissions();
      setMsg('✅ Soumission validée avec succès');
      window.dispatchEvent(new Event('submissionUpdated'));
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la validation');
      setTimeout(() => setError(''), 4000);
    }
  };

  const rejeterSoumission = async (id) => {
    try {
      await api.post(`/admin/soumissions/${id}/rejeter`);
      await loadSoumissions();
      setMsg('❌ Soumission refusée');
      window.dispatchEvent(new Event('submissionUpdated'));
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du refus');
      setTimeout(() => setError(''), 4000);
    }
  };

  const pendingCount = soumissions.filter(s => s.statut !== 'traite').length;

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1>📋 Gestion des soumissions</h1>
            {pendingCount > 0 && (
              <span className="pending-badge">{pendingCount} en attente</span>
            )}
          </div>
          <p>Consultez et traitez les demandes de stage des étudiants</p>
        </div>
      </div>

      <div className="page-content">
        {msg   && <div className="alert alert-success">✅ {msg}</div>}
        {error && <div className="alert alert-danger">⚠️ {error}</div>}

        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📋 Liste des soumissions</h3>

          {/* Tableau simplifié */}
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Statut</th>
                  <th>Projet</th>
                </tr>
              </thead>
              <tbody>
                {soumissions.map((s) => (
                  <tr
                    key={s.id}
                    className={`row-clickable ${selected?.id === s.id ? 'row-active' : ''}`}
                  >
                    <td className="student-name">
                      <strong>{s.etudiant_nom}</strong>
                    </td>
                    
                    <td>
                      {s.statut === 'traite' ? (
                        <span className="badge badge-success">✅ Validé</span>
                      ) : (
                        <span className="badge badge-warning">⏳ En attente</span>
                      )}
                    </td>
                    
                    <td>
                      <button
                        className="btn-view"
                        onClick={() => setSelected(s)}
                      >
                        <Eye size={16} />
                        Voir le projet
                      </button>
                    </td>
                  </tr>
                ))}
                {soumissions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty-state">
                      Aucune soumission à afficher
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Drawer avec détails complets */}
      {selected && (
        <DetailDrawer
          soumission={selected}
          onClose={() => setSelected(null)}
          onValider={validerSoumission}
          onRejeter={rejeterSoumission}
        />
      )}

      <style>{`
        /* Variables de couleurs */
        :root {
          --primary-dark: #4F46E5;
          --primary-main: #6366F1;
          --primary-light: #818CF8;
          --primary-bg: #EEF2FF;
          --success: #10B981;
          --success-dark: #059669;
          --warning: #F59E0B;
          --danger: #EF4444;
          --danger-dark: #DC2626;
          --text-primary: #111827;
          --text-secondary: #4B5563;
          --text-muted: #6B7280;
          --border-color: #E5E7EB;
          --bg-secondary: #F9FAFB;
          --bg-white: #FFFFFF;
          --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        /* ── Page Header ── */
        .page-header {
          margin-bottom: 24px;
        }
        
        .page-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        
        .page-header p {
          color: var(--text-muted);
          margin-top: 4px;
        }
        
        .pending-badge {
          background: var(--danger);
          color: white;
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 600;
        }

        /* ── Table styles ── */
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        
        .admin-table thead th {
          text-align: left;
          padding: 14px 16px;
          background: var(--bg-secondary);
          font-weight: 600;
          color: var(--text-primary);
          border-bottom: 2px solid var(--border-color);
        }
        
        .admin-table tbody td {
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-secondary);
        }
        
        .student-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        /* ── Clickable rows ── */
        .row-clickable {
          cursor: pointer;
          transition: all 0.2s;
        }
        .row-clickable:hover { 
          background: var(--bg-secondary) !important; 
        }
        .row-active { 
          background: var(--primary-bg) !important;
          border-left: 3px solid var(--primary-main);
        }

        /* ── Badges ── */
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        .badge-success {
          background: #D1FAE5;
          color: #065F46;
        }
        .badge-warning {
          background: #FEF3C7;
          color: #92400E;
        }
        
        /* ── Bouton Voir ── */
        .btn-view {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--primary-main);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-view:hover {
          background: var(--primary-dark);
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }
        .btn-view:active {
          transform: translateY(0);
        }
        
        .empty-state {
          text-align: center;
          color: var(--text-muted);
          padding: 48px !important;
        }

        /* ── Alertes ── */
        .alert {
          padding: 14px 18px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 500;
        }
        .alert-success {
          background: #D1FAE5;
          color: #065F46;
          border: 1px solid #A7F3D0;
        }
        .alert-danger {
          background: #FEE2E2;
          color: #991B1B;
          border: 1px solid #FECACA;
        }
        
        .card {
          background: var(--bg-white);
          border-radius: 16px;
          padding: 24px;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border-color);
        }

        /* ── Overlay ── */
        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 100;
          animation: fadeIn 0.2s ease;
        }

        /* ── Drawer ── */
        .drawer {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: 520px;
          max-width: 95vw;
          background: var(--bg-white);
          border-left: 1px solid var(--border-color);
          z-index: 101;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-lg);
          animation: slideIn 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Drawer header ── */
        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
          background: var(--bg-white);
        }
        .drawer-header-left { 
          display: flex; 
          align-items: center; 
          gap: 16px; 
        }
        .drawer-avatar {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--primary-main), var(--primary-light));
          color: white;
          font-size: 20px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .drawer-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .drawer-close {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--bg-white);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          transition: all 0.2s;
        }
        .drawer-close:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border-color: var(--primary-main);
        }

        /* ── Badge pills ── */
        .badge-pill {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
          display: inline-block;
        }
        .badge-warning-pill {
          background: #FEF3C7;
          color: #92400E;
        }
        .badge-success-pill {
          background: #D1FAE5;
          color: #065F46;
        }

        /* ── Drawer body ── */
        .drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          background: var(--bg-white);
        }

        /* ── Meta grid ── */
        .drawer-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .meta-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 14px;
          background: var(--bg-secondary);
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }
        .meta-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: var(--primary-bg);
          color: var(--primary-main);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .meta-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 5px;
        }
        .meta-value {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.4;
          word-break: break-word;
        }

        /* ── Section ── */
        .drawer-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .drawer-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .drawer-section-title svg {
          color: var(--primary-main);
        }

        /* ── Description block ── */
        .description-block {
          background: var(--bg-secondary);
          border-left: 4px solid var(--primary-main);
          border-radius: 8px;
          padding: 18px 20px;
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-primary);
          white-space: pre-wrap;
          word-break: break-word;
          max-height: 280px;
          overflow-y: auto;
          border: 1px solid var(--border-color);
        }
        .description-block::-webkit-scrollbar {
          width: 6px;
        }
        .description-block::-webkit-scrollbar-track {
          background: var(--bg-secondary);
          border-radius: 3px;
        }
        .description-block::-webkit-scrollbar-thumb {
          background: var(--primary-light);
          border-radius: 3px;
        }
        .description-empty {
          font-size: 13px;
          color: var(--text-muted);
          font-style: italic;
          padding: 16px;
          background: var(--bg-secondary);
          border-radius: 8px;
          text-align: center;
        }

        /* ── Files list ── */
        .files-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .file-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: var(--bg-white);
          text-decoration: none;
          color: var(--text-primary);
          transition: all 0.2s;
        }
        .file-item:hover {
          background: var(--primary-bg);
          border-color: var(--primary-main);
          transform: translateX(4px);
        }
        .file-icon {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: var(--primary-bg);
          color: var(--primary-main);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .file-name {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }
        .file-arrow {
          color: var(--text-muted);
        }

        /* ── Footer avec deux boutons ── */
        .drawer-footer {
          padding: 20px 24px;
          border-top: 1px solid var(--border-color);
          flex-shrink: 0;
          background: var(--bg-white);
        }
        .footer-actions {
          display: flex;
          gap: 12px;
        }
        .btn-valider {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--success), var(--success-dark));
          color: white;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-valider:hover {
          opacity: 0.95;
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }
        .btn-rejeter {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--danger), var(--danger-dark));
          color: white;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-rejeter:hover {
          opacity: 0.95;
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }
        .btn-valider:active, .btn-rejeter:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}