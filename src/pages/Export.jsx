import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { downloadCsv, ruleToRow, csvToRules, describeDecodedRule } from '../lib/csv-rules'

function categoryBadgeColor(cat) {
  if (cat === 'Camionnette') return { bg: '#FEF3C7', color: '#92400E' }
  if (cat === 'VUS/VAN') return { bg: '#DBEAFE', color: '#1E40AF' }
  if (cat === 'AUTO') return { bg: '#D1FAE5', color: '#065F46' }
  return null
}

function CategoryBadges({ categories }) {
  if (!categories?.length) return <span style={{ color: 'var(--gray-300)' }}>Tous</span>
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {categories.map(cat => {
        const c = categoryBadgeColor(cat)
        return (
          <span key={cat} style={{ background: c?.bg || '#F3F4F6', color: c?.color || 'var(--gray-700)', borderRadius: 12, fontSize: 11, fontWeight: 600, padding: '2px 8px' }}>
            {cat}
          </span>
        )
      })}
    </div>
  )
}

export default function Export() {
  const [rules, setRules] = useState([])
  const [maintenanceTypes, setMaintenanceTypes] = useState([])
  const [loading, setLoading] = useState(true)

  // Décodeur
  const [csvText, setCsvText] = useState('')
  const [decoded, setDecoded] = useState(null)
  const [decodeError, setDecodeError] = useState('')

  // Import
  const [replaceAll, setReplaceAll] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  useEffect(() => { loadRules() }, [])

  async function loadRules() {
    setLoading(true)
    const [{ data: rulesData }, { data: typesData }] = await Promise.all([
      supabase.from('rules').select('*, maintenance_types(code, name)').order('created_at', { ascending: false }),
      supabase.from('maintenance_types').select('*'),
    ])
    setRules(rulesData || [])
    setMaintenanceTypes(typesData || [])
    setLoading(false)
  }

  function handleExport() {
    const date = new Date().toISOString().slice(0, 10)
    downloadCsv(rules, `garageops-rules-${date}.csv`)
  }

  function handleDecode() {
    setDecodeError('')
    setImportResult(null)
    if (!csvText.trim()) { setDecoded(null); return }
    try {
      const parsed = csvToRules(csvText)
      if (parsed.length === 0) { setDecodeError("Aucune ligne trouvée — vérifiez le contenu collé (avec l'en-tête)."); setDecoded(null); return }
      setDecoded(parsed)
    } catch (e) {
      setDecodeError('Erreur de lecture du CSV : ' + e.message)
      setDecoded(null)
    }
  }

  async function handleImport() {
    if (!decoded || decoded.length === 0) return
    setImporting(true)
    setImportResult(null)

    const skipped = []
    const payloads = []

    for (const rule of decoded) {
      const mtype = maintenanceTypes.find(t => t.code?.toUpperCase() === rule.maintenance_code?.toUpperCase())
      if (!mtype) { skipped.push(`${rule.product_code || '?'} (type "${rule.maintenance_code}" introuvable)`); continue }
      payloads.push({
        product_code: rule.product_code || null,
        categories: rule.categories.length > 0 ? rule.categories : null,
        maintenance_type_id: mtype.id,
        year_from: rule.year_from,
        year_to: rule.year_to,
        makes: rule.makes.length > 0 ? rule.makes : null,
        models: rule.models.length > 0 ? rule.models : null,
        make: rule.makes[0] || null,
        model: rule.models[0] || null,
        engine: rule.engines[0] || null,
        cylinder: rule.cylinders[0] || null,
        transmission: rule.transmissions[0] || null,
        drive_type: rule.drive_types[0] || null,
        fuel_type: rule.fuel_types[0] || null,
        engines: rule.engines.length > 0 ? rule.engines : null,
        cylinders: rule.cylinders.length > 0 ? rule.cylinders : null,
        transmissions: rule.transmissions.length > 0 ? rule.transmissions : null,
        drive_types: rule.drive_types.length > 0 ? rule.drive_types : null,
        fuel_types: rule.fuel_types.length > 0 ? rule.fuel_types : null,
        initial_months: rule.initial_months,
        initial_km: rule.initial_km,
        repeat_months: rule.repeat_months,
        repeat_km: rule.repeat_km,
        price: rule.price,
        notes: rule.notes,
        updated_at: new Date().toISOString(),
      })
    }

    if (replaceAll) {
      await supabase.from('rules').delete().not('id', 'is', null)
    }

    let inserted = 0
    if (payloads.length > 0) {
      const { error } = await supabase.from('rules').insert(payloads)
      if (!error) inserted = payloads.length
      else skipped.push(`Erreur Supabase : ${error.message}`)
    }

    setImportResult({ inserted, skipped })
    setImporting(false)
    loadRules()
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCsvText(ev.target.result)
    reader.readAsText(file)
  }

  const preview = rules.map(r => ruleToRow(r))

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Export</h1>
        <p className="page-subtitle">Exporter les règles en CSV (format à plat, valeurs normalisées) pour intégration dans GarageOps</p>
      </div>

      {/* Export */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Exporter les règles</div>
            <div className="card-subtitle">
              {loading ? 'Chargement...' : `${rules.length} règle${rules.length !== 1 ? 's' : ''} prête${rules.length !== 1 ? 's' : ''} à exporter`}
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleExport} disabled={loading || rules.length === 0}>
            ⬇ Exporter CSV
          </button>
        </div>
        <div className="table-wrap" style={{ maxHeight: 360, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
          ) : rules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">Aucune règle</div>
              <div className="empty-state-text">Créez des règles dans l'onglet Règles d'abord</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Code</th><th>Entretien</th><th>Catégorie</th><th>Cible</th>
                  <th>Initial</th><th>Répétition</th><th>Prix</th><th>Score</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, i) => {
                  const row = preview[i]
                  return (
                    <tr key={rule.id}>
                      <td>{row.product_code ? <span className="mono" style={{ fontWeight: 600 }}>{row.product_code}</span> : <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{row.maintenance_code}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{row.maintenance_name}</div>
                      </td>
                      <td><CategoryBadges categories={rule.categories} /></td>
                      <td><span className="badge badge-gray" style={{ whiteSpace: 'normal', maxWidth: 300 }}>{describeDecodedRule({
                        categories: rule.categories || [],
                        year_from: rule.year_from, year_to: rule.year_to,
                        makes: row.makes ? row.makes.split('|') : [],
                        models: row.models ? row.models.split('|') : [],
                        transmissions: row.transmissions ? row.transmissions.split('|') : [],
                        drive_types: row.drive_types ? row.drive_types.split('|') : [],
                        fuel_types: row.fuel_types ? row.fuel_types.split('|') : [],
                        engines: row.engines ? row.engines.split('|') : [],
                        cylinders: row.cylinders ? row.cylinders.split('|') : [],
                      })}</span></td>
                      <td className="mono">{row.initial_months ? `${row.initial_months}m` : '—'} / {row.initial_km ? `${Number(row.initial_km).toLocaleString()}km` : '—'}</td>
                      <td className="mono">{row.repeat_months ? `${row.repeat_months}m` : '—'} / {row.repeat_km ? `${Number(row.repeat_km).toLocaleString()}km` : '—'}</td>
                      <td>{row.price !== '' ? <span style={{ fontWeight: 600 }}>{parseFloat(row.price).toFixed(2)} $</span> : <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                      <td><span className="score-pill">{row.score}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Décodeur CSV */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Décodeur CSV</div>
            <div className="card-subtitle">Collez ou importez un fichier CSV exporté pour vérifier qu'il se décode correctement</div>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
            <textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder="Collez ici le contenu du CSV (avec la ligne d'en-tête)..."
              style={{ flex: 1, minHeight: 100, fontFamily: 'DM Mono, monospace', fontSize: 12, padding: 10, border: '1px solid var(--gray-300)', borderRadius: 6 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleDecode}>🔍 Décoder</button>
              <label className="btn btn-secondary" style={{ textAlign: 'center', cursor: 'pointer' }}>
                📁 Importer un fichier
                <input type="file" accept=".csv,text/csv" onChange={handleFile} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
          {decodeError && <div className="alert alert-error" style={{ marginBottom: 12 }}>{decodeError}</div>}

          {decoded && (
            <div className="table-wrap">
              <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8 }}>
                {decoded.length} ligne{decoded.length !== 1 ? 's' : ''} décodée{decoded.length !== 1 ? 's' : ''}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Code</th><th>Entretien</th><th>Catégorie</th><th>Cible décodée</th>
                    <th>Initial</th><th>Répétition</th><th>Prix</th><th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {decoded.map((rule, i) => (
                    <tr key={i}>
                      <td>{rule.product_code ? <span className="mono" style={{ fontWeight: 600 }}>{rule.product_code}</span> : <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rule.maintenance_code}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{rule.maintenance_name}</div>
                      </td>
                      <td><CategoryBadges categories={rule.categories} /></td>
                      <td><span className="badge badge-gray" style={{ whiteSpace: 'normal', maxWidth: 300 }}>{describeDecodedRule(rule)}</span></td>
                      <td className="mono">{rule.initial_months ? `${rule.initial_months}m` : '—'} / {rule.initial_km ? `${rule.initial_km.toLocaleString()}km` : '—'}</td>
                      <td className="mono">{rule.repeat_months ? `${rule.repeat_months}m` : '—'} / {rule.repeat_km ? `${rule.repeat_km.toLocaleString()}km` : '—'}</td>
                      <td>{rule.price !== null ? <span style={{ fontWeight: 600 }}>{rule.price.toFixed(2)} $</span> : <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                      <td><span className="score-pill">{rule.score}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
