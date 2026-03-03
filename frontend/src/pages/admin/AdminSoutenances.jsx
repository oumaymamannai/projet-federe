import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'

const statusBadge = (s) => {
  const map = { en_attente: 'En attente', planifiee: 'Planifiée', terminee: 'Terminée', annulee: 'Annulée' }
  return <span className={`badge badge-${s.replace('_', '-')}`}>{map[s] || s}</span>
}

export default function AdminSoutenances() {
  const [soutenances, setSoutenances] = useState([])
  const [jurys, setJurys] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [juryForm, setJuryForm] = useState({ encadreur_id: '', president_id: '', membre3_id: '' })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    Promise.all([adminAPI.getSoutenances(), adminAPI.getUsers('jury')])
      .then(([s, j]) => {
        setSoutenances(s.data.data || [])
        setJurys(j.data.data || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const openModal = (s) => {
    setSelected(s)
    setJuryForm({
      encadreur_id: s.encadreur_id || '',
      president_id: s.president_id || '',
      membre3_id: s.membre3_id || '',
    })
  }

  const handleAffecterJury = async (e) => {
    e.preventDefault()
    try {
      // Envoyer seulement président et 3ème membre
      await adminAPI.affecterJury(selected.id, {
        president_id: juryForm.president_id,
        membre3_id: juryForm.membre3_id
      })
      toast.success('Jury affecté avec succès.')
      setSelected(null)
      const res = await adminAPI.getSoutenances()
      setSoutenances(res.data.data || [])
    } catch {
      toast.error('Erreur lors de l\'affectation.')
    }
  }

  const handleEnvoyerResultats = async (id) => {
    if (!confirm('Envoyer les résultats par email à cet étudiant ?')) return
    try {
      await adminAPI.envoyerResultats(id)
      toast.success('Résultats envoyés par email.')
      const res = await adminAPI.getSoutenances()
      setSoutenances(res.data.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur envoi résultats.')
    }
  }

  const filtered = soutenances.filter(s => {
    const matchSearch = !search || `${s.etudiant_nom} ${s.etudiant_prenom} ${s.etudiant_email}`.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || s.statut === filter
    return matchSearch && matchFilter
  })

  const encadreurs = jurys.filter(j => j.jury_type === 'encadreur')
  const presidents = jurys.filter(j => j.jury_type === 'president')
  const membres3 = jurys.filter(j => j.jury_type === '3eme_membre')

  if (loading) return <div className="loading-center"><div className="loading-spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <h1>Gestion des Soutenances</h1>
        <p>Affecter les jurys, gérer les statuts et envoyer les résultats</p>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="form-control"
          placeholder="🔍 Rechercher un étudiant..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />
        <div className="tabs" style={{ marginBottom: 0 }}>
          {[['all', 'Tous'], ['en_attente', 'En attente'], ['planifiee', 'Planifiées'], ['terminee', 'Terminées']].map(([v, l]) => (
            <div key={v} className={`tab ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Date & Heure</th>
                <th>Salle</th>
                <th>Jury</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.etudiant_prenom} {s.etudiant_nom}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{s.etudiant_email}</div>
                  </td>
                  <td>
                    {s.date_soutenance ? (
                      <>
                        <div style={{ fontWeight: 500 }}>{new Date(s.date_soutenance).toLocaleDateString('fr-DZ')}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{s.heure_soutenance?.slice(0, 5)}</div>
                      </>
                    ) : <span style={{ color: 'var(--gray-400)' }}>—</span>}
                  </td>
                  <td>{s.salle || <span style={{ color: 'var(--gray-400)' }}>—</span>}</td>
                  <td>
                    <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                      {s.president_nom ? <div>👑 {s.president_prenom} {s.president_nom}</div> : null}
                      {s.encadreur_nom ? <div>📚 {s.encadreur_prenom} {s.encadreur_nom}</div> : null}
                      {s.membre3_nom ? <div>⚖️ {s.membre3_prenom} {s.membre3_nom}</div> : null}
                      {!s.president_nom && !s.encadreur_nom && <span style={{ color: 'var(--gray-400)' }}>Non affecté</span>}
                    </div>
                  </td>
                  <td>{statusBadge(s.statut)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openModal(s)}>✏️ Jury</button>
                      {s.statut !== 'terminee' && (
                        <button className="btn btn-sm" style={{ background: 'var(--success)', color: 'white' }} onClick={() => handleEnvoyerResultats(s.id)}>
                          📧 Résultats
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">🎓</div><h3>Aucune soutenance trouvée</h3></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal affecter jury */}
{/* Modal affecter jury */}
{selected && (
  <div className="modal-overlay">
    <div className="modal">
      <h3>👥 Affecter le jury</h3>
      <p className="sub">Soutenance de {selected.etudiant_prenom} {selected.etudiant_nom}</p>
      
      {/* Président */}
      <div className="form-group">
        <label className="form-label">Président</label>
        <select 
          className="form-control" 
          value={juryForm.president_id} 
          onChange={e => setJuryForm({...juryForm, president_id: e.target.value})}
        >
          <option value="">— Choisir —</option>
          {presidents
            .filter(j => j.id !== selected.encadreur_id)
            .map(j => (
              <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>
            ))}
        </select>
      </div>

      {/* 3ème Membre */}
      <div className="form-group">
        <label className="form-label">3ème Membre</label>
        <select 
          className="form-control" 
          value={juryForm.membre3_id} 
          onChange={e => setJuryForm({...juryForm, membre3_id: e.target.value})}
        >
          <option value="">— Choisir —</option>
          {membres3
            .filter(j => j.id !== selected.encadreur_id && j.id !== juryForm.president_id)
            .map(j => (
              <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>
            ))}
        </select>
      </div>

      {/* Encadreur (figé) */}
      <div className="form-group">
        <label className="form-label">Encadreur (figé)</label>
        <input
          className="form-control"
          value={selected.encadreur_prenom || selected.encadreur_prenom === 0 ? `${selected.encadreur_prenom || ''} ${selected.encadreur_nom || ''}`.trim() : (selected.encadreur_nom || '')}
          disabled
          readOnly
        />
      </div>

      <div className="modal-actions">
        <button className="btn btn-outline" onClick={() => setSelected(null)}>Annuler</button>
        <button className="btn btn-primary" onClick={handleAffecterJury}>Confirmer</button>
      </div>
    </div>
  </div>
)}
    </div>
  )
}
