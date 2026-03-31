import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  ChevronRight,
  Award,
  Zap,
  BarChart2,
  Star,
} from 'lucide-react';

/* ─── Animated counter hook ─── */
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (target === 0 || started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

/* ─── Animated progress bar ─── */
function ProgressBar({ value, color = '#7c3aed', height = 8, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div style={{
      height, background: '#f0edf8', borderRadius: 99, overflow: 'hidden'
    }}>
      <div style={{
        height: '100%', width: `${width}%`, background: color,
        borderRadius: 99, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  );
}

/* ─── Stat card ─── */
function StatCard({ icon: Icon, value, label, color, sub, delay = 0 }) {
  const animated = useCountUp(value, 900);
  return (
    <div className="stat-card" style={{
      '--card-accent': color,
      animation: `fadeSlideUp 0.5s ease both`,
      animationDelay: `${delay}ms`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} strokeWidth={2} />
        </div>
        {sub !== undefined && (
          <span style={{
            fontSize: 11, fontWeight: 600, color, background: `${color}15`,
            padding: '2px 8px', borderRadius: 99,
          }}>{sub}</span>
        )}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1.1, marginBottom: 4 }}>
        {animated}
      </div>
      <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

/* ─── Timeline item ─── */
function TimelineItem({ soutenance, index }) {
  const date = new Date(soutenance.date_soutenance);
  const isToday = date.toDateString() === new Date().toDateString();
  const isSoon = (date - new Date()) < 1000 * 60 * 60 * 24 * 2;

  return (
    <div style={{
      display: 'flex', gap: 14, padding: '12px 0',
      borderBottom: '1px solid #f0edf8',
      animation: `fadeSlideUp 0.4s ease both`,
      animationDelay: `${index * 60}ms`,
    }}>
      {/* Date badge */}
      <div style={{
        flexShrink: 0, width: 48, height: 56, borderRadius: 12,
        background: isToday ? '#7c3aed' : '#f5f3ff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: isToday ? 'white' : '#7c3aed', lineHeight: 1 }}>
          {date.getDate()}
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: isToday ? '#ddd6fe' : '#9d5eff', textTransform: 'uppercase' }}>
          {date.toLocaleDateString('fr-FR', { month: 'short' })}
        </div>
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1033' }}>
            {soutenance.prenom} {soutenance.nom}
          </span>
          {isToday && (
            <span style={{
              fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#d97706',
              padding: '1px 6px', borderRadius: 99,
            }}>Aujourd'hui</span>
          )}
          {isSoon && !isToday && (
            <span style={{
              fontSize: 10, fontWeight: 700, background: '#fee2e2', color: '#dc2626',
              padding: '1px 6px', borderRadius: 99,
            }}>Bientôt</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {soutenance.sujet || 'Sujet non défini'}
        </div>
        <div style={{ fontSize: 11, color: '#9d5eff', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} />
          {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          {soutenance.salle && ` · Salle ${soutenance.salle}`}
        </div>
      </div>
      {/* Action */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <Link
          to={`/jury/evaluations`}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
            background: soutenance.ma_note !== null ? '#f0fdf4' : '#f5f3ff',
            color: soutenance.ma_note !== null ? '#10b981' : '#7c3aed',
            borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: `1px solid ${soutenance.ma_note !== null ? '#d1fae5' : '#e8e0ff'}`,
            textDecoration: 'none', transition: 'all 0.15s',
          }}
        >
          {soutenance.ma_note !== null
            ? <><CheckCircle size={13} /> Noté</>
            : <><Star size={13} /> Évaluer</>
          }
        </Link>
      </div>
    </div>
  );
}

/* ─── Main dashboard ─── */
export default function JuryDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [soutenancesRecentes, setSoutenancesRecentes] = useState([]);
  const [urgentes, setUrgentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Bonjour');
    else if (h < 18) setGreeting('Bon après-midi');
    else setGreeting('Bonsoir');
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/jury/soutenances');
      const soutenances = res.data;
      const now = new Date();
      const aujourd_hui = now.toDateString();

      const totalAssignees = soutenances.length;
      const evaluees = soutenances.filter(s => s.ma_note !== null && s.ma_note !== undefined).length;
      const enAttenteNote = soutenances.filter(s => s.statut === 'planifiee' && (!s.ma_note || s.ma_note === null)).length;
      const aVenir = soutenances.filter(s => new Date(s.date_soutenance) > now && !s.ma_note).length;
      const aujourdhuiCount = soutenances.filter(s => new Date(s.date_soutenance).toDateString() === aujourd_hui).length;
      const avecRemarques = soutenances.filter(s => s.mes_remarques && s.mes_remarques.trim() !== '').length;
      const notesMoyenne = evaluees > 0
        ? (soutenances.filter(s => s.ma_note).reduce((acc, s) => acc + parseFloat(s.ma_note), 0) / evaluees).toFixed(1)
        : null;

      setStats({
        totalAssignees, evaluees, enAttenteNote, aVenir,
        aujourdhuiCount, avecRemarques, notesMoyenne,
        tauxEvaluation: totalAssignees > 0 ? Math.round((evaluees / totalAssignees) * 100) : 0,
        tauxRemarques: totalAssignees > 0 ? Math.round((avecRemarques / totalAssignees) * 100) : 0,
      });

      const prochaines = soutenances
        .filter(s => s.date_soutenance && new Date(s.date_soutenance) >= now)
        .sort((a, b) => new Date(a.date_soutenance) - new Date(b.date_soutenance))
        .slice(0, 6);
      setSoutenancesRecentes(prochaines);

      // Soutenances urgentes = dans les 48h sans note
      const urg = soutenances.filter(s => {
        const d = new Date(s.date_soutenance);
        return d > now && (d - now) < 1000 * 60 * 60 * 48 && !s.ma_note;
      });
      setUrgentes(urg);

    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, flexDirection: 'column', gap: 12 }}>
      <div className="spinner" />
      <span style={{ color: '#9d5eff', fontSize: 14 }}>Chargement du tableau de bord…</span>
    </div>
  );
  if (error) return <div className="alert alert-danger">{error}</div>;

  const pct = stats?.tauxEvaluation ?? 0;

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dash-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,58,237,0.12) !important; }
        .action-btn:hover { filter: brightness(0.93); transform: translateY(-1px); }
        .section-card { animation: fadeSlideUp 0.5s ease both; }
      `}</style>

      <div>
        {/* ── Header ── */}
        <div className="page-header" style={{ paddingBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1033', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#9d5eff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={20} color="white" />
              </div>
              {greeting}, {user?.prenom} 👋
            </h1>
            <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/jury" className="btn btn-outline" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={15} /> Planning
            </Link>
            {stats?.enAttenteNote > 0 && (
              <Link to="/jury/evaluations" className="btn btn-primary" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={15} /> Évaluer ({stats.enAttenteNote})
              </Link>
            )}
          </div>
        </div>

        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Alerte urgence ── */}
          {urgentes.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg,#fff7ed,#fef3c7)', border: '1px solid #fde68a',
              borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center',
              gap: 12, animation: 'fadeSlideUp 0.35s ease both',
            }}>
              <AlertCircle size={20} color="#d97706" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e' }}>
                  {urgentes.length} soutenance{urgentes.length > 1 ? 's' : ''} dans les 48h sans évaluation
                </div>
                <div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>
                  {urgentes.map(u => `${u.prenom} ${u.nom}`).join(' · ')}
                </div>
              </div>
              <Link to="/jury/evaluations" style={{
                fontSize: 12, fontWeight: 700, color: '#d97706',
                background: 'white', border: '1px solid #fde68a',
                padding: '6px 12px', borderRadius: 8, textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                Évaluer maintenant →
              </Link>
            </div>
          )}

          {/* ── Stat cards ── */}
          <div className="stats-grid">
            <div className="stat-card dash-stat-card" style={{ transition: 'all 0.2s', animation: 'fadeSlideUp 0.4s ease both', animationDelay: '0ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={20} color="#7c3aed" />
                </div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#7c3aed', lineHeight: 1.1, marginBottom: 4 }}>{stats?.totalAssignees}</div>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Soutenances assignées</div>
            </div>

            <div className="stat-card dash-stat-card" style={{ transition: 'all 0.2s', animation: 'fadeSlideUp 0.4s ease both', animationDelay: '60ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={20} color="#10b981" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#d1fae5', color: '#10b981', padding: '2px 8px', borderRadius: 99 }}>
                  {stats?.tauxEvaluation}%
                </span>
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#10b981', lineHeight: 1.1, marginBottom: 4 }}>{stats?.evaluees}</div>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Évaluations terminées</div>
            </div>

            <div className="stat-card dash-stat-card" style={{ transition: 'all 0.2s', animation: 'fadeSlideUp 0.4s ease both', animationDelay: '120ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={20} color="#f59e0b" />
                </div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#f59e0b', lineHeight: 1.1, marginBottom: 4 }}>{stats?.enAttenteNote}</div>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>En attente de note</div>
            </div>

            <div className="stat-card dash-stat-card" style={{ transition: 'all 0.2s', animation: 'fadeSlideUp 0.4s ease both', animationDelay: '180ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={20} color="#3b82f6" />
                </div>
                {stats?.aujourdhuiCount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 99 }}>
                    Aujourd'hui
                  </span>
                )}
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#3b82f6', lineHeight: 1.1, marginBottom: 4 }}>{stats?.aVenir}</div>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>À venir</div>
            </div>

            <div className="stat-card dash-stat-card" style={{ transition: 'all 0.2s', animation: 'fadeSlideUp 0.4s ease both', animationDelay: '240ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} color="#8b5cf6" />
                </div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#8b5cf6', lineHeight: 1.1, marginBottom: 4 }}>{stats?.avecRemarques}</div>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Avec remarques</div>
            </div>

            <div className="stat-card dash-stat-card" style={{ transition: 'all 0.2s', animation: 'fadeSlideUp 0.4s ease both', animationDelay: '300ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={20} color="#10b981" />
                </div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#10b981', lineHeight: 1.1, marginBottom: 4 }}>
                {stats?.notesMoyenne ?? '—'}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Note moyenne /20</div>
            </div>
          </div>

          {/* ── Barres de progression ── */}
          <div className="card section-card" style={{ animationDelay: '200ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="icon-squircle"><BarChart2 size={18} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1033' }}>Avancement des évaluations</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Vue d'ensemble de votre progression</div>
                </div>
              </div>
              <div style={{
                fontSize: 28, fontWeight: 800, color: pct === 100 ? '#10b981' : '#7c3aed',
              }}>
                {pct}%
              </div>
            </div>

            {/* Barre principale */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Évaluations complétées</span>
                <span style={{ fontSize: 13, color: '#6b7280' }}>{stats?.evaluees} / {stats?.totalAssignees}</span>
              </div>
              <ProgressBar
                value={pct}
                color={pct === 100 ? '#10b981' : 'linear-gradient(90deg,#7c3aed,#9d5eff)'}
                height={10}
              />
            </div>

            {/* Barres secondaires */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>En attente de note</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{stats?.enAttenteNote}</span>
                </div>
                <ProgressBar
                  value={stats?.totalAssignees > 0 ? Math.round((stats.enAttenteNote / stats.totalAssignees) * 100) : 0}
                  color="#f59e0b" height={6} delay={100}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Soutenances à venir</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>{stats?.aVenir}</span>
                </div>
                <ProgressBar
                  value={stats?.totalAssignees > 0 ? Math.round((stats.aVenir / stats.totalAssignees) * 100) : 0}
                  color="#3b82f6" height={6} delay={200}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Avec remarques</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6' }}>{stats?.avecRemarques}</span>
                </div>
                <ProgressBar
                  value={stats?.tauxRemarques}
                  color="#8b5cf6" height={6} delay={300}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Aujourd'hui</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>{stats?.aujourdhuiCount}</span>
                </div>
                <ProgressBar
                  value={stats?.totalAssignees > 0 ? Math.round((stats.aujourdhuiCount / stats.totalAssignees) * 100) : 0}
                  color="#10b981" height={6} delay={400}
                />
              </div>
            </div>

            {/* Badge de félicitation */}
            {pct === 100 && (
              <div style={{
                marginTop: 16, padding: '10px 14px', background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)',
                borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 20 }}>🎉</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#065f46' }}>Toutes les évaluations sont terminées !</div>
                  <div style={{ fontSize: 12, color: '#047857' }}>Excellent travail, vous êtes à jour.</div>
                </div>
              </div>
            )}
          </div>

          {/* ── Prochaines soutenances ── */}
          <div className="card section-card" style={{ animationDelay: '280ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="icon-squircle"><Calendar size={18} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1033' }}>Prochaines soutenances</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Vos 6 prochaines évaluations</div>
                </div>
              </div>
              <Link to="/jury" style={{
                fontSize: 12, fontWeight: 600, color: '#7c3aed',
                display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none',
              }}>
                Voir tout <ChevronRight size={14} />
              </Link>
            </div>

            {soutenancesRecentes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                <Calendar size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                <div style={{ fontSize: 14 }}>Aucune soutenance à venir</div>
              </div>
            ) : (
              soutenancesRecentes.map((s, i) => (
                <TimelineItem key={s.id} soutenance={s} index={i} />
              ))
            )}
          </div>

          {/* ── Actions rapides ── */}
          <div className="card section-card" style={{ animationDelay: '360ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div className="icon-squircle"><Zap size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1033' }}>Actions rapides</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Accès direct aux fonctions essentielles</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/jury" className="btn btn-outline action-btn" style={{ transition: 'all 0.15s', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={15} /> Mon planning
              </Link>
              <Link to="/jury/evaluations" className="btn btn-outline action-btn" style={{ transition: 'all 0.15s', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={15} /> Toutes les évaluations
              </Link>
              {stats?.aujourdhuiCount > 0 && (
                <Link to="/jury/evaluations" className="btn btn-primary action-btn" style={{ transition: 'all 0.15s', fontSize: 13, background: '#10b981', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={15} /> Évaluations du jour ({stats.aujourdhuiCount})
                </Link>
              )}
              {stats?.enAttenteNote > 0 && (
                <Link to="/jury/evaluations" className="btn btn-primary action-btn" style={{ transition: 'all 0.15s', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={15} /> En attente ({stats.enAttenteNote})
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}