// ================================================
// Export / import des règles en CSV
// Format "plat" : 1 ligne = 1 règle, valeurs multiples
// séparées par "|" (pipe). Toutes les valeurs sont déjà
// normalisées (mêmes codes que ceux produits par le
// décodage VIN en production : FWD/AWD/RWD/4WD/2WD,
// AUTO/MANUAL/CVT/DCT/AMT/SEMI-AUTO, GASOLINE/DIESEL/
// HYBRID/PHEV/ELECTRIC, AUTO/VUS-VAN/Camionnette).
// ================================================

import { scoreRule } from './rules-engine'

export const CSV_COLUMNS = [
  'product_code',
  'maintenance_code',
  'maintenance_name',
  'categories',
  'year_from',
  'year_to',
  'makes',
  'models',
  'transmissions',
  'drive_types',
  'fuel_types',
  'engines',
  'cylinders',
  'initial_months',
  'initial_km',
  'repeat_months',
  'repeat_km',
  'price',
  'notes',
  'score',
]

// --- Helpers ---
function multi(rule, plural, singular) {
  if (rule[plural]?.length > 0) return rule[plural]
  if (rule[singular]) return [rule[singular]]
  return []
}

function csvEscape(val) {
  const s = val === null || val === undefined ? '' : String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

// --- Export ---
export function ruleToRow(rule) {
  return {
    product_code: rule.product_code || '',
    maintenance_code: rule.maintenance_types?.code || '',
    maintenance_name: rule.maintenance_types?.name || '',
    categories: (rule.categories || []).join('|'),
    year_from: rule.year_from ?? '',
    year_to: rule.year_to ?? '',
    makes: multi(rule, 'makes', 'make').join('|'),
    models: multi(rule, 'models', 'model').join('|'),
    transmissions: multi(rule, 'transmissions', 'transmission').join('|'),
    drive_types: multi(rule, 'drive_types', 'drive_type').join('|'),
    fuel_types: multi(rule, 'fuel_types', 'fuel_type').join('|'),
    engines: multi(rule, 'engines', 'engine').join('|'),
    cylinders: multi(rule, 'cylinders', 'cylinder').join('|'),
    initial_months: rule.initial_months ?? '',
    initial_km: rule.initial_km ?? '',
    repeat_months: rule.repeat_months ?? '',
    repeat_km: rule.repeat_km ?? '',
    price: rule.price ?? '',
    notes: rule.notes || '',
    score: scoreRule(rule),
  }
}

export function rulesToCsv(rules) {
  const lines = [CSV_COLUMNS.join(',')]
  for (const rule of rules) {
    const row = ruleToRow(rule)
    lines.push(CSV_COLUMNS.map(c => csvEscape(row[c])).join(','))
  }
  // BOM pour qu'Excel ouvre correctement les accents en UTF-8
  return '\uFEFF' + lines.join('\r\n')
}

export function downloadCsv(rules, filename = 'garageops-rules.csv') {
  const csv = rulesToCsv(rules)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// --- Import / décodage ---
// Parser CSV minimal, gère les champs entre guillemets
// (virgules / guillemets / retours de ligne échappés).
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  const src = text.replace(/^\uFEFF/, '') // retirer le BOM s'il est présent

  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') { row.push(field); field = '' }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && src[i + 1] === '\n') i++
        row.push(field); field = ''
        if (row.length > 1 || row[0] !== '') rows.push(row)
        row = []
      } else field += c
    }
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row) }
  return rows
}

// Transforme les lignes CSV (avec en-tête) en objets "règle décodée"
export function csvToRules(text) {
  const rows = parseCsv(text)
  if (rows.length === 0) return []
  const header = rows[0].map(h => h.trim())
  return rows.slice(1).map(cols => {
    const obj = {}
    header.forEach((key, i) => { obj[key] = (cols[i] ?? '').trim() })
    return decodeRow(obj)
  })
}

const splitPipe = v => (v ? v.split('|').filter(Boolean) : [])

// Transforme une ligne CSV brute en objet "règle" prêt pour
// l'affichage (et utilisable directement par matchRules côté GarageOps)
export function decodeRow(row) {
  return {
    product_code: row.product_code || null,
    maintenance_code: row.maintenance_code || null,
    maintenance_name: row.maintenance_name || null,
    categories: splitPipe(row.categories),
    year_from: row.year_from ? parseInt(row.year_from) : null,
    year_to: row.year_to ? parseInt(row.year_to) : null,
    makes: splitPipe(row.makes),
    models: splitPipe(row.models),
    transmissions: splitPipe(row.transmissions),
    drive_types: splitPipe(row.drive_types),
    fuel_types: splitPipe(row.fuel_types),
    engines: splitPipe(row.engines),
    cylinders: splitPipe(row.cylinders),
    initial_months: row.initial_months ? parseInt(row.initial_months) : null,
    initial_km: row.initial_km ? parseInt(row.initial_km) : null,
    repeat_months: row.repeat_months ? parseInt(row.repeat_months) : null,
    repeat_km: row.repeat_km ? parseInt(row.repeat_km) : null,
    price: row.price ? parseFloat(row.price) : null,
    notes: row.notes || null,
    score: row.score ? parseInt(row.score) : null,
  }
}

// Description lisible (français) d'une règle décodée — pour
// affichage et validation visuelle avant import en production.
export function describeDecodedRule(rule) {
  const parts = []
  if (rule.categories?.length) parts.push(rule.categories.join(', '))
  if (rule.year_from || rule.year_to) parts.push(`${rule.year_from || '?'}–${rule.year_to || '?'}`)
  if (rule.makes?.length) parts.push(rule.makes.join(', '))
  if (rule.models?.length) parts.push(rule.models.join(', '))
  if (rule.transmissions?.length) parts.push(rule.transmissions.join(', '))
  if (rule.drive_types?.length) parts.push(rule.drive_types.join(', '))
  if (rule.fuel_types?.length) parts.push(rule.fuel_types.join(', '))
  if (rule.engines?.length) parts.push(rule.engines.map(e => `${e}L`).join(', '))
  if (rule.cylinders?.length) parts.push(rule.cylinders.map(c => c === 'ELECTRIC' ? 'Électrique' : `${c} cyl`).join(', '))
  return parts.length ? parts.join(' · ') : 'Tous véhicules'
}
