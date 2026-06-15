// ================================================
// Normalisation des valeurs brutes → GarageOps
// Sources : NHTSA, VinQuery, données clients importées
// ================================================

// --- PROPULSION ---
export const DRIVE_TYPE_MAP = {
  // NHTSA standard
  'Front-Wheel Drive': 'FWD',
  'Rear-Wheel Drive': 'RWD',
  'All-Wheel Drive': 'AWD',
  '4-Wheel Drive': '4WD',
  '4-Wheel Drive/4-Wheel Drive': '4WD',
  'All-Wheel Drive/4-Wheel Drive': 'AWD',
  '4WD/AWD': 'AWD',
  '2-Wheel Drive': 'RWD',
  '4WD/4-Wheel Drive/4x4': '4WD',
  'AWD/All-Wheel Drive': 'AWD',
  'RWD/Rear-Wheel Drive': 'RWD',
  'FWD/Front-Wheel Drive': 'FWD',
  // Données clients
  'fwd': 'FWD',
  'FWD': 'FWD',
  'Traction': 'FWD',
  'traction': 'FWD',
  'front-wheel drive': 'FWD',
  'avant': 'FWD',
  'AVANT': 'FWD',
  'rwd': 'RWD',
  'RWD': 'RWD',
  '2wd': 'RWD',
  '2WD': 'RWD',
  'ARRIERE': 'RWD',
  'Arriere': 'RWD',
  'arriere': 'RWD',
  'arrière': 'RWD',
  'Arrière': 'RWD',
  '4X2': 'RWD',
  '4x2': 'RWD',
  'rear-wheel drive': 'RWD',
  'propulsion': 'RWD',
  'Propulsion': 'RWD',
  'prop': 'RWD',
  'Prop': 'RWD',
  'awd': 'AWD',
  'AWD': 'AWD',
  'all-wheel drive': 'AWD',
  'All-wheel drive': 'AWD',
  '4wd': '4WD',
  '4WD': '4WD',
  '4x4': '4WD',
  '4X4': '4WD',
  '44': '4WD',
  '4 roues motrices': '4WD',
  '4 roues motrices ou 4x4': '4WD',
  'quatre roues motrices': '4WD',
}

// Cascade de patterns pour la propulsion (ordre = priorité)
// Appliquée si aucun match exact trouvé dans DRIVE_TYPE_MAP
export const DRIVE_TYPE_PATTERNS = [
  { pattern: /4x4|4wd|4-wheel|4 roues|quatre roues/i, value: '4WD' },
  { pattern: /awd|all-wheel|all wheel/i, value: 'AWD' },
  { pattern: /fwd|front.wheel|front wheel|traction|avant/i, value: 'FWD' },
  { pattern: /rwd|rear.wheel|rear wheel|propulsion|prop\b|arriere|arrière|2wd|2-wheel|4x2/i, value: 'RWD' },
]

// --- TRANSMISSION ---
export const TRANSMISSION_MAP = {
  // NHTSA standard
  'Automatic': 'AUTO',
  'Manual/Standard': 'MANUAL',
  'Manual': 'MANUAL',
  'Continuously Variable Transmission (CVT)': 'CVT',
  'Automated Manual Transmission (AMT)': 'AMT',
  'Dual-Clutch Transmission (DCT)': 'DCT',
  'Semi-Automatic': 'SEMI-AUTO',
  // Données clients — AUTO
  '8A': 'AUTO', '7A': 'AUTO', '6A': 'AUTO', '5A': 'AUTO',
  '4A': 'AUTO', '4A ': 'AUTO', '3A': 'AUTO', '9A': 'AUTO',
  '10A': 'AUTO', '1A': 'AUTO',
  '4SP': 'AUTO',
  'auto': 'AUTO',
  'AUTOMATIC': 'AUTO',
  'Automatique': 'AUTO',
  'automatique': 'AUTO',
  'Automatiquement': 'AUTO',
  '3 speed': 'MANUAL',
  '3 speeds': 'MANUAL',
  '4 Speed': 'MANUAL',
  '4 Speeds': 'MANUAL',
  // Données clients — MANUAL
  '5M': 'MANUAL', '6M': 'MANUAL',
  '5m': 'MANUAL', '6m': 'MANUAL',
  'manuel': 'MANUAL',
  'Manuel': 'MANUAL',
  'Manuelle': 'MANUAL',
  'manuelle': 'MANUAL',
  'Standard': 'MANUAL',
  'standard': 'MANUAL',
  '5 speed': 'MANUAL', '5 speeds': 'MANUAL', '5SP': 'MANUAL', '5sp': 'MANUAL',
  '6 speed': 'MANUAL', '6 speeds': 'MANUAL',
  '7 speed': 'MANUAL', '7 speeds': 'MANUAL',
  '3 vitesses manuelle': 'MANUAL',
  '4 vitesses manuelle': 'MANUAL',
  '5 vitesses manuelle': 'MANUAL',
  '6 vitesses manuelle': 'MANUAL',
  '7 vitesses manuelle': 'MANUAL',
  // Données clients — CVT
  'CVT': 'CVT',
  'Electronic Continuously Variable (e-CVT)': 'CVT',
  'e-CVT': 'CVT',
  'e-cvt': 'CVT',
  'Automatic CVT (N/R Speed, P510)': 'CVT',
  // Données clients — DCT
  'DSG': 'DCT',
  'dsg': 'DCT',
  'S-Tronic': 'DCT',
  's-tronic': 'DCT',
  'PDK': 'DCT',
  'pdk': 'DCT',
}

// Cascade de patterns pour la transmission (ordre = priorité)
export const TRANSMISSION_PATTERNS = [
  { pattern: /cvt|continuously variable|variable continue/i, value: 'CVT' },
  { pattern: /dct|dsg|s-tronic|pdk|dual.clutch|double embrayage/i, value: 'DCT' },
  { pattern: /amt|automated manual/i, value: 'AMT' },
  { pattern: /semi.auto/i, value: 'SEMI-AUTO' },
  { pattern: /manual|manuelle|manuel|standard|vitesse manuelle|\dm$|\dsp$/i, value: 'MANUAL' },
  { pattern: /auto|automatique|\da$/i, value: 'AUTO' },
]

// --- CARBURANT ---
export const FUEL_TYPE_MAP = {
  // NHTSA standard
  'Gasoline': 'GASOLINE',
  'Diesel': 'DIESEL',
  'Electric': 'ELECTRIC',
  'Flex-Fuel (E85)': 'GASOLINE',
  'Gasoline/Electric Hybrid': 'HYBRID',
  'Plug-in Electric/Gasoline': 'PHEV',
  'Natural Gas': 'CNG',
  // Données clients — GASOLINE
  'essence': 'GASOLINE',
  'Essence': 'GASOLINE',
  'ESSENCE': 'GASOLINE',
  'gaz': 'GASOLINE',
  'Gaz': 'GASOLINE',
  'GAZ': 'GASOLINE',
  'gazoline': 'GASOLINE',
  'Gazoline': 'GASOLINE',
  'gas': 'GASOLINE',
  'GAS': 'GASOLINE',
  'GASOLINE': 'GASOLINE',
  // Données clients — DIESEL
  'diesel': 'DIESEL',
  'DIESEL': 'DIESEL',
  // Données clients — HYBRID
  'Hybrid': 'HYBRID',
  'hybrid': 'HYBRID',
  'HYBRID': 'HYBRID',
  'Hybride': 'HYBRID',
  'hybride': 'HYBRID',
  'HYBRIDE': 'HYBRID',
  // Données clients — PHEV
  'PHEV': 'PHEV',
  'phev': 'PHEV',
  'hybride rechargeable': 'PHEV',
  'Hybride rechargeable': 'PHEV',
  'hybride branchable': 'PHEV',
  'Hybride branchable': 'PHEV',
  'Plug-in Hybrid': 'PHEV',
  'plug-in hybrid': 'PHEV',
  // Données clients — ELECTRIC
  'ELECTRIC': 'ELECTRIC',
  'électrique': 'ELECTRIC',
  'Électrique': 'ELECTRIC',
  'ÉLECTRIQUE': 'ELECTRIC',
  'electrique': 'ELECTRIC',
  'Electrique': 'ELECTRIC',
  'ELECTRIQUE': 'ELECTRIC',
  'EV': 'ELECTRIC',
  'ev': 'ELECTRIC',
  'BEV': 'ELECTRIC',
  'bev': 'ELECTRIC',
  // Données clients — CNG
  'cng': 'CNG',
  'CNG': 'CNG',
  'gaz naturel': 'CNG',
  'Gaz naturel': 'CNG',
  'natural gas': 'CNG',
  'Natural Gas': 'CNG',
}

// Cascade de patterns pour le carburant (ordre = priorité)
export const FUEL_TYPE_PATTERNS = [
  { pattern: /phev|plug.in|rechargeable|branchable/i, value: 'PHEV' },
  { pattern: /electric|électr|electr|\bev\b|\bbev\b/i, value: 'ELECTRIC' },
  { pattern: /hybrid|hybride/i, value: 'HYBRID' },
  { pattern: /diesel/i, value: 'DIESEL' },
  { pattern: /gaz naturel|natural gas|\bcng\b/i, value: 'CNG' },
  { pattern: /gas|essence|gaz|flex|e85|gazoline/i, value: 'GASOLINE' },
]

// --- LISTES D'OPTIONS (générateur de règles) ---
export const DRIVE_TYPE_OPTIONS = ['FWD', 'RWD', 'AWD', '4WD']
export const TRANSMISSION_OPTIONS = ['AUTO', 'MANUAL', 'CVT', 'DCT', 'AMT', 'SEMI-AUTO']
export const FUEL_TYPE_OPTIONS = ['GASOLINE', 'DIESEL', 'HYBRID', 'PHEV', 'ELECTRIC', 'CNG']
export const CATEGORY_OPTIONS = ['AUTO', 'VUS/VAN', 'Camionnette']

// Cylindrée (L) — liste fixe normalisée
export const DISPLACEMENT_OPTIONS = [
  '0.6','0.9','1.0','1.1','1.2','1.3','1.4','1.5','1.6','1.7','1.8','1.9',
  '2.0','2.1','2.2','2.3','2.4','2.5','2.6','2.7','2.8','2.9',
  '3.0','3.1','3.2','3.3','3.4','3.5','3.6','3.7','3.8','3.9',
  '4.0','4.1','4.2','4.3','4.4','4.5','4.6','4.7','4.8','4.9',
  '5.0','5.2','5.3','5.4','5.5','5.6','5.7','5.8','5.9',
  '6.0','6.1','6.2','6.3','6.4','6.5','6.6','6.7','6.8',
  '7.0','7.4','8.0','8.3',
]

// Nombre de cylindres — liste fixe normalisée
export const CYLINDER_OPTIONS = ['3', '4', '5', '6', '8', '10', '12', 'ELECTRIC']

// ================================================
// Fonctions de normalisation (avec cascade patterns)
// ================================================

function normalizeWithFallback(raw, map, patterns) {
  if (!raw) return null
  // 1. Match exact (insensible à la casse)
  if (map[raw]) return map[raw]
  const lc = raw.toLowerCase().trim()
  for (const [key, val] of Object.entries(map)) {
    if (key.toLowerCase() === lc) return val
  }
  // 2. Cascade de patterns
  for (const { pattern, value } of patterns) {
    if (pattern.test(raw)) return value
  }
  // 3. Retourne la valeur brute si rien ne matche
  return raw
}

export function normalizeDriveType(raw) {
  return normalizeWithFallback(raw, DRIVE_TYPE_MAP, DRIVE_TYPE_PATTERNS)
}

export function normalizeTransmission(raw) {
  return normalizeWithFallback(raw, TRANSMISSION_MAP, TRANSMISSION_PATTERNS)
}

export function normalizeFuelType(raw) {
  return normalizeWithFallback(raw, FUEL_TYPE_MAP, FUEL_TYPE_PATTERNS)
}

export function normalizeVehicle(nhtsaResult) {
  const fuel_type = normalizeFuelType(nhtsaResult.FuelTypePrimary)
  const isElectric = fuel_type === 'ELECTRIC'

  const rawTransmission = nhtsaResult.TransmissionStyle
  const transmission = rawTransmission
    ? normalizeTransmission(rawTransmission)
    : null

  const displacementL = nhtsaResult.DisplacementL ? parseFloat(nhtsaResult.DisplacementL) : null
  const engine = displacementL
    ? `${displacementL.toFixed(1)}L`
    : (isElectric ? 'Électrique' : null)

  // Normalisation intelligente de la propulsion :
  // "4x2" / "2WD" est ambigu — pickup truck → RWD, tout le reste → FWD
  const rawDrive = nhtsaResult.DriveType || ''
  let drive_type
  if (/^(4x2|4X2|2wd|2WD|2-wheel drive)$/i.test(rawDrive.trim())) {
    const bodyClass = nhtsaResult.BodyClass || ''
    drive_type = /pickup|truck/i.test(bodyClass) ? 'RWD' : 'FWD'
  } else {
    drive_type = normalizeDriveType(rawDrive || null)
  }

  return {
    year: parseInt(nhtsaResult.ModelYear) || null,
    make: nhtsaResult.Make || null,
    model: nhtsaResult.Model || null,
    engine,
    transmission,
    drive_type,
    fuel_type,
    category: null,
    raw: {
      transmission: nhtsaResult.TransmissionStyle,
      drive_type: nhtsaResult.DriveType,
      fuel_type: nhtsaResult.FuelTypePrimary,
      body_class: nhtsaResult.BodyClass,
      engine_hp: nhtsaResult.EngineHP,
      cylinders: nhtsaResult.EngineCylinders,
      displacement: nhtsaResult.DisplacementL,
    }
  }
}

// ================================================
// Score de spécificité
// ================================================
export function scoreRule(rule) {
  let s = 0
  if (rule.categories?.length > 0) s += 3
  if (rule.year_from || rule.year_to) s += 2
  if (rule.makes?.length > 0 || rule.make) s += 3
  if (rule.models?.length > 0 || rule.model) s += 4
  if (rule.transmissions?.length > 0 || rule.transmission) s += 2
  if (rule.drive_types?.length > 0 || rule.drive_type) s += 2
  if (rule.fuel_types?.length > 0 || rule.fuel_type) s += 2
  if (rule.engines?.length > 0 || rule.engine) s += 1
  if (rule.cylinders?.length > 0 || rule.cylinder) s += 1
  return s
}

// ================================================
// Moteur de règles — matching
// ================================================
export function matchRules(vehicle, rules) {
  const matched = []

  for (const rule of rules) {
    let score = 0
    let matches = true

    if (rule.categories?.length > 0) {
      if (!vehicle.category || !rule.categories.includes(vehicle.category)) { matches = false; continue }
      score += 3
    }

    if (rule.year_from || rule.year_to) {
      const from = rule.year_from || 0
      const to = rule.year_to || 9999
      if (!vehicle.year || vehicle.year < from || vehicle.year > to) { matches = false; continue }
      score += 2
    }

    const makes = rule.makes?.length > 0 ? rule.makes : (rule.make ? [rule.make] : [])
    if (makes.length > 0) {
      if (!vehicle.make || !makes.some(m => m.toUpperCase() === vehicle.make.toUpperCase())) { matches = false; continue }
      score += 3
    }

    const models = rule.models?.length > 0 ? rule.models : (rule.model ? [rule.model] : [])
    if (models.length > 0) {
      if (!vehicle.model || !models.some(m => m.toUpperCase() === vehicle.model.toUpperCase())) { matches = false; continue }
      score += 4
    }

    const transmissions = rule.transmissions?.length > 0 ? rule.transmissions : (rule.transmission ? [rule.transmission] : [])
    if (transmissions.length > 0) {
      if (!vehicle.transmission || !transmissions.includes(vehicle.transmission)) { matches = false; continue }
      score += 2
    }

    const driveTypes = rule.drive_types?.length > 0 ? rule.drive_types : (rule.drive_type ? [rule.drive_type] : [])
    if (driveTypes.length > 0) {
      if (!vehicle.drive_type || !driveTypes.includes(vehicle.drive_type)) { matches = false; continue }
      score += 2
    }

    const fuelTypes = rule.fuel_types?.length > 0 ? rule.fuel_types : (rule.fuel_type ? [rule.fuel_type] : [])
    if (fuelTypes.length > 0) {
      if (!vehicle.fuel_type || !fuelTypes.includes(vehicle.fuel_type)) { matches = false; continue }
      score += 2
    }

    const engines = rule.engines?.length > 0 ? rule.engines : (rule.engine ? [rule.engine] : [])
    if (engines.length > 0) {
      if (!vehicle.engine || !engines.some(e => vehicle.engine.includes(e.replace('L', '')))) { matches = false; continue }
      score += 1
    }

    if (matches) matched.push({ ...rule, score })
  }

  matched.sort((a, b) => b.score - a.score)

  const best = {}
  for (const rule of matched) {
    const typeId = rule.maintenance_type_id
    if (!best[typeId] || rule.score > best[typeId].score) best[typeId] = rule
  }

  return { all: matched, best: Object.values(best) }
}
