// ================================================
// Normalisation des valeurs NHTSA → GarageOps
// ================================================
// Ajouter de nouvelles valeurs ici au fur et à mesure

export const DRIVE_TYPE_MAP = {
  'Front-Wheel Drive': 'FWD',
  'Rear-Wheel Drive': 'RWD',
  'All-Wheel Drive': 'AWD',
  '4-Wheel Drive': '4WD',
  '4-Wheel Drive/4-Wheel Drive': '4WD',
  'All-Wheel Drive/4-Wheel Drive': 'AWD',
  '4WD/AWD': 'AWD',
  '2-Wheel Drive': '2WD',
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
  'Flex-Fuel (E85)': 'FLEX',
  'Gasoline/Electric Hybrid': 'HYBRID',
  'Plug-in Electric/Gasoline': 'PHEV',
  'Natural Gas': 'CNG',
  'Hydrogen': 'HYDROGEN',
}

// Valeurs disponibles dans les dropdowns de création de règles
export const DRIVE_TYPE_OPTIONS = ['FWD', 'RWD', 'AWD', '4WD', '2WD']
export const TRANSMISSION_OPTIONS = ['AUTO', 'MANUAL', 'CVT', 'DCT', 'AMT', 'SEMI-AUTO']
export const FUEL_TYPE_OPTIONS = ['GASOLINE', 'DIESEL', 'HYBRID', 'PHEV', 'ELECTRIC', 'FLEX', 'CNG']

export function normalizeVehicle(nhtsaResult) {
  return {
    year: parseInt(nhtsaResult.ModelYear) || null,
    make: nhtsaResult.Make || null,
    model: nhtsaResult.Model || null,
    engine: nhtsaResult.DisplacementL ? `${nhtsaResult.DisplacementL}L` : null,
    transmission: TRANSMISSION_MAP[nhtsaResult.TransmissionStyle] || nhtsaResult.TransmissionStyle || null,
    drive_type: DRIVE_TYPE_MAP[nhtsaResult.DriveType] || nhtsaResult.DriveType || null,
    fuel_type: FUEL_TYPE_MAP[nhtsaResult.FuelTypePrimary] || nhtsaResult.FuelTypePrimary || null,
    // Données brutes pour affichage
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

// Moteur de règles — trouve et classe les règles applicables
export function matchRules(vehicle, rules) {
  const matched = []

  for (const rule of rules) {
    let score = 0
    let matches = true

    // Année
    if (rule.year_from || rule.year_to) {
      const from = rule.year_from || 0
      const to = rule.year_to || 9999
      if (vehicle.year < from || vehicle.year > to) { matches = false; continue }
      score += 2
    }

    // Marque
    if (rule.make) {
      if (vehicle.make?.toUpperCase() !== rule.make.toUpperCase()) { matches = false; continue }
      score += 3
    }

    // Modèle
    if (rule.model) {
      if (vehicle.model?.toUpperCase() !== rule.model.toUpperCase()) { matches = false; continue }
      score += 4
    }

    // Transmission
    if (rule.transmission) {
      if (vehicle.transmission !== rule.transmission) { matches = false; continue }
      score += 2
    }

    // Propulsion
    if (rule.drive_type) {
      if (vehicle.drive_type !== rule.drive_type) { matches = false; continue }
      score += 2
    }

    // Carburant
    if (rule.fuel_type) {
      if (vehicle.fuel_type !== rule.fuel_type) { matches = false; continue }
      score += 2
    }

    // Moteur
    if (rule.engine) {
      if (!vehicle.engine?.includes(rule.engine)) { matches = false; continue }
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
