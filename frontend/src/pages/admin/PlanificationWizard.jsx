import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'

/**
 * PlanificationWizard
 * Remplace les 2 boutons "Définir la période" et "Affecter les dates automatiquement"
 * par un seul bouton "Commencer" qui ouvre un wizard 2 étapes.
 */
export default function PlanificationWizard({ onDone }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1) // 1 = définir période, 2 = affecter dates
  const [periode, setPeriode] = useState(null)    // période existante chargée depuis le backend
  const [loading, setLoading] = useState(false)
  const [affectLoading, setAffectLoading] = useState(false)
  const [affectDone, setAffectDone] = useState(false)
  const [msg, setMsg] = useState(null) // { type: 'success'|'error', text }
  const [affectResult, setAffectResult] = useState(null)

  const [form, setForm] = useState({
    date_debut: '',
    date_fin: '',
    salles: ['Salle A101', 'Salle B203', 'Amphi 1'],
  })

  // Charger la période existante à l'ouverture
  useEffect(() => {
    if (!open) return
    setMsg(null)
    setAffectResult(null)
    setAffectDone(false)
    setStep(1)
    fetchPeriode()
  }, [open])

  // Supprimer les messages d'erreur/success quand on passe à l'étape 2
  useEffect(() => {
    if (step === 2) {
      setMsg(null)
    }
  }, [step])

  async function fetchPeriode() {
    try {
      const res = await adminAPI.getPeriode?.()
      if (res?.data) {
        const p = res.data
        setPeriode(p)
        setForm({
          date_debut: p.date_debut ? formatDateForInput(p.date_debut) : '',
          date_fin:   p.date_fin   ? formatDateForInput(p.date_fin)   : '',
          salles:     p.salles     || ['Salle A101', 'Salle B203', 'Amphi 1'],
        })
      } else {
        setPeriode(null)
        setForm({ date_debut: '', date_fin: '', salles: ['Salle A101', 'Salle B203', 'Amphi 1'] })
      }
    } catch {
      setPeriode(null)
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  async function handleDefinir() {
    if (!form.date_debut || !form.date_fin) {
      setMsg({ type: 'error', text: 'Veuillez renseigner les deux dates.' })
      return
    }

    if (form.date_fin < form.date_debut) {
      setMsg({ type: 'error', text: 'Veuillez entrer une période valide.' })
      return
    }

    setLoading(true)
    setMsg(null)
    try {
      await adminAPI.setPeriode(form)
      setMsg({ type: 'success', text: 'Période enregistrée avec succès.' })
      await fetchPeriode()
      setTimeout(() => {
        setMsg(null)
        setStep(2)
      }, 2000)
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Erreur lors de la définition de la période.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleAffecter() {
    setAffectLoading(true)
    setAffectDone(false)
    setMsg(null)
    setAffectResult(null)
    try {
      const res = await adminAPI.affecterDatesAuto()
      const d = res?.data
      setAffectResult(d)
      setMsg({ type: 'success', text: d?.message || 'Dates affectées avec succès.' })
      setAffectDone(true)
      if (onDone) onDone()
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || "Erreur lors de l'affectation des dates." })
    } finally {
      setAffectLoading(false)
    }
  }

  function handleSalleToggle(salle) {
    setForm(f => {
      const s = f.salles.includes(salle)
        ? f.salles.filter(x => x !== salle)
        : [...f.salles, salle]
      return { ...f, salles: s }
    })
  }

  const allSalles = ['Salle A101', 'Salle B203', 'Amphi 1']

  function formatDateForInput(dateStr) {
    if (!dateStr) return ''
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return ''
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch {
      return ''
    }
  }

  function formatDate(d) {
    if (!d) return '—'
    const [year, month, day] = d.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  // Vérifier si les dates ont été modifiées
  function hasDatesChanged() {
    if (!periode) return true
    const originalDebut = formatDateForInput(periode.date_debut)
    const originalFin = formatDateForInput(periode.date_fin)
    return form.date_debut !== originalDebut || form.date_fin !== originalFin
  }

  // Réinitialiser le formulaire avec les dates originales et passer à l'étape 2
  function handleContinuerSansModifier() {
    if (periode) {
      setForm({
        date_debut: periode.date_debut ? formatDateForInput(periode.date_debut) : '',
        date_fin: periode.date_fin ? formatDateForInput(periode.date_fin) : '',
        salles: periode.salles || ['Salle A101', 'Salle B203', 'Amphi 1'],
      })
    }
    setMsg(null)
    setAffectDone(false)
    setStep(2)
  }

  return (
    <>
      {/* ─── Bouton principal ─── */}
      <button className="btn-commencer" onClick={() => setOpen(true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Planification de dates
      </button>

      {/* ─── Overlay / Modal ─── */}
      {open && (
        <div className="wizard-overlay" onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="wizard-modal">

            {/* Header */}
            <div className="wizard-header">
              <div className="wizard-header-left">
                <div className="wizard-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div>
                  <h2 className="wizard-title">Planification des soutenances</h2>
                  <p className="wizard-subtitle">2 étapes pour organiser les dates</p>
                </div>
              </div>
              <button className="wizard-close" onClick={() => setOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Steps indicator */}
            <div className="wizard-steps">
              {[
                { n: 1, label: 'Définir la période' },
                { n: 2, label: 'Affecter les dates' },
              ].map(({ n, label }) => (
                <div
                  key={n}
                  className={`wizard-step ${step === n ? 'active' : ''} ${step > n ? 'done' : ''}`}
                  onClick={() => n < step && setStep(n)}
                  style={{ cursor: n < step ? 'pointer' : 'default' }}
                >
                  <div className="wizard-step-bubble">
                    {step > n
                      ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : n
                    }
                  </div>
                  <span className="wizard-step-label">{label}</span>
                </div>
              ))}
              <div className="wizard-step-connector" />
            </div>

            {/* Body */}
            <div className="wizard-body">

              {/* ── Étape 1 : Définir la période ── */}
              {step === 1 && (
                <div className="wizard-step-content">
                  {periode && (
                    <div className="periode-banner">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span>Période actuelle&nbsp;: <strong>{formatDate(formatDateForInput(periode.date_debut))}</strong> → <strong>{formatDate(formatDateForInput(periode.date_fin))}</strong>. Vous pouvez la modifier ci-dessous.</span>
                    </div>
                  )}

                  <div className="wizard-form-row">
                    <div className="wizard-field">
                      <label>Date début</label>
                      <input
                        type="date"
                        min={today}
                        value={form.date_debut}
                        onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))}
                      />
                    </div>
                    <div className="wizard-field">
                      <label>Date fin</label>
                      <input
                        type="date"
                        min={today}
                        value={form.date_fin}
                        onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="wizard-field">
                    <label>Salles disponibles</label>
                    <div className="salle-pills">
                      {allSalles.map(s => (
                        <button
                          key={s}
                          className={`salle-pill ${form.salles.includes(s) ? 'selected' : ''}`}
                          onClick={() => handleSalleToggle(s)}
                          type="button"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {msg && <div className={`wizard-msg ${msg.type}`}>{msg.text}</div>}

                  <div className="wizard-actions">
                    <button className="btn-secondary" onClick={() => setOpen(false)}>Annuler</button>
                    {periode ? (
                      <>
                        <button className="btn-secondary" onClick={handleContinuerSansModifier} style={{ marginRight: '8px' }}>
                          Continuer sans modifier
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }}>
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                          </svg>
                        </button>
                        <button className="btn-primary" onClick={handleDefinir} disabled={loading || !hasDatesChanged()}>
                          {loading ? 'Mise à jour…' : 'Mettre à jour et continuer'}
                          {!loading && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }}>
                              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                            </svg>
                          )}
                        </button>
                      </>
                    ) : (
                      <button className="btn-primary" onClick={handleDefinir} disabled={loading}>
                        {loading ? 'Enregistrement…' : 'Définir et continuer'}
                        {!loading && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Étape 2 : Affecter les dates ── */}
              {step === 2 && (
                <div className="wizard-step-content">
                  <div className="recap-card">
                    <div className="recap-row">
                      <span className="recap-label">Période définie</span>
                      <span className="recap-value">{formatDate(form.date_debut)} → {formatDate(form.date_fin)}</span>
                    </div>
                    <div className="recap-row">
                      <span className="recap-label">Salles</span>
                      <span className="recap-value">{form.salles.join(', ')}</span>
                    </div>
                  </div>

                  <p className="wizard-info-text">
                    Cette action va assigner automatiquement une date, une heure et une salle à chaque étudiant sans soutenance planifiée, en évitant les weekends et les créneaux déjà occupés.
                  </p>

                  {affectResult && (
                    <div className="affect-result-grid">
                      <div className="affect-result-card">
                        <span className="affect-result-val success">{affectResult.details?.etudiants_affectes ?? '—'}</span>
                        <span className="affect-result-label">Affectés</span>
                      </div>
                    </div>
                  )}

                  {msg && <div className={`wizard-msg ${msg.type}`}>{msg.text}</div>}

                  <div className="wizard-actions">
                    <button className="btn-secondary" onClick={() => setStep(1)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                      </svg>
                      Retour
                    </button>
                    <button className="btn-primary" onClick={handleAffecter} disabled={affectLoading || affectDone}>
                      {affectLoading ? 'Affectation en cours…' : (affectDone ? 'Affectation terminée' : 'Affecter les dates automatiquement')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Styles scoped ─── */}
      <style>{`
        .btn-commencer {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          background: #7c3aed;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s, transform 0.1s;
          box-shadow: 0 2px 8px rgba(124,58,237,0.25);
        }
        .btn-commencer:hover { background: #6d28d9; }
        .btn-commencer:active { transform: scale(0.97); }

        .wizard-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

        .wizard-modal {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-width: 560px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18);
          overflow: hidden;
          animation: slideUp 0.2s ease;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }

        .wizard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px;
          border-bottom: 1px solid #f0ecfb;
        }
        .wizard-header-left { display: flex; align-items: center; gap: 12px; }
        .wizard-icon {
          width: 40px; height: 40px;
          background: #f3f0ff;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: #7c3aed;
          flex-shrink: 0;
        }
        .wizard-title { margin: 0; font-size: 16px; font-weight: 700; color: #1a1a2e; }
        .wizard-subtitle { margin: 2px 0 0; font-size: 13px; color: #6b7280; }
        .wizard-close {
          background: none; border: none; cursor: pointer;
          color: #9ca3af; padding: 6px; border-radius: 8px;
          display: flex; align-items: center;
          transition: background 0.15s, color 0.15s;
        }
        .wizard-close:hover { background: #f3f4f6; color: #374151; }

        .wizard-steps {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 16px 24px 0;
          position: relative;
        }
        .wizard-step-connector {
          position: absolute;
          top: 28px;
          left: 56px;
          right: 56px;
          height: 2px;
          background: #e5e7eb;
          z-index: 0;
        }
        .wizard-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex: 1;
          position: relative;
          z-index: 1;
        }
        .wizard-step-bubble {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: #e5e7eb;
          color: #9ca3af;
          font-size: 13px;
          font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, color 0.2s;
        }
        .wizard-step.active .wizard-step-bubble {
          background: #7c3aed; color: #fff;
        }
        .wizard-step.done .wizard-step-bubble {
          background: #059669; color: #fff;
        }
        .wizard-step-label {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
          transition: color 0.2s;
          white-space: nowrap;
        }
        .wizard-step.active .wizard-step-label { color: #7c3aed; font-weight: 600; }
        .wizard-step.done .wizard-step-label { color: #059669; }

        .wizard-body { padding: 20px 24px 24px; }

        .wizard-step-content { display: flex; flex-direction: column; gap: 16px; }

        .periode-banner {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          color: #3730a3;
        }

        .wizard-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .wizard-field { display: flex; flex-direction: column; gap: 6px; }
        .wizard-field label { font-size: 13px; font-weight: 600; color: #374151; }
        .wizard-field input[type="date"] {
          padding: 9px 12px;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          color: #1a1a2e;
          background: #fafafa;
          outline: none;
          transition: border-color 0.15s;
        }
        .wizard-field input[type="date"]:focus { border-color: #7c3aed; background: #fff; }

        .salle-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px; }
        .salle-pill {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1.5px solid #e5e7eb;
          background: #fafafa;
          font-size: 13px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.15s;
          font-weight: 500;
        }
        .salle-pill:hover { border-color: #a78bfa; color: #7c3aed; }
        .salle-pill.selected { background: #f3f0ff; border-color: #7c3aed; color: #7c3aed; font-weight: 600; }

        .wizard-msg {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
        }
        .wizard-msg.success { background: #d1fae5; color: #065f46; }
        .wizard-msg.error   { background: #fee2e2; color: #991b1b; }

        .wizard-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 4px;
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          background: #7c3aed;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, opacity 0.15s;
        }
        .btn-primary:hover:not(:disabled) { background: #6d28d9; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: #f3f4f6;
          color: #374151;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-secondary:hover { background: #e5e7eb; }

        .recap-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .recap-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
        .recap-label { color: #6b7280; font-weight: 500; }
        .recap-value { color: #1a1a2e; font-weight: 600; text-align: right; }

        .wizard-info-text {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }

        .affect-result-grid {
          display: flex;
          justify-content: center;
        }
        .affect-result-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 120px;
        }
        .affect-result-val {
          font-size: 32px;
          font-weight: 800;
        }
        .affect-result-val.success { color: #059669; }
        .affect-result-val.warn    { color: #d97706; }
        .affect-result-label { font-size: 13px; color: #6b7280; font-weight: 500; }
      `}</style>
    </>
  )
}
