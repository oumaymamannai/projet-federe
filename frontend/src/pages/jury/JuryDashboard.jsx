import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Award,
  BarChart2,
  Star,
  ChevronRight,
} from 'lucide-react';

/* ─── Animated progress bar ─── */
function ProgressBar({ value, color = '#7c3aed', height = 8, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 120 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div style={{ height, background: '#f0edf8', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${width}%`, background: color,
        borderRadius: 99, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  );
}

/* ─── Animated counter ─── */
function useCountUp(target, duration = 800) {
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

/* ─── Stat card ─── */
function StatCard({ icon: Icon, value, label, color, badge, delay = 0 }) {
  const animated = useCountUp(value, 800);
  return (
    <div className="stat-card" style={{
      transition: 'all 0.2s',
      animation: 'fadeSlideUp 0.4s ease both',
      animationDelay: `${delay}ms`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} strokeWidth={2} />
        </div>
        {badge && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            background: badge.bg, color: badge.color,
            padding: '2px 8px', borderRadius: 99,
          }}>{badge.label}</span>
        )}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1, marginBottom: 5 }}>
        {animated}
      </div>
      <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

/* ─── Timeline item ─── */
function TimelineItem({ soutenance, index }) {
  const date    = new Date(soutenance.date_soutenance);
  const isToday = date.toDateString() === new Date().toDateString();
  const isSoon  = !isToday && (date - new Date()) < 1000 * 60 * 60 * 48;
  const deja_note = soutenance.ma_note !== null && soutenance.ma_note !== undefined;

  /* Sujet vide ou valeur brute d'1 caractère → fallback lisible en italique gris */
  const sujet = soutenance.sujet && soutenance.sujet.trim().length > 1
    ? soutenance.sujet
    : null;

  return (
    <div style={{
      display: 'flex', gap: 14, padding: '12px 0',
      borderBottom: '1px solid #f0edf8',
      animation: 'fadeSlideUp 0.4s ease both',
      animationDelay: `${index * 55}ms`,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1033' }}>
            {soutenance.prenom} {soutenance.nom}
          </span>
          {isToday && (
            <span style={{ fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#d97706', padding: '1px 6px', borderRadius: 99 }}>
              Aujourd'hui
            </span>
          )}
          {isSoon && (
            <span style={{ fontSize: 10, fontWeight: 700, background: '#fee2e2', color: '#dc2626', padding: '1px 6px', borderRadius: 99 }}>
              Bientôt
            </span>
          )}
        </div>

        {/* Sujet : fallback explicite si vide */}
        <div style={{
          fontSize: 12,
          color: sujet ? '#6b7280' : '#d1d5db',
          fontStyle: sujet ? 'normal' : 'italic',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {sujet ?? 'Sujet non renseigné'}
        </div>

        <div style={{ fontSize: 11, color: '#9d5eff', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} />
          {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          {soutenance.salle && ` · Salle ${soutenance.salle}`}
        </div>
      </div>

      {/* Bouton action */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <Link
          to="/jury"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 12px', borderRadius: 8,
            fontSize: 12, fontWeight: 600, textDecoration: 'none',
            transition: 'all 0.15s',
            background: deja_note ? '#f0fdf4' : '#f5f3ff',
            color:      deja_note ? '#10b981' : '#7c3aed',
            border: `1px solid ${deja_note ? '#d1fae5' : '#e8e0ff'}`,
          }}
        >
          {deja_note
            ? <><CheckCircle size={13} /> Noté</>
            : <><Star size={13} /> Évaluer</>
          }
        </Link>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Dashboard principal
══════════════════════════════════════════ */
export default function JuryDashboard() {
  const { user } = useAuth();
  const [stats, setStats]                             = useState(null);
  const [soutenancesRecentes, setSoutenancesRecentes] = useState([]);
  const [urgentes, setUrgentes]                       = useState([]);
  const [loading, setLoading]                         = useState(true);
  const [error, setError]                             = useState('');
  const [greeting, setGreeting]                       = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir');
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res         = await api.get('/jury/soutenances');
      const soutenances = res.data;
      const now         = new Date();

      const totalAssignees  = soutenances.length;
      const evaluees        = soutenances.filter(s => s.ma_note !== null && s.ma_note !== undefined).length;
      const enAttenteNote   = soutenances.filter(s => !s.ma_note).length;
      const aujourdhuiCount = soutenances.filter(
        s => new Date(s.date_soutenance).toDateString() === now.toDateString()
      ).length;

      setStats({
        totalAssignees, evaluees, enAttenteNote, aujourdhuiCount,
        tauxEvaluation: totalAssignees > 0 ? Math.round((evaluees / totalAssignees) * 100) : 0,
      });

      /* 3 prochaines uniquement — règle mémoire court terme (7±2) */
      setSoutenancesRecentes(
        soutenances
          .filter(s => s.date_soutenance && new Date(s.date_soutenance) >= now)
          .sort((a, b) => new Date(a.date_soutenance) - new Date(b.date_soutenance))
          .slice(0, 3)
      );

      /* Urgentes : < 48 h, sans note */
      setUrgentes(
        soutenances.filter(s => {
          const d = new Date(s.date_soutenance);
          return d > now && (d - now) < 1000 * 60 * 60 * 48 && !s.ma_note;
        })
      );
    } catch {
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

  const pct     = stats?.tauxEvaluation ?? 0;
  const termine = pct === 100;

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,58,237,0.10) !important; }
        .section-card { animation: fadeSlideUp 0.5s ease both; }
      `}</style>

      <div>
        {/* ══ Header ══ */}
        <div className="page-header" style={{ paddingBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1033', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg,#7c3aed,#9d5eff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Award size={20} color="white" />
              </div>
              {greeting}, {user?.prenom} 
            </h1>
            <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ══ Alerte urgence ══ */}
          {urgentes.length > 0 && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: 14, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 12,
              animation: 'fadeSlideUp 0.3s ease both',
            }}>
              <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e' }}>
                  {urgentes.length} soutenance{urgentes.length > 1 ? 's' : ''} dans les 48 h sans évaluation
                </div>
                <div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>
                  {urgentes.map(u => `${u.prenom} ${u.nom}`).join(' · ')}
                </div>
              </div>
              <Link to="/jury" style={{
                fontSize: 12, fontWeight: 700, color: '#d97706',
                background: 'white', border: '1px solid #fde68a',
                padding: '6px 14px', borderRadius: 8,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                Évaluer maintenant →
              </Link>
            </div>
          )}

          {/* ══ 3 stat cards ══
              Assignées · Évaluées · En attente
              "À venir" et "Avec remarques" supprimés : redondants ou non actionnables.
              "Aujourd'hui" intégré comme badge sur la carte "En attente".          */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <StatCard
              icon={Users}
              value={stats?.totalAssignees ?? 0}
              label="Soutenances assignées"
              color="#7c3aed"
              delay={0}
            />
            <StatCard
              icon={CheckCircle}
              value={stats?.evaluees ?? 0}
              label="Évaluations terminées"
              color="#10b981"
              badge={{ label: `${pct} %`, bg: '#d1fae5', color: '#059669' }}
              delay={60}
            />
            <StatCard
              icon={Clock}
              value={stats?.enAttenteNote ?? 0}
              label="En attente de note"
              color={stats?.enAttenteNote > 0 ? '#f59e0b' : '#9ca3af'}
              badge={
                stats?.enAttenteNote > 0 && stats?.aujourdhuiCount > 0
                  ? { label: `${stats.aujourdhuiCount} aujourd'hui`, bg: '#fee2e2', color: '#dc2626' }
                  : undefined
              }
              delay={120}
            />
          </div>

          {/* ══ 1 seule barre de progression ══
              Les 4 barres secondaires ont été supprimées car :
              - "En attente" pleine à 100 % = barre pleine = signal de succès
                dans toute convention UX, mais ici c'est l'inverse voulu.
              - Redondance directe avec les 3 stat cards ci-dessus.          */}
          <div className="card section-card" style={{ animationDelay: '180ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="icon-squircle"><BarChart2 size={18} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1033' }}>Avancement des évaluations</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    {stats?.evaluees} évaluation{stats?.evaluees !== 1 ? 's' : ''} complétée{stats?.evaluees !== 1 ? 's' : ''} sur {stats?.totalAssignees}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: termine ? '#10b981' : '#7c3aed' }}>
                {pct} %
              </div>
            </div>

            <ProgressBar value={pct} color={termine ? '#10b981' : '#7c3aed'} height={12} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={13} />
                {stats?.evaluees} évaluée{stats?.evaluees !== 1 ? 's' : ''}
              </span>
              {stats?.enAttenteNote > 0 && (
                <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} />
                  {stats.enAttenteNote} en attente
                </span>
              )}
            </div>

            {/* Félicitations */}
            {termine && (
              <div style={{
                marginTop: 16, padding: '10px 14px',
                background: '#f0fdf4', border: '1px solid #d1fae5',
                borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 18 }}>🎉</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#065f46' }}>Toutes les évaluations sont terminées !</div>
                  <div style={{ fontSize: 12, color: '#047857' }}>Excellent travail, vous êtes à jour.</div>
                </div>
              </div>
            )}
          </div>

          {/* ══ Prochaines soutenances — 3 max ══
              Réduit de 6 à 3 : au-delà, l'utilisateur consulte la page Planning.
              Sujet vide remplacé par "Sujet non renseigné" (italique gris clair). */}
          <div className="card section-card" style={{ animationDelay: '260ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="icon-squircle"><Calendar size={18} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1033' }}>Prochaines soutenances</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Les prochaines soutenances à évaluer</div>
                </div>
              </div>
              <Link to="/jury" style={{
                fontSize: 12, fontWeight: 600, color: '#7c3aed',
                display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none',
              }}>
                Voir le planning <ChevronRight size={14} />
              </Link>
            </div>

            {soutenancesRecentes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                <Calendar size={36} style={{ opacity: 0.25, display: 'block', margin: '0 auto 10px' }} />
                <div style={{ fontSize: 14 }}>Aucune soutenance à venir</div>
              </div>
            ) : (
              soutenancesRecentes.map((s, i) => (
                <TimelineItem key={s.id} soutenance={s} index={i} />
              ))
            )}
          </div>

        </div>
      </div>
    </>
  );
}