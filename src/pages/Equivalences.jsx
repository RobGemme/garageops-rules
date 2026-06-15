import {
  DRIVE_TYPE_MAP,
  TRANSMISSION_MAP,
  FUEL_TYPE_MAP,
  DRIVE_TYPE_OPTIONS,
  TRANSMISSION_OPTIONS,
  FUEL_TYPE_OPTIONS,
} from '../lib/rules-engine'

// Inverse un map { valeurBrute: 'NORMALISÉE' }
// → { 'NORMALISÉE': ['val brute 1', 'val brute 2', ...] }
function invertMap(map) {
  const result = {}
  for (const [raw, normalized] of Object.entries(map)) {
    if (!result[normalized]) result[normalized] = []
    result[normalized].push(raw)
  }
  return result
}

const SECTION_COLORS = {
  // Propulsion
  FWD:  { bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE' },
  RWD:  { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  AWD:  { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
  '4WD':  { bg: '#EDE9FE', color: '#5B21B6', border: '#DDD6FE' },
  '2WD':  { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' },
  // Transmission
  AUTO:       { bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE' },
  MANUAL:     { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  CVT:        { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
  DCT:        { bg: '#EDE9FE', color: '#5B21B6', border: '#DDD6FE' },
  AMT:        { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
  'SEMI-AUTO':{ bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' },
  // Carburant
  GASOLINE:   { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  DIESEL:     { bg: '#1E293B', color: '#F8FAFC', border: '#334155' },
  HYBRID:     { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
  PHEV:       { bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE' },
  ELECTRIC:   { bg: '#EDE9FE', color: '#5B21B6', border: '#DDD6FE' },
  FLEX:       { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
  CNG:        { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' },
}

function EqSection({ title, map, options, icon, description }) {
  const inverted = invertMap(map)

  // Catégories qui ont des valeurs brutes mappées
  const withMappings = options.filter(opt => inverted[opt])
  // Catégories déclarées dans OPTIONS mais sans aucune valeur brute NHTSA
  const withoutMappings = options.filter(opt => !inverted[opt])

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card-header">
        <div>
          <div className="card-title">{icon} {title}</div>
          <div className="card-subtitle">{description}</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'right' }}>
          {Object.keys(map).length} valeur{Object.keys(map).length > 1 ? 's' : ''} brute{Object.keys(map).length > 1 ? 's' : ''}<br />
          → {options.length} catégorie{options.length > 1 ? 's' : ''}
        </div>
      </div>
      <div className="card-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {withMappings.map(normalized => {
            const c = SECTION_COLORS[normalized] || { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' }
            const raws = inverted[normalized]
            return (
              <div key={normalized} style={{ border: `1.5px solid ${c.border}`, borderRadius: 8, overflow: 'hidden' }}>
                {/* En-tête catégorie normalisée */}
                <div style={{ background: c.bg, color: c.color, padding: '8px 12px', fontWeight: 700, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{normalized}</span>
                  <span style={{ fontWeight: 400, fontSize: 11, opacity: 0.7 }}>{raws.length} valeur{raws.length > 1 ? 's' : ''}</span>
                </div>
                {/* Liste des valeurs brutes NHTSA */}
                <div style={{ background: 'white', padding: '6px 0' }}>
                  {raws.map(raw => (
                    <div key={raw} style={{ padding: '4px 12px', fontSize: 12, color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--gray-100)' }}>
                      <span style={{ color: 'var(--gray-300)', fontSize: 10 }}>◀</span>
                      <span className="mono">{raw}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Catégories sans aucune valeur NHTSA mappée */}
          {withoutMappings.map(normalized => {
            const c = SECTION_COLORS[normalized] || { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' }
            return (
              <div key={normalized} style={{ border: `1.5px dashed ${c.border}`, borderRadius: 8, overflow: 'hidden', opacity: 0.55 }}>
                <div style={{ background: c.bg, color: c.color, padding: '8px 12px', fontWeight: 700, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{normalized}</span>
                  <span style={{ fontWeight: 400, fontSize: 11 }}>aucune valeur</span>
                </div>
                <div style={{ background: 'white', padding: '10px 12px', fontSize: 12, color: 'var(--gray-400)', fontStyle: 'italic' }}>
                  Aucune valeur NHTSA mappée
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Equivalences() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Équivalences</h1>
        <p className="page-subtitle">
          Tables de normalisation : comment les valeurs brutes NHTSA sont traduites vers les catégories GarageOps.
          Pour modifier un mapping, contactez l'administrateur système.
        </p>
      </div>

      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#92400E', display: 'flex', gap: 10 }}>
        <span>ℹ️</span>
        <span>Ces tables s'appliquent lors du décodage VIN dans le Simulateur. Chaque valeur brute retournée par NHTSA (<span className="mono">DriveType</span>, <span className="mono">TransmissionStyle</span>, <span className="mono">FuelTypePrimary</span>) est traduite vers la catégorie normalisée correspondante avant d'être comparée aux règles.</span>
      </div>

      <EqSection
        title="Propulsion"
        icon="🔧"
        map={DRIVE_TYPE_MAP}
        options={DRIVE_TYPE_OPTIONS}
        description="Valeur brute NHTSA (DriveType) → catégorie normalisée GarageOps"
      />

      <EqSection
        title="Transmission"
        icon="⚙️"
        map={TRANSMISSION_MAP}
        options={TRANSMISSION_OPTIONS}
        description="Valeur brute NHTSA (TransmissionStyle) → catégorie normalisée GarageOps"
      />

      <EqSection
        title="Carburant"
        icon="⛽"
        map={FUEL_TYPE_MAP}
        options={FUEL_TYPE_OPTIONS}
        description="Valeur brute NHTSA (FuelTypePrimary) → catégorie normalisée GarageOps"
      />
    </div>
  )
}
