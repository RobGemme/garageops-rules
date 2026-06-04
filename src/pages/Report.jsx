import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Report() {
  const [rules, setRules] = useState([])
  const [types, setTypes] = useState([])
  const [sims, setSims] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: r }, { data: t }, { data: s }] = await Promise.all([
      supabase.from('rules').select('*, maintenance_types(code, name)'),
      supabase.from('maintenance_types').select('*').order('code'),
      supabase.from('simulations').select('*').order('created_at', { ascending: false }).limit(50)
    ])
    setRules(r || [])
    setTypes(t || [])
    setSims(s || [])
    setLoading(false)
  }

  // Regrouper les règles par type d'entretien
  const rulesByType = {}
  for (const rule of rules) {
    const tid = rule.maintenance_type_id
    if (!rulesByType[tid]) rulesByType[tid] = []
    rulesByType[tid].push(rule)
  }

  // Types couverts vs non couverts
  const coveredTypeIds = new Set(Object.keys(rulesByType))
  const uncoveredTypes = types.filter(t => !coveredTypeIds.has(t.id))

  // Détecter les chevauchements potentiels (même type, critères similaires)
  const conflicts = []
  for (const [tid, typeRules] of Object.entries(rulesByType)) {
    if (typeRules.length > 1) {
      // Simplification : signaler si règle très large (score 0) coexiste avec règles précises
      const broad = typeRules.filter(r => getScore(r) === 0)
      const specific = typeRules.filter(r => getScore(r) > 0)
      if (broad.length > 0 && specific.length > 0) {
        conflicts.push({
          type: typeRules[0].maintenance_types,
          count: typeRules.length,
          broad: broad.length,
          specific: specific.length
        })
      }
    }
  }

  function getScore(rule) {
    let s = 0
    if (rule.year_from || rule.year_to) s += 2
    if (rule.make) s += 3
    if (rule.model) s += 4
    if (rule.transmission) s += 2
    if (rule.drive_type) s += 2
    if (rule.fuel_type) s += 2
    if (rule.engine) s += 1
    return s
  }

  if (loading) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 60 }}>
      <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} />
    </div>
  )

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Rapport d'analyse</h1>
          <p className="page-subtitle">Vue d'ensemble des règles, couverture et conflits potentiels</p>
        </div>
        <button className="btn btn-secondary" onClick={loadData}>↻ Actualiser</button>
      </div>

      {/* Stats globales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Règles créées', value: rules.length, color: 'var(--blue)', bg: 'var(--blue-light)' },
          { label: 'Types couverts', value: `${coveredTypeIds.size} / ${types.length}`, color: 'var(--green)', bg: 'var(--green-light)' },
          { label: 'Types non couverts', value: uncoveredTypes.length, color: uncoveredTypes.length > 0 ? 'var(--orange)' : 'var(--green)', bg: uncoveredTypes.length > 0 ? 'var(--orange-light)' : 'var(--green-light)' },
          { label: 'Chevauchements', value: conflicts.length, color: conflicts.length > 0 ? 'var(--orange)' : 'var(--green)', bg: conflicts.length > 0 ? 'var(--orange-light)' : 'var(--green-light)' },
          { label: 'VINs testés', value: sims.length, color: 'var(--gray-600)', bg: 'var(--gray-100)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ borderLeft: `3px solid ${s.color}` }}>
            <div className="card-body" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Couverture par type */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Couverture par type d'entretien</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Entretien</th>
                  <th>Règles</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {types.map(t => {
                  const count = rulesByType[t.id]?.length || 0
                  return (
                    <tr key={t.id}>
                      <td><span className="mono">{t.code}</span></td>
                      <td style={{ fontSize: 12 }}>{t.name}</td>
                      <td style={{ textAlign: 'center' }}>
                        {count > 0 ? <span className="badge badge-blue">{count}</span> : <span style={{ color: 'var(--gray-300)' }}>0</span>}
                      </td>
                      <td>
                        {count === 0
                          ? <span className="badge badge-gray">Non couvert</span>
                          : count === 1
                            ? <span className="badge badge-green">✓ 1 règle</span>
                            : <span className="badge badge-blue">{count} règles</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Chevauchements */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">⚠ Chevauchements potentiels</div>
            </div>
            <div className="card-body">
              {conflicts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--gray-400)' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
                  <div style={{ fontSize: 13 }}>Aucun chevauchement détecté</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {conflicts.map((c, i) => (
                    <div key={i} style={{
                      background: 'var(--orange-light)',
                      border: '1px solid #FDE68A',
                      borderRadius: 8,
                      padding: '10px 14px'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.type?.code} — {c.type?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2 }}>
                        {c.count} règles · {c.broad} large{c.broad > 1 ? 's' : ''} + {c.specific} spécifique{c.specific > 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Historique simulations */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <div className="card-title">Derniers VINs testés</div>
            </div>
            {sims.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>Aucune simulation encore</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>VIN</th>
                      <th>Véhicule</th>
                      <th>Règles</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sims.map(s => (
                      <tr key={s.id}>
                        <td><span className="mono" style={{ fontSize: 11 }}>{s.vin}</span></td>
                        <td style={{ fontSize: 12 }}>{s.vehicle_year} {s.vehicle_make} {s.vehicle_model}</td>
                        <td>
                          <span className="badge badge-blue">
                            {Array.isArray(s.matched_rules) ? s.matched_rules.length : '?'}
                          </span>
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                          {new Date(s.created_at).toLocaleDateString('fr-CA')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  )
}
