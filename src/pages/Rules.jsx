import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import {
  DRIVE_TYPE_OPTIONS, TRANSMISSION_OPTIONS, FUEL_TYPE_OPTIONS
} from '../lib/rules-engine'

const EMPTY_RULE = {
  maintenance_type_id: '',
  year_from: '', year_to: '',
  make: '', model: '', engine: '',
  transmission: '', drive_type: '', fuel_type: '',
  initial_months: '', initial_km: '',
  repeat_months: '', repeat_km: '',
  price: '', notes: ''
}

// Années disponibles 1995 → année courante + 1
const YEARS = Array.from({ length: new Date().getFullYear() - 1994 + 1 }, (_, i) => 1995 + i).reverse()

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

  // Dropdowns en cascade
  const [makes, setMakes] = useState([])
  const [models, setModels] = useState([])
  const [engines, setEngines] = useState([])
  const [loadingMakes, setLoadingMakes] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [loadingEngines, setLoadingEngines] = useState(false)

  useEffect(() => { loadData() }, [])

  // Charger les marques quand les années changent
  useEffect(() => {
    if (form.year_from || form.year_to) {
      loadMakes()
    } else {
      loadAllMakes()
    }
  }, [form.year_from, form.year_to])

  // Charger les modèles quand la marque change
  useEffect(() => {
    if (form.make) {
      loadModels()
    } else {
      setModels([])
      setEngines([])
    }
  }, [form.make, form.year_from, form.year_to])

  // Charger les moteurs quand le modèle change
  useEffect(() => {
    if (form.make && form.model) {
      loadEngines()
    } else {
      setEngines([])
    }
  }, [form.model])

  async function loadAllMakes() {
    setLoadingMakes(true)
    try {
      const res = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json')
      const data = await res.json()
      const sorted = (data.Results || [])
        .map(m => m.MakeName)
        .filter(Boolean)
        .sort()
      setMakes(sorted)
    } catch (e) {
      setMakes([])
    }
    setLoadingMakes(false)
  }

  async function loadMakes() {
    setLoadingMakes(true)
    const year = form.year_from || form.year_to
    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json`)
      const data = await res.json()
      const sorted = (data.Results || [])
        .map(m => m.MakeName)
        .filter(Boolean)
        .sort()
      setMakes(sorted)
    } catch (e) {
      setMakes([])
    }
    setLoadingMakes(false)
  }

  async function loadModels() {
    setLoadingModels(true)
    setModels([])
    setEngines([])
    const year = form.year_from || form.year_to
    try {
      let url
      if (year) {
        url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(form.make)}/modelyear/${year}/vehicleType/car?format=json`
      } else {
        url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(form.make)}?format=json`
      }
      const res = await fetch(url)
      const data = await res.json()
      const sorted = [...new Set((data.Results || []).map(m => m.Model_Name).filter(Boolean))].sort()
      setModels(sorted)
    } catch (e) {
      setModels([])
    }
    setLoadingModels(false)
  }

  async function loadEngines() {
    setLoadingEngines(true)
    setEngines([])
    const year = form.year_from || form.year_to
    try {
      // On utilise DecodeVinValues pour trouver les variantes de moteur
      // Mais NHTSA n'a pas d'endpoint direct pour ça — on utilise GetModelsForMakeYear avec détails
      let url
      if (year) {
        url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(form.make)}/modelyear/${year}/vehicleType/car?format=json`
      } else {
        url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(form.make)}?format=json`
      }
      const res = await fetch(url)
      const data = await res.json()
      // NHTSA ne retourne pas les moteurs par modèle directement
      // On offre des options communes basées sur le type de véhicule
      setEngines(['1.0L', '1.3L', '1.4L', '1.5L', '1.6L', '1.8L', '2.0L', '2.4L', '2.5L', '3.0L', '3.5L', '3.6L', '4.0L', '4.6L', '5.0L', '5.3L', '5.7L', '6.2L', 'Électrique'])
    } catch (e) {
      setEngines([])
    }
    setLoadingEngines(false)
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
    setMakes([])
    setModels([])
    setEngines([])
    setShowModal(true)
    loadAllMakes()
  }

  function openEdit(rule) {
    setEditing(rule.id)
    setForm({
      maintenance_type_id: rule.maintenance_type_id || '',
      year_from: rule.year_from || '',
      year_to: rule.year_to || '',
      make: rule.make || '',
      model: rule.model || '',
      engine: rule.engine || '',
      transmission: rule.transmission || '',
      drive_type: rule.drive_type || '',
      fuel_type: rule.fuel_type || '',
      initial_months: rule.initial_months || '',
      initial_km: rule.initial_km || '',
      repeat_months: rule.repeat_months || '',
      repeat_km: rule.repeat_km || '',
      price: rule.price || '',
      notes: rule.notes || ''
    })
    setShowModal(true)
    loadAllMakes()
  }

  function setField(key, val) {
    if (key === 'make') {
      setForm(f => ({ ...f, make: val, model: '', engine: '' }))
    } else if (key === 'model') {
      setForm(f => ({ ...f, model: val, engine: '' }))
    } else if (key === 'year_from' || key === 'year_to') {
      setForm(f => ({ ...f, [key]: val, make: '', model: '', engine: '' }))
    } else {
      setForm(f => ({ ...f, [key]: val }))
    }
  }

  async function saveRule() {
    if (!form.maintenance_type_id) return alert('Sélectionnez un type d\'entretien.')
    setSaving(true)
    const payload = {
      maintenance_type_id: form.maintenance_type_id,
      year_from: form.year_from ? parseInt(form.year_from) : null,
      year_to: form.year_to ? parseInt(form.year_to) : null,
      make: form.make || null,
      model: form.model || null,
      engine: form.engine || null,
      transmission: form.transmission || null,
      drive_type: form.drive_type || null,
      fuel_type: form.fuel_type || null,
      initial_months: form.initial_months ? parseInt(form.initial_months) : null,
      initial_km: form.initial_km ? parseInt(form.initial_km) : null,
      repeat_months: form.repeat_months ? parseInt(form.repeat_months) : null,
      repeat_km: form.repeat_km ? parseInt(form.repeat_km) : null,
      price: form.price ? parseFloat(form.price) : null,
      notes: form.notes || null,
      updated_at: new Date().toISOString()
    }
    if (editing) {
      await supabase.from('rules').update(payload).eq('id', editing)
    } else {
      await supabase.from('rules').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    loadData()
  }

  async function deleteRule(id) {
    await supabase.from('rules').delete().eq('id', id)
    setDeleteConfirm(null)
    loadData()
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

  function describeRule(rule) {
    const parts = []
    if (rule.year_from || rule.year_to) parts.push(`${rule.year_from || '?'}–${rule.year_to || '?'}`)
    if (rule.make) parts.push(rule.make)
    if (rule.model) parts.push(rule.model)
    if (rule.transmission) parts.push(rule.transmission)
    if (rule.drive_type) parts.push(rule.drive_type)
    if (rule.fuel_type) parts.push(rule.fuel_type)
    return parts.length ? parts.join(' · ') : 'Tous véhicules'
  }

  const filtered = rules.filter(r => {
    if (filterType && r.maintenance_type_id !== filterType) return false
    if (search) {
      const q = search.toLowerCase()
      const desc = describeRule(r).toLowerCase()
      const name = r.maintenance_types?.name?.toLowerCase() || ''
      if (!desc.includes(q) && !name.includes(q)) return false
    }
    return true
  })

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Règles de maintenance</h1>
          <p className="page-subtitle">Définissez les entretiens à recommander selon les caractéristiques du véhicule</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Nouvelle règle</button>
      </div>

      {/* Filtres */}
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

      {/* Table */}
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
                <tr>
                  <th>Type d'entretien</th>
                  <th>Cible</th>
                  <th>Initial</th>
                  <th>Répétition</th>
                  <th>Prix</th>
                  <th>Score</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(rule => (
                  <tr key={rule.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{rule.maintenance_types?.code}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{rule.maintenance_types?.name}</div>
                    </td>
                    <td><span className="badge badge-gray">{describeRule(rule)}</span></td>
                    <td>
                      {rule.initial_months || rule.initial_km ? (
                        <span className="mono">
                          {rule.initial_months ? `${rule.initial_months}m` : '—'} / {rule.initial_km ? `${rule.initial_km.toLocaleString()}km` : '—'}
                        </span>
                      ) : <span style={{ color: 'var(--gray-300)' }}>—</span>}
                    </td>
                    <td>
                      {rule.repeat_months || rule.repeat_km ? (
                        <span className="mono">
                          {rule.repeat_months ? `${rule.repeat_months}m` : '—'} / {rule.repeat_km ? `${rule.repeat_km.toLocaleString()}km` : '—'}
                        </span>
                      ) : <span style={{ color: 'var(--gray-300)' }}>—</span>}
                    </td>
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

      {/* Modal création/édition */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Modifier la règle' : 'Nouvelle règle'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">

              {/* Type d'entretien */}
              <div className="section-label">Type d'entretien</div>
              <div className="form-group">
                <label>Type d'entretien *</label>
                <select value={form.maintenance_type_id} onChange={e => setField('maintenance_type_id', e.target.value)}>
                  <option value="">Sélectionner...</option>
                  {types.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
                </select>
              </div>

              {/* Critères en cascade */}
              <div className="section-label" style={{ marginTop: 20 }}>
                Critères de ciblage
                <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11 }}> — laisser vide = s'applique à tous</span>
              </div>

              {/* Années */}
              <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
                <div>
                  <label>Année de</label>
                  <select value={form.year_from} onChange={e => setField('year_from', e.target.value)}>
                    <option value="">Toutes</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label>Année à</label>
                  <select value={form.year_to} onChange={e => setField('year_to', e.target.value)}>
                    <option value="">Toutes</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Marque — se peuple via NHTSA */}
              <div className="form-group">
                <label>
                  Marque
                  {loadingMakes && <span className="spinner" style={{ width: 12, height: 12, marginLeft: 6 }} />}
                </label>
                <select value={form.make} onChange={e => setField('make', e.target.value)} disabled={loadingMakes}>
                  <option value="">Toutes les marques</option>
                  {makes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {makes.length > 0 && <div className="form-hint">{makes.length} marques disponibles</div>}
              </div>

              {/* Modèle — se peuple quand marque sélectionnée */}
              <div className="form-group">
                <label>
                  Modèle
                  {loadingModels && <span className="spinner" style={{ width: 12, height: 12, marginLeft: 6 }} />}
                </label>
                <select value={form.model} onChange={e => setField('model', e.target.value)} disabled={!form.make || loadingModels}>
                  <option value="">{form.make ? 'Tous les modèles' : 'Sélectionnez une marque d\'abord'}</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {form.make && models.length > 0 && <div className="form-hint">{models.length} modèles disponibles pour {form.make}</div>}
              </div>

              {/* Moteur — se peuple quand modèle sélectionné */}
              <div className="form-group">
                <label>
                  Moteur
                  {loadingEngines && <span className="spinner" style={{ width: 12, height: 12, marginLeft: 6 }} />}
                </label>
                <select value={form.engine} onChange={e => setField('engine', e.target.value)} disabled={!form.model || loadingEngines}>
                  <option value="">{form.model ? 'Tous les moteurs' : 'Sélectionnez un modèle d\'abord'}</option>
                  {engines.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {/* Transmission, Propulsion, Carburant */}
              <div className="form-row form-row-3" style={{ marginBottom: 12 }}>
                <div>
                  <label>Transmission</label>
                  <select value={form.transmission} onChange={e => setField('transmission', e.target.value)}>
                    <option value="">Toutes</option>
                    {TRANSMISSION_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label>Propulsion</label>
                  <select value={form.drive_type} onChange={e => setField('drive_type', e.target.value)}>
                    <option value="">Toutes</option>
                    {DRIVE_TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label>Carburant</label>
                  <select value={form.fuel_type} onChange={e => setField('fuel_type', e.target.value)}>
                    <option value="">Tous</option>
                    {FUEL_TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Intervalles */}
              <div className="section-label" style={{ marginTop: 20 }}>Intervalles et prix</div>
              <div className="form-row form-row-4" style={{ marginBottom: 12 }}>
                <div>
                  <label>Initial — Mois</label>
                  <input type="number" placeholder="ex: 12" value={form.initial_months} onChange={e => setField('initial_months', e.target.value)} />
                </div>
                <div>
                  <label>Initial — Km</label>
                  <input type="number" placeholder="ex: 20000" value={form.initial_km} onChange={e => setField('initial_km', e.target.value)} />
                </div>
                <div>
                  <label>Répétition — Mois</label>
                  <input type="number" placeholder="ex: 12" value={form.repeat_months} onChange={e => setField('repeat_months', e.target.value)} />
                </div>
                <div>
                  <label>Répétition — Km</label>
                  <input type="number" placeholder="ex: 20000" value={form.repeat_km} onChange={e => setField('repeat_km', e.target.value)} />
                </div>
              </div>

              <div className="form-row form-row-2">
                <div>
                  <label>Prix ($)</label>
                  <input type="number" step="0.01" placeholder="ex: 89.95" value={form.price} onChange={e => setField('price', e.target.value)} />
                </div>
                <div>
                  <label>Notes internes</label>
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

      {/* Confirmation suppression */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">Supprimer la règle?</h2>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--gray-600)' }}>Cette action est irréversible.</p>
            </div>
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
