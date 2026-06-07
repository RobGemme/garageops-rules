import { useState } from 'react'

export default function Login({ onLogin }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')

  function handleLogin() {
    if (user.toLowerCase() === 'dylan' && pass === 'wynns') {
      onLogin()
    } else {
      setError('Identifiants invalides. Réessayez.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--gray-50)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="#2563EB"/>
              <path d="M7 14.5L11.5 19L21 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)' }}>
              GarageOps <span style={{ color: 'var(--blue)' }}>Rules</span>
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Accès démo — Wynn's</div>
        </div>

        {/* Card */}
        <div className="card">
          <div className="card-body" style={{ padding: 28 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 5 }}>Utilisateur</div>
              <input
                value={user}
                onChange={e => setUser(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Nom d'utilisateur"
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 5 }}>Mot de passe</div>
              <input
                type="password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Mot de passe"
              />
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <button className="btn btn-primary" onClick={handleLogin} style={{ width: '100%', justifyContent: 'center', padding: '10px 16px' }}>
              Se connecter
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--gray-400)' }}>
          Version prototype — GarageOps © 2026
        </div>
      </div>
    </div>
  )
}
