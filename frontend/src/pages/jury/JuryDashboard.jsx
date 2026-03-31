import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  BarChart3,
  Users,
  FileText
} from 'lucide-react';

export default function JuryDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [soutenancesRecentes, setSoutenancesRecentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Récupérer toutes les soutenances du jury
      const res = await api.get('/jury/soutenances');
      const soutenances = res.data;
      
      // Calculer les statistiques
      const aujourdhui = new Date().toDateString();
      const totalAssignees = soutenances.length;
      const evaluees = soutenances.filter(s => s.ma_note !== null && s.ma_note !== undefined).length;
      const enAttenteNote = soutenances.filter(s => s.statut === 'planifiee' && (!s.ma_note || s.ma_note === null)).length;
      const aVenir = soutenances.filter(s => {
        const dateSoutenance = new Date(s.date_soutenance);
        return dateSoutenance > new Date() && (!s.ma_note || s.ma_note === null);
      }).length;
      const aujourdhuiCount = soutenances.filter(s => {
        const dateSoutenance = new Date(s.date_soutenance);
        return dateSoutenance.toDateString() === aujourdhui;
      }).length;
      const avecRemarques = soutenances.filter(s => s.mes_remarques && s.mes_remarques.trim() !== '').length;
      
      setStats({
        totalAssignees,
        evaluees,
        enAttenteNote,
        aVenir,
        aujourdhuiCount,
        avecRemarques,
        tauxEvaluation: totalAssignees > 0 ? Math.round((evaluees / totalAssignees) * 100) : 0
      });
      
      // Récupérer les 5 prochaines soutenances
      const prochaines = soutenances
        .filter(s => s.date_soutenance && new Date(s.date_soutenance) >= new Date())
        .sort((a, b) => new Date(a.date_soutenance) - new Date(b.date_soutenance))
        .slice(0, 5);
      setSoutenancesRecentes(prochaines);
      
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="spinner" />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>👨‍⚖️ Tableau de bord Jury</h1>
          <p>Bienvenue, {user?.prenom} {user?.nom}. Voici un récapitulatif de vos évaluations.</p>
        </div>
      </div>

      <div className="page-content">
        {/* Statistiques */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon">🎓</div>
            <div className="stat-value" style={{ color: '#7c3aed' }}>{stats?.totalAssignees || 0}</div>
            <div className="stat-label">Soutenances assignées</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value" style={{ color: '#10b981' }}>{stats?.evaluees || 0}</div>
            <div className="stat-label">Évaluations terminées</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{stats?.enAttenteNote || 0}</div>
            <div className="stat-label">En attente de note</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-value" style={{ color: '#3b82f6' }}>{stats?.aujourdhuiCount || 0}</div>
            <div className="stat-label">À évaluer aujourd'hui</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-value" style={{ color: '#8b5cf6' }}>{stats?.avecRemarques || 0}</div>
            <div className="stat-label">Avec remarques</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-value" style={{ color: '#10b981' }}>{stats?.tauxEvaluation || 0}%</div>
            <div className="stat-label">Taux d'évaluation</div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span className="card-title">📊 Progression des évaluations</span>
            <span style={{ fontSize: 14, color: '#6b7280' }}>
              {stats?.evaluees}/{stats?.totalAssignees} évaluations complétées
            </span>
          </div>
          <div className="card-body">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${stats?.tauxEvaluation || 0}%`, 
                  background: 'linear-gradient(90deg, #7c3aed, #9d5eff)'
                }} 
              />
            </div>
          </div>
        </div>

        {/* Prochaines soutenances */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span className="card-title">📅 Prochaines soutenances</span>
            <a href="/jury" className="btn btn-outline btn-sm">Voir tout →</a>
          </div>
          <div className="card-body">
            {soutenancesRecentes.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: 24 }}>
                Aucune soutenance à venir
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {soutenancesRecentes.map(s => (
                  <div key={s.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: '#f9fafb',
                    borderRadius: 12,
                    border: '1px solid #e5e7eb'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.prenom} {s.nom}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{s.sujet || 'Sujet non défini'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>
                        {new Date(s.date_soutenance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {new Date(s.date_soutenance).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <a href={`/jury/evaluations`} className="btn btn-primary btn-sm">
                      Évaluer
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">⚡ Actions rapides</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="/jury" className="btn btn-primary">
                📅 Voir mon planning
              </a>
              {stats?.aujourdhuiCount > 0 && (
                <a href="/jury/evaluations" className="btn btn-success" style={{ background: '#10b981' }}>
                  ✅ Évaluer les soutenances du jour ({stats.aujourdhuiCount})
                </a>
              )}
              {stats?.enAttenteNote > 0 && (
                <a href="/jury/evaluations" className="btn btn-outline">
                  📝 Compléter les évaluations en attente ({stats.enAttenteNote})
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}