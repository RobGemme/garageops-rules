// ================================================
// Normalisation des valeurs NHTSA → GarageOps
// ================================================

export const DRIVE_TYPE_MAP = {
  'Front-Wheel Drive': 'FWD',
  'Rear-Wheel Drive': 'RWD',
  'All-Wheel Drive': 'AWD',
  '4-Wheel Drive': '4WD',
  '4-Wheel Drive/4-Wheel Drive': '4WD',
  'All-Wheel Drive/4-Wheel Drive': 'AWD',
  '4WD/AWD': 'AWD',
  '2-Wheel Drive': '2WD',
  '4WD/4-Wheel Drive/4x4': '4WD',
  'AWD/All-Wheel Drive': 'AWD',
  'RWD/Rear-Wheel Drive': 'RWD',
  'FWD/Front-Wheel Drive': 'FWD',
} 

export const TRANSMISSION_MAP = {
  'Automatic': 'AUTO',
  'Manual/Standard': 'MANUAL',
  'Manual': 'MANUAL',
  'Continuously Variable Transmission (CVT)': 'CVT',
  'Automated Manual Transmission (AMT)': 'AMT',
  'Dual-Clutch Transmission (DCT)': 'DCT',
  'Semi-Automatic': 'SEMI-AUTO',
}

export const FUEL_TYPE_MAP = {
  'Gasoline': 'GASOLINE',
  'Diesel': 'DIESEL',
  'Electric': 'ELECTRIC',
  'Flex-Fuel (E85)': 'GASOLINE',
  'Gasoline/Electric Hybrid': 'HYBRID',
  'Plug-in Electric/Gasoline': 'PHEV',
  'Natural Gas': 'CNG',
  'Hydrogen': 'HYDROGEN',
}

export const DRIVE_TYPE_OPTIONS = ['FWD', 'RWD', 'AWD', '4WD', '2WD']
export const TRANSMISSION_OPTIONS = ['AUTO', 'MANUAL', 'CVT', 'DCT', 'AMT', 'SEMI-AUTO']
export const FUEL_TYPE_OPTIONS = ['GASOLINE', 'DIESEL', 'HYBRID', 'PHEV', 'ELECTRIC', 'FLEX', 'CNG']
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

// Nombre de cylindres — liste fixe normalisée (basée sur EngineCylinders/NHTSA)
export const CYLINDER_OPTIONS = ['3', '4', '5', '6', '8', '10', '12', 'ELECTRIC']

// Score de spécificité d'une règle (somme des critères remplis).
// Utilisé pour le tri/affichage et pour l'export CSV.
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

export function normalizeVehicle(nhtsaResult) {
  return {
    year: parseInt(nhtsaResult.ModelYear) || null,
    make: nhtsaResult.Make || null,
    model: nhtsaResult.Model || null,
    engine: nhtsaResult.DisplacementL ? `${parseFloat(nhtsaResult.DisplacementL).toFixed(1)}L` : null,
    transmission: TRANSMISSION_MAP[nhtsaResult.TransmissionStyle] || nhtsaResult.TransmissionStyle || null,
    drive_type: DRIVE_TYPE_MAP[nhtsaResult.DriveType] || nhtsaResult.DriveType || null,
    fuel_type: FUEL_TYPE_MAP[nhtsaResult.FuelTypePrimary] || nhtsaResult.FuelTypePrimary || null,
    // category est ajoutée séparément (lookup table vehicles par make/model/year)
    category: null,
    raw: {
      transmission: nhtsaResult.TransmissionStyle,
      drive_type: nhtsaResult.DriveType,
      fuel_type: nhtsaResult.FuelTypePrimary,
      body_class: nhtsaResult.BodyClass,
      engine_hp: nhtsaResult.EngineHP,
      cylinders: nhtsaResult.EngineCylinders,
    }
  }
}

// ================================================
// Moteur de règles — matching avec support tableaux
// ================================================
export function matchRules(vehicle, rules) {
  const matched = []

  for (const rule of rules) {
    let score = 0
    let matches = true

    // --- Catégorie de véhicule (Auto / VUS-VAN / Camionnette) ---
    if (rule.categories?.length > 0) {
      if (!vehicle.category) { matches = false; continue }
      if (!rule.categories.includes(vehicle.category)) { matches = false; continue }
      score += 3
    }

    // --- Année ---
    if (rule.year_from || rule.year_to) {
      const from = rule.year_from || 0
      const to = rule.year_to || 9999
      if (!vehicle.year || vehicle.year < from || vehicle.year > to) { matches = false; continue }
      score += 2
    }

    // --- Marque (supporte makes[] et make) ---
    const makes = rule.makes?.length > 0 ? rule.makes : (rule.make ? [rule.make] : [])
    if (makes.length > 0) {
      if (!vehicle.make) { matches = false; continue }
      const vehicleMakeUp = vehicle.make.toUpperCase()
      if (!makes.some(m => m.toUpperCase() === vehicleMakeUp)) { matches = false; continue }
      score += 3
    }

    // --- Modèle (supporte models[] et model) ---
    const models = rule.models?.length > 0 ? rule.models : (rule.model ? [rule.model] : [])
    if (models.length > 0) {
      if (!vehicle.model) { matches = false; continue }
      const vehicleModelUp = vehicle.model.toUpperCase()
      if (!models.some(m => m.toUpperCase() === vehicleModelUp)) { matches = false; continue }
      score += 4
    }

    // --- Transmission (supporte transmissions[] et transmission) ---
    const transmissions = rule.transmissions?.length > 0 ? rule.transmissions : (rule.transmission ? [rule.transmission] : [])
    if (transmissions.length > 0) {
      if (!vehicle.transmission) { matches = false; continue }
      if (!transmissions.includes(vehicle.transmission)) { matches = false; continue }
      score += 2
    }

    // --- Propulsion (supporte drive_types[] et drive_type) ---
    const driveTypes = rule.drive_types?.length > 0 ? rule.drive_types : (rule.drive_type ? [rule.drive_type] : [])
    if (driveTypes.length > 0) {
      if (!vehicle.drive_type) { matches = false; continue }
      if (!driveTypes.includes(vehicle.drive_type)) { matches = false; continue }
      score += 2
    }

    // --- Carburant (supporte fuel_types[] et fuel_type) ---
    const fuelTypes = rule.fuel_types?.length > 0 ? rule.fuel_types : (rule.fuel_type ? [rule.fuel_type] : [])
    if (fuelTypes.length > 0) {
      if (!vehicle.fuel_type) { matches = false; continue }
      if (!fuelTypes.includes(vehicle.fuel_type)) { matches = false; continue }
      score += 2
    }

    // --- Moteur (supporte engines[] et engine) ---
    const engines = rule.engines?.length > 0 ? rule.engines : (rule.engine ? [rule.engine] : [])
    if (engines.length > 0) {
      if (!vehicle.engine) { matches = false; continue }
      if (!engines.some(e => vehicle.engine.includes(e.replace('L', '')))) { matches = false; continue }
      score += 1
    }

    if (matches) {
      matched.push({ ...rule, score })
    }
  }

  // Trier par score décroissant
  matched.sort((a, b) => b.score - a.score)

  // Par type d'entretien, garder seulement la règle avec le score le plus élevé
  const best = {}
  for (const rule of matched) {
    const typeId = rule.maintenance_type_id
    if (!best[typeId] || rule.score > best[typeId].score) {
      best[typeId] = rule
    }
  }

  return {
    all: matched,
    best: Object.values(best),
  }
}
