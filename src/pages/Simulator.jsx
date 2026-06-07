import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { normalizeVehicle, matchRules } from '../lib/rules-engine'

const EXAMPLE_VINS = [
  { label: 'Subaru Crosstrek', vin: 'JF2GPACC9E8227316' },
  { label: 'Tesla Model 3', vin: '5YJ3E1EB0LF643193' },
  { label: 'Silverado HD', vin: '1GC1YNEY3MF251381' },
]

export default function Simulator() {
  const [vin, setVin] = useState('')
  const [loading, setLoading] = useState(false)
  const [vehicle, setVehicle] = useState(null)
  const [rawNhtsa, setRawNhtsa] = useState(null)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [rules, setRules] = useState([])
  const [showAll, setShowAll] = useState(false)
  const [savedSim, setSavedSim] = useState(false)

  useEffect(() => {
    supabase.from('rules').select('*, maintenance_types(code, name)').then(({ data }) => setRules(data || []))
  }, [])

  async function decodeVin() {
    const v = vin.trim().toUpperCase()
    if (v.length < 11) { setError('VIN trop court — minimum 11 caractères.'); return }
    setError(''); setVehicle(null); setResults(null); setSavedSim(false)
    setLoading(true)

    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${v}?format=json`)
      const data = await res.json()
      const r = data.Results?.[0]
      if (!r || (r.ErrorCode && r.ErrorCode !== '0' && !r.ErrorCode.startsWith('0,'))) {
        setError('VIN non reconnu. Vérifiez le numéro et réessayez.')
        setLoading(false); return
      }
      setRawNhtsa(r)
      const normalized = normalizeVehicle(r)
      setVehicle(normalized)
      const matched = matchRules(normalized, rules)
      setResults(matched)
    } catch (e) {
      setError('Erreur réseau. Vérifiez votre connexion.')
    }
    setLoading(false)
  }

  async function saveSimulation() {
    if (!vehicle || !results) return
    await supabase.from('simulations').insert({
      vin: vin.trim().toUpperCase(),
      vehicle_year: vehicle.year,
      vehicle_make: vehicle.make,
      vehicle_model: vehicle.model,
      vehicle_engine: vehicle.engine,
      vehicle_transmission: vehicle.transmission,
      vehicle_drive_type: vehicle.drive_type,
      vehicle_fuel_type: vehicle.fuel_type,
      matched_rules: results.best
    })
    setSavedSim(true)
  }

  const displayResults = showAll ? results?.all : results?.best

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Simulateur VIN</h1>
        <p className="page-subtitle">Entrez un VIN pour voir quelles règles s'appliquent au véhicule</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <input
              value={vin}
              onChange={e => setVin(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && decodeVin()}
              placeholder="Entrez le numéro VIN (17 caractères)"
              style={{ fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em', flex: 1, maxWidth: 420 }}
              maxLength={17}
            />
            <button className="btn btn-primary" onClick={decodeVin} disabled={loading}>
              {loading ? <span className="spinner" /> : '🔍'} Décoder
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Exemples :</span>
            {EXAMPLE_VINS.map(e => (
              <button key={e.vin} className="btn btn-secondary btn-sm"
                onClick={() => { setVin(e.vin); setError(''); setVehicle(null); setResults(null) }}>
                {e.label}
              </button>
            ))}
          </div>
          {error && <div className="alert alert-error" style={{ marginTop: 12, marginBottom: 0 }}>{error}</div>}
        </div>
      </div>

      {vehicle && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div>
                <div className="card-title">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                <div className="card-subtitle">Données décodées via API NHTSA</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {vehicle.fuel_type && <span className="badge badge-blue">{vehicle.fuel_type}</span>}
                {vehicle.transmission && <span className="badge badge-gray">{vehicle.transmission}</span>}
                {vehicle.drive_type && <span className="badge badge-gray">{vehicle.drive_type}</span>}
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                {[
                  ['Année', vehicle.year], ['Marque', vehicle.make], ['Modèle', vehicle.model],
                  ['Moteur', vehicle.engine], ['Transmission', vehicle.transmission],
                  ['Propulsion', vehicle.drive_type], ['Carburant', vehicle.fuel_type],
                  ['Puissance', rawNhtsa?.EngineHP ? rawNhtsa.EngineHP + ' HP' : null],
                  ['Carrosserie', rawNhtsa?.BodyClass],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: val ? 'var(--gray-900)' : 'var(--gray-300)' }}>
                      {val || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {results && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Règles appliquées</div>
                  <div className="card-subtitle">
                    {results.best.length} entretien{results.best.length !== 1 ? 's' : ''} recommandé{results.best.length !== 1 ? 's' : ''}
                    {results.all.length > results.best.length && (
                      <> · <span style={{ color: 'var(--orange)' }}>⚠ {results.all.length - results.best.length} conflit{results.all.length - results.best.length > 1 ? 's' : ''} détecté{results.all.length - results.best.length > 1 ? 's' : ''}</span></>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {results.all.length > results.best.length && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAll(!showAll)}>
                      {showAll ? 'Masquer les conflits' : 'Voir tous les conflits'}
                    </button>
                  )}
                  {!savedSim
                    ? <button className="btn btn-secondary btn-sm" onClick={saveSimulation}>💾 Sauvegarder</button>
                    : <span className="badge badge-green">✓ Sauvegardé</span>
                  }
                </div>
              </div>

              {results.best.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">Aucune règle ne correspond</div>
                  <div className="empty-state-text">Créez des règles pour couvrir ce type de véhicule</div>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Entretien</th><th>Règle appliquée</th><th>Initial</th>
                        <th>Répétition</th><th>Prix</th><th>Score</th>
                        {showAll && <th>Statut</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {displayResults.map((rule) => {
                        const isBest = results.best.find(b => b.id === rule.id)
                        return (
                          <tr key={rule.id} className={!isBest && showAll ? 'conflict-row' : ''}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{rule.maintenance_types?.code}</div>
                              <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{rule.maintenance_types?.name}</div>
                            </td>
                            <td>
                              <span className="badge badge-gray" style={{ fontSize: 11 }}>
                                {(() => {
                                  const parts = []
                                  if (rule.year_from || rule.year_to) parts.push(`${rule.year_from||'?'}–${rule.year_to||'?'}`)
                                  const makes = rule.makes?.length > 0 ? rule.makes : (rule.make ? [rule.make] : [])
                                  const models = rule.models?.length > 0 ? rule.models : (rule.model ? [rule.model] : [])
                                  if (makes.length) parts.push(makes.join(', '))
                                  if (models.length) parts.push(models.join(', '))
                                  if (rule.transmission) parts.push(rule.transmission)
                                  if (rule.drive_type) parts.push(rule.drive_type)
                                  if (rule.fuel_type) parts.push(rule.fuel_type)
                                  return parts.length ? parts.join(' · ') : 'Tous véhicules'
                                })()}
                              </span>
                            </td>
                            <td className="mono">
                              {rule.initial_months ? `${rule.initial_months}m` : '—'} / {rule.initial_km ? `${rule.initial_km.toLocaleString()}km` : '—'}
                            </td>
                            <td className="mono">
                              {rule.repeat_months ? `${rule.repeat_months}m` : '—'} / {rule.repeat_km ? `${rule.repeat_km.toLocaleString()}km` : '—'}
                            </td>
                            <td style={{ fontWeight: 600 }}>{rule.price ? `${parseFloat(rule.price).toFixed(2)} $` : '—'}</td>
                            <td><span className="score-pill">{rule.score}</span></td>
                            {showAll && (
                              <td>{isBest ? <span className="badge badge-green">✓ Retenue</span> : <span className="badge badge-orange">⚠ Conflit</span>}</td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
