import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { normalizeVehicle, matchRules } from '../lib/rules-engine'

const EXAMPLE_VINS = [
  // EV / PHEV / Hybride
  { label: 'Hyundai Ioniq 5 2024', vin: 'KM8KNDDF4RU329320' },
  { label: 'Mitsubishi Outlander PHEV 2025', vin: 'JA4T5VA96SZ604024' },
  { label: 'Mitsubishi Outlander PHEV 2018', vin: 'JA4J24A57JZ620397' },
  { label: 'VW ID.4 2024', vin: '1V2JSPE84RC023328' },
  { label: 'Hyundai Kona électrique', vin: 'KM8K23AG3LU060833' },
  // VUS
  { label: 'Honda HR-V 2023', vin: '3CZRZ2H53PM107960' },
  { label: 'Honda HR-V 2016', vin: '3CZRU5H31GM104375' },
  { label: 'Honda CR-V 2018', vin: '2HKRW1H33JH000900' },
  { label: 'Subaru Forester 2024', vin: 'JF2SKEDC9RH421865' },
  { label: 'Subaru Crosstrek', vin: 'JF2GUHDC4T8211053' },
  { label: 'Acura MDX 2011', vin: '2HNYD2H61BH000206' },
  { label: 'Kia Seltos 2021', vin: 'KNDEUCAA2M7179562' },
  // Autos
  { label: 'Toyota Corolla 2017', vin: '2T1BURHE8HC903211' },
  { label: 'Hyundai Elantra 2023', vin: 'KMHLM4AG6PU549284' },
  { label: 'VW Beetle 2013', vin: '3VW5X7AT4DM808127' },
  { label: 'Ford Mustang 2011', vin: '1ZVBP8CFXB5137355' },
  // Camionnettes / Vans
  { label: 'Ford F-250 SD 2012', vin: '1FT7W2B61CEC27859' },
  { label: 'GMC Sierra 2500HD', vin: '1GTHK29668E200458' },
  { label: 'Chevrolet Silverado 1500', vin: '1GCVKREC1GZ175449' },
  { label: 'Ford Transit 2025', vin: '1FTBR2C82SKA13870' },
  { label: 'Dodge Grand Caravan 2015', vin: '2C4RDGBG0FR634065' },
  // Déjà existants
  { label: 'Tesla Model 3', vin: '5YJ3E1EB0LF643193' },
  { label: 'Silverado HD', vin: '1GC1YNEY3MF251381' },
]

function categoryBadgeColor(cat) {
  if (cat === 'Camionnette') return { bg: '#FEF3C7', color: '#92400E' }
  if (cat === 'VUS/VAN') return { bg: '#DBEAFE', color: '#1E40AF' }
  if (cat === 'AUTO') return { bg: '#D1FAE5', color: '#065F46' }
  return null
}

export default function Simulator() {
  const [vin, setVin] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingRules, setLoadingRules] = useState(false)
  const [vehicle, setVehicle] = useState(null)
  const [rawNhtsa, setRawNhtsa] = useState(null)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [rules, setRules] = useState([])
  const [showAll, setShowAll] = useState(false)
  const [savedSim, setSavedSim] = useState(false)
  const [lastRulesLoad, setLastRulesLoad] = useState(null)

  // Charger les règles — avec refresh manuel
  const loadRules = useCallback(async () => {
    setLoadingRules(true)
    const { data } = await supabase.from('rules').select('*, maintenance_types(code, name)')
    setRules(data || [])
    setLastRulesLoad(new Date())
    setLoadingRules(false)
    // Si un véhicule est déjà décodé, recalculer les résultats
    if (vehicle) {
      const matched = matchRules(vehicle, data || [])
      setResults(matched)
    }
  }, [vehicle])

  useEffect(() => { loadRules() }, [])

  // Recherche la categorie (AUTO / VUS-VAN / Camionnette) dans la table vehicles
  // 1) match exact year+make+model, 2) fallback make+model (categorie la plus frequente)
  async function lookupCategory(year, make, model) {
    if (!make || !model) return null

    // Tentative 1 : year + make + model exact
    if (year) {
      const { data } = await supabase
        .from('vehicles')
        .select('category')
        .eq('year', year)
        .ilike('make', make)
        .ilike('model', model)
        .not('category', 'is', null)
        .limit(1)
      if (data && data.length > 0) return data[0].category
    }

    // Tentative 2 : make + model (toutes annees), categorie la plus frequente
    const { data } = await supabase
      .from('vehicles')
      .select('category')
      .ilike('make', make)
      .ilike('model', model)
      .not('category', 'is', null)

    if (data && data.length > 0) {
      const counts = {}
      for (const row of data) counts[row.category] = (counts[row.category] || 0) + 1
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    }

    return null
  }

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

      // Lookup de la categorie dans la table vehicles
      const category = await lookupCategory(normalized.year, normalized.make, normalized.model)
      normalized.category = category

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
  const catStyle = vehicle ? categoryBadgeColor(vehicle.category) : null

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
            <button
              className="btn btn-secondary btn-sm"
              onClick={loadRules}
              disabled={loadingRules}
              style={{ marginLeft: 'auto' }}
              title="Recharger les règles depuis la base de données"
            >
              {loadingRules ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '↻'} Actualiser les règles
            </button>
            {lastRulesLoad && (
              <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                {rules.length} règles — {lastRulesLoad.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
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
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {!vehicle.category && (
                  <span className="badge badge-orange" title="Catégorie introuvable dans la base véhicules">⚠ Catégorie inconnue</span>
                )}
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
                ].map(([label, val]) => (
                  <div key={label} style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: val ? 'var(--gray-900)' : 'var(--gray-300)' }}>
                      {val || '—'}
                    </div>
                  </div>
                ))}
                <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 2 }}>Type de véhicule</div>
                  {vehicle.category && catStyle ? (
                    <span style={{ background: catStyle.bg, color: catStyle.color, borderRadius: 12, fontSize: 12, fontWeight: 700, padding: '2px 10px', display: 'inline-block' }}>
                      {vehicle.category}
                    </span>
                  ) : (
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-300)' }}>—</div>
                  )}
                </div>
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
                              <span className="badge badge-gray" style={{ fontSize: 11, whiteSpace: 'normal' }}>
                                {(() => {
                                  const parts = []
                                  if (rule.categories?.length) parts.push(rule.categories.join(', '))
                                  if (rule.year_from || rule.year_to) parts.push(`${rule.year_from||'?'}–${rule.year_to||'?'}`)
                                  const makes = rule.makes?.length > 0 ? rule.makes : (rule.make ? [rule.make] : [])
                                  const models = rule.models?.length > 0 ? rule.models : (rule.model ? [rule.model] : [])
                                  const trans = rule.transmissions?.length > 0 ? rule.transmissions : (rule.transmission ? [rule.transmission] : [])
                                  const drives = rule.drive_types?.length > 0 ? rule.drive_types : (rule.drive_type ? [rule.drive_type] : [])
                                  const fuels = rule.fuel_types?.length > 0 ? rule.fuel_types : (rule.fuel_type ? [rule.fuel_type] : [])
                                  if (makes.length) parts.push(makes.join(', '))
                                  if (models.length) parts.push(models.join(', '))
                                  if (trans.length) parts.push(trans.join(', '))
                                  if (drives.length) parts.push(drives.join(', '))
                                  if (fuels.length) parts.push(fuels.join(', '))
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
