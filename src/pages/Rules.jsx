import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const EMPTY_RULE = {
  maintenance_type_id: '',
  year_from: '', year_to: '',
  makes: [], models: [],
  engine: '', transmission: '', drive_type: '', fuel_type: '',
  initial_months: '', initial_km: '',
  repeat_months: '', repeat_km: '',
  price: '', notes: ''
}

const YEARS = Array.from({ length: new Date().getFullYear() - 1999 + 1 }, (_, i) => 2000 + i).reverse()

// --- Tag Selector ---
function TagSelector({ label, options, selected, onChange, disabled, loading, placeholder, hint }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))

  function toggle(val) {
    onChange(selected.includes(val) ? selected.filter(s => s !== val) : [...selected, val])
  }

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 5 }}>
        {label}
        {loading && <span className="spinner" style={{ width: 12, height: 12, marginLeft: 6 }} />}
      </div>
      <div onClick={() => !disabled && setOpen(!open)} style={{
        minHeight: 38, border: `1px solid ${open ? 'var(--blue)' : 'var(--gray-300)'}`,
        borderRadius: 6, padding: '4px 8px', background: disabled ? 'var(--gray-50)' : 'white',
        cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', flexWrap: 'wrap',
        gap: 4, alignItems: 'center', boxShadow: open ? '0 0 0 3px rgba(37,99,235,0.08)' : 'none',
      }}>
        {selected.length === 0 && <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{disabled ? placeholder : 'Tous (cliquer pour filtrer)'}</span>}
        {selected.map(tag => (
          <span key={tag} style={{ background: 'var(--blue-light)', color: 'var(--blue)', border: '1px solid var(--blue-border)', borderRadius: 20, fontSize: 12, fontWeight: 600, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
            {tag}
            <span onClick={e => { e.stopPropagation(); onChange(selected.filter(s => s !== tag)) }} style={{ cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</span>
          </span>
        ))}
      </div>
      {hint && <div className="form-hint">{hint}</div>}
      {open && !disabled && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', marginTop: 4, maxHeight: 260, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 8px 4px' }}>
            <input autoFocus placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()}
              style={{ width: '100%', padding: '6px 10px', fontSize: 13, border: '1px solid var(--gray-200)', borderRadius: 6, outline: 'none' }} />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0
              ? <div style={{ padding: 12, fontSize: 13, color: 'var(--gray-400)' }}>Aucun résultat</div>
              : filtered.map(opt => (
                <div key={opt} onClick={() => toggle(opt)} style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', background: selected.includes(opt) ? 'var(--blue-light)' : 'transparent', color: selected.includes(opt) ? 'var(--blue)' : 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: selected.includes(opt) ? 600 : 400 }}
                  onMouseEnter={e => { if (!selected.includes(opt)) e.currentTarget.style.background = 'var(--gray-50)' }}
                  onMouseLeave={e => { if (!selected.includes(opt)) e.currentTarget.style.background = 'transparent' }}>
                  <span style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `2px solid ${selected.includes(opt) ? 'var(--blue)' : 'var(--gray-300)'}`, background: selected.includes(opt) ? 'var(--blue)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white' }}>{selected.includes(opt) ? '✓' : ''}</span>
                  {opt}
                </div>
              ))}
          </div>
          {selected.length > 0 && (
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{selected.length} sélectionné{selected.length > 1 ? 's' : ''}</span>
              <button onClick={e => { e.stopPropagation(); onChange([]) }} style={{ fontSize: 12, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}>Tout effacer</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SimpleSelect({ label, options, value, onChange, loading, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 5 }}>
        {label}{loading && <span className="spinner" style={{ width: 12, height: 12, marginLeft: 6 }} />}
      </div>
      <select value={value} onChange={e => onChange(e.target.value)} disabled={loading}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--gray-300)', borderRadius: 6, fontSize: 13, fontFamily: 'DM Sans, sans-serif', color: 'var(--gray-900)', background: 'white' }}>
        <option value="">Tous</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  )
}

export default function Rules() {
  const [rules, setRules] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_RULE)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const [availableMakes, setAvailableMakes] = useState([])
  const [availableModels, setAvailableModels] = useState([])
  const [availableTrans, setAvailableTrans] = useState([])
  const [availableDrives, setAvailableDrives] = useState([])
  const [availableFuels, setAvailableFuels] = useState([])
  const [availableEngines, setAvailableEngines] = useState([])
  const [vehicleCount, setVehicleCount] = useState(null)
  const [loadingMakes, setLoadingMakes] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => { loadData() }, [])

  useEffect(() => { if (showModal) loadMakes() }, [form.year_from, form.year_to, showModal])

  useEffect(() => {
    if (form.makes.length > 0) loadModels()
    else { setAvailableModels([]); setForm(f => ({ ...f, models: [] })) }
  }, [form.makes])

  useEffect(() => { loadDetails() }, [form.models, form.makes, form.year_from, form.year_to])

  useEffect(() => { estimateCount() }, [form.makes, form.models, form.year_from, form.year_to, form.transmission, form.fuel_type, form.drive_type, form.engine])

  async function loadMakes() {
    setLoadingMakes(true)
    const { data } = await supabase.rpc('get_makes', {
      p_year_from: form.year_from ? parseInt(form.year_from) : null,
      p_year_to: form.year_to ? parseInt(form.year_to) : null,
    })
    setAvailableMakes((data || []).map(r => r.make))
    setLoadingMakes(false)
  }

  async function loadModels() {
    if (form.makes.length === 0) return
    setLoadingModels(true)
    const { data } = await supabase.rpc('get_models', {
      p_makes: form.makes,
      p_year_from: form.year_from ? parseInt(form.year_from) : null,
      p_year_to: form.year_to ? parseInt(form.year_to) : null,
    })
    const models = (data || []).map(r => r.model)
    setAvailableModels(models)
    setForm(f => ({ ...f, models: f.models.filter(m => models.includes(m)) }))
    setLoadingModels(false)
  }

  async function loadDetails() {
    setLoadingDetails(true)
    const { data } = await supabase.rpc('get_vehicle_details', {
      p_makes: form.makes.length > 0 ? form.makes : null,
      p_models: form.models.length > 0 ? form.models : null,
      p_year_from: form.year_from ? parseInt(form.year_from) : null,
      p_year_to: form.year_to ? parseInt(form.year_to) : null,
    })
    const rows = data || []
    setAvailableTrans([...new Set(rows.map(r => r.transmission).filter(Boolean))].sort())
    setAvailableDrives([...new Set(rows.map(r => r.drive).filter(Boolean))].sort())
    setAvailableFuels([...new Set(rows.map(r => r.fuel).filter(Boolean))].sort())
    setAvailableEngines([...new Set(rows.map(r => r.engine).filter(Boolean))].sort((a, b) => parseFloat(a) - parseFloat(b)))
    setLoadingDetails(false)
  }

  async function estimateCount() {
    const { data } = await supabase.rpc('count_vehicles', {
      p_makes: form.makes.length > 0 ? form.makes : null,
      p_models: form.models.length > 0 ? form.models : null,
      p_year_from: form.year_from ? parseInt(form.year_from) : null,
      p_year_to: form.year_to ? parseInt(form.year_to) : null,
      p_transmission: form.transmission || null,
      p_drive: form.drive_type || null,
      p_fuel: form.fuel_type || null,
      p_engine: form.engine || null,
    })
    setVehicleCount(data || 0)
  }

  async function loadData() {
    setLoading(true)
    const [{ data: r }, { data: t }] = await Promise.all([
      supabase.from('rules').select('*, maintenance_types(code, name)').order('created_at', { ascending: false }),
      supabase.from('maintenance_types').select('*').order('code')
    ])
    setRules(r || [])
    setTypes(t || [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm(EMPTY_RULE)
    setAvailableModels([]); setAvailableTrans([]); setAvailableDrives([])
    setAvailableFuels([]); setAvailableEngines([]); setVehicleCount(null)
    setShowModal(true)
  }

  function openEdit(rule) {
    setEditing(rule.id)
    setForm({
      maintenance_type_id: rule.maintenance_type_id || '',
      year_from: rule.year_from || '', year_to: rule.year_to || '',
      makes: rule.makes || (rule.make ? [rule.make] : []),
      models: rule.models || (rule.model ? [rule.model] : []),
      engine: rule.engine || '', transmission: rule.transmission || '',
      drive_type: rule.drive_type || '', fuel_type: rule.fuel_type || '',
      initial_months: rule.initial_months || '', initial_km: rule.initial_km || '',
      repeat_months: rule.repeat_months || '', repeat_km: rule.repeat_km || '',
      price: rule.price || '', notes: rule.notes || ''
    })
    setShowModal(true)
  }

  function setField(key, val) {
    if (key === 'makes') setForm(f => ({ ...f, makes: val, models: [], transmission: '', drive_type: '', fuel_type: '', engine: '' }))
    else if (key === 'models') setForm(f => ({ ...f, models: val, transmission: '', drive_type: '', fuel_type: '', engine: '' }))
    else if (key === 'year_from' || key === 'year_to') setForm(f => ({ ...f, [key]: val, makes: [], models: [], transmission: '', drive_type: '', fuel_type: '', engine: '' }))
    else setForm(f => ({ ...f, [key]: val }))
  }

  async function saveRule() {
    if (!form.maintenance_type_id) return alert('Sélectionnez un type d\'entretien.')
    setSaving(true)
    const payload = {
      maintenance_type_id: form.maintenance_type_id,
      year_from: form.year_from ? parseInt(form.year_from) : null,
      year_to: form.year_to ? parseInt(form.year_to) : null,
      makes: form.makes.length > 0 ? form.makes : null,
      models: form.models.length > 0 ? form.models : null,
      make: form.makes[0] || null, model: form.models[0] || null,
      engine: form.engine || null, transmission: form.transmission || null,
      drive_type: form.drive_type || null, fuel_type: form.fuel_type || null,
      initial_months: form.initial_months ? parseInt(form.initial_months) : null,
      initial_km: form.initial_km ? parseInt(form.initial_km) : null,
      repeat_months: form.repeat_months ? parseInt(form.repeat_months) : null,
      repeat_km: form.repeat_km ? parseInt(form.repeat_km) : null,
      price: form.price ? parseFloat(form.price) : null,
      notes: form.notes || null, updated_at: new Date().toISOString()
    }
    if (editing) await supabase.from('rules').update(payload).eq('id', editing)
    else await supabase.from('rules').insert(payload)
    setSaving(false); setShowModal(false); loadData()
  }

  async function deleteRule(id) {
    await supabase.from('rules').delete().eq('id', id)
    setDeleteConfirm(null); loadData()
  }

  function getScore(rule) {
    let s = 0
    if (rule.year_from || rule.year_to) s += 2
    if (rule.makes?.length > 0 || rule.make) s += 3
    if (rule.models?.length > 0 || rule.model) s += 4
    if (rule.transmission) s += 2
    if (rule.drive_type) s += 2
    if (rule.fuel_type) s += 2
    if (rule.engine) s += 1
    return s
  }

  function describeRule(rule) {
    const parts = []
    if (rule.year_from || rule.year_to) parts.push(`${rule.year_from || '?'}–${rule.year_to || '?'}`)
    const makes = rule.makes?.length > 0 ? rule.makes : (rule.make ? [rule.make] : [])
    const models = rule.models?.length > 0 ? rule.models : (rule.model ? [rule.model] : [])
    if (makes.length > 0) parts.push(makes.join(', '))
    if (models.length > 0) parts.push(models.join(', '))
    if (rule.transmission) parts.push(rule.transmission)
    if (rule.drive_type) parts.push(rule.drive_type)
    if (rule.fuel_type) parts.push(rule.fuel_type)
    return parts.length ? parts.join(' · ') : 'Tous véhicules'
  }

  const filtered = rules.filter(r => {
    if (filterType && r.maintenance_type_id !== filterType) return false
    if (search) {
      const q = search.toLowerCase()
      if (!describeRule(r).toLowerCase().includes(q) && !r.maintenance_types?.name?.toLowerCase().includes(q)) return false
    }
    return true
  })

  function coverageStyle(count) {
    if (count === null) return null
    if (count > 5000) return { bg: '#FEF3C7', color: '#92400E', label: 'Très large', icon: '🌍' }
    if (count > 500) return { bg: '#DBEAFE', color: '#1E40AF', label: 'Large', icon: '🚗' }
    if (count > 50) return { bg: '#D1FAE5', color: '#065F46', label: 'Moyen', icon: '🎯' }
    if (count === 0) return { bg: '#FEF2F2', color: '#DC2626', label: 'Aucun véhicule!', icon: '⚠️' }
    return { bg: '#F3F4F6', color: '#374151', label: 'Précis', icon: '🔬' }
  }

  const coverage = coverageStyle(vehicleCount)

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Règles de maintenance</h1>
          <p className="page-subtitle">Définissez les entretiens à recommander selon les caractéristiques du véhicule</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Nouvelle règle</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: 'flex', gap: 12, padding: '12px 16px' }}>
          <input placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 240 }} />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ maxWidth: 280 }}>
            <option value="">Tous les types d'entretien</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--gray-400)', alignSelf: 'center' }}>
            {filtered.length} règle{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">Aucune règle</div>
              <div className="empty-state-text">Créez votre première règle de maintenance</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>Type d'entretien</th><th>Cible</th><th>Initial</th><th>Répétition</th><th>Prix</th><th>Score</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(rule => (
                  <tr key={rule.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{rule.maintenance_types?.code}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{rule.maintenance_types?.name}</div>
                    </td>
                    <td><span className="badge badge-gray">{describeRule(rule)}</span></td>
                    <td>{rule.initial_months || rule.initial_km ? <span className="mono">{rule.initial_months ? `${rule.initial_months}m` : '—'} / {rule.initial_km ? `${rule.initial_km.toLocaleString()}km` : '—'}</span> : <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                    <td>{rule.repeat_months || rule.repeat_km ? <span className="mono">{rule.repeat_months ? `${rule.repeat_months}m` : '—'} / {rule.repeat_km ? `${rule.repeat_km.toLocaleString()}km` : '—'}</span> : <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                    <td>{rule.price ? <span style={{ fontWeight: 600 }}>{parseFloat(rule.price).toFixed(2)} $</span> : <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                    <td><span className="score-pill">{getScore(rule)}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(rule)}>Modifier</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(rule.id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Modifier la règle' : 'Nouvelle règle'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">

              <div className="section-label">Type d'entretien</div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 5 }}>Type d'entretien *</div>
                <select value={form.maintenance_type_id} onChange={e => setField('maintenance_type_id', e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--gray-300)', borderRadius: 6, fontSize: 13 }}>
                  <option value="">Sélectionner...</option>
                  {types.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
                </select>
              </div>

              <div className="section-label" style={{ marginTop: 8 }}>
                Critères de ciblage
                <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11 }}> — laisser vide = s'applique à tous</span>
              </div>

              <div className="form-row form-row-2" style={{ marginBottom: 0 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 5 }}>Année de</div>
                  <select value={form.year_from} onChange={e => setField('year_from', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--gray-300)', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
                    <option value="">Toutes</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 5 }}>Année à</div>
                  <select value={form.year_to} onChange={e => setField('year_to', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--gray-300)', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
                    <option value="">Toutes</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <TagSelector
                label={`Marques${loadingMakes ? '' : ` (${availableMakes.length} disponibles)`}`}
                options={availableMakes}
                selected={form.makes}
                onChange={val => setField('makes', val)}
                loading={loadingMakes}
                hint={form.makes.length === 0 ? 'Vide = toutes les marques' : null}
              />

              <TagSelector
                label={form.makes.length > 0 ? `Modèles${loadingModels ? '' : ` (${availableModels.length} disponibles)`}` : 'Modèles'}
                options={availableModels}
                selected={form.models}
                onChange={val => setField('models', val)}
                loading={loadingModels}
                disabled={form.makes.length === 0}
                placeholder="Sélectionnez une marque d'abord"
                hint={form.makes.length > 0 && form.models.length === 0 ? `Vide = tous les modèles de ${form.makes.join(', ')}` : null}
              />

              <div className="form-row form-row-3" style={{ marginBottom: 0 }}>
                <SimpleSelect label={`Transmission${availableTrans.length > 0 ? ` (${availableTrans.length})` : ''}`} options={availableTrans} value={form.transmission} onChange={v => setField('transmission', v)} loading={loadingDetails} hint="Vide = toutes" />
                <SimpleSelect label={`Propulsion${availableDrives.length > 0 ? ` (${availableDrives.length})` : ''}`} options={availableDrives} value={form.drive_type} onChange={v => setField('drive_type', v)} loading={loadingDetails} hint="Vide = toutes" />
                <SimpleSelect label={`Carburant${availableFuels.length > 0 ? ` (${availableFuels.length})` : ''}`} options={availableFuels} value={form.fuel_type} onChange={v => setField('fuel_type', v)} loading={loadingDetails} hint="Vide = tous" />
              </div>

              <SimpleSelect label={`Moteur${availableEngines.length > 0 ? ` (${availableEngines.length} cylindrées)` : ''}`} options={availableEngines} value={form.engine} onChange={v => setField('engine', v)} loading={loadingDetails} hint="Vide = tous les moteurs" />

              {coverage && (
                <div style={{ background: coverage.bg, border: `1px solid ${coverage.color}40`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{coverage.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: coverage.color }}>
                      Couverture : {coverage.label} — {vehicleCount?.toLocaleString()} combinaisons
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>Nombre exact dans la base de données véhicules</div>
                  </div>
                </div>
              )}

              <div className="section-label">Intervalles et prix</div>
              <div className="form-row form-row-4" style={{ marginBottom: 12 }}>
                {[['initial_months','Initial — Mois','ex: 12'],['initial_km','Initial — Km','ex: 20000'],['repeat_months','Répétition — Mois','ex: 12'],['repeat_km','Répétition — Km','ex: 20000']].map(([key, label, ph]) => (
                  <div key={key}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 5 }}>{label}</div>
                    <input type="number" placeholder={ph} value={form[key]} onChange={e => setField(key, e.target.value)} />
                  </div>
                ))}
              </div>
              <div className="form-row form-row-2">
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 5 }}>Prix ($)</div>
                  <input type="number" step="0.01" placeholder="ex: 89.95" value={form.price} onChange={e => setField('price', e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 5 }}>Notes internes</div>
                  <input placeholder="Note optionnelle..." value={form.notes} onChange={e => setField('notes', e.target.value)} />
                </div>
              </div>

            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={saveRule} disabled={saving}>
                {saving ? <span className="spinner" /> : null}
                {editing ? 'Enregistrer' : 'Créer la règle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header"><h2 className="modal-title">Supprimer la règle?</h2></div>
            <div className="modal-body"><p style={{ color: 'var(--gray-600)' }}>Cette action est irréversible.</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={() => deleteRule(deleteConfirm)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
