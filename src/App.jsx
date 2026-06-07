import { useState } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Rules from './pages/Rules.jsx'
import Simulator from './pages/Simulator.jsx'
import Report from './pages/Report.jsx'
import Login from './pages/Login.jsx'

function Topbar({ onLogout }) {
  return (
    <header className="topbar">
      <a href="/" className="topbar-logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="7" fill="#2563EB"/>
          <path d="M7 14.5L11.5 19L21 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        GarageOps <span>Rules</span>
        <span className="topbar-badge">PROTOTYPE</span>
      </a>
      <nav className="nav">
        <NavLink to="/" end className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>📋 Règles</NavLink>
        <NavLink to="/simulateur" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>🔍 Simulateur VIN</NavLink>
        <NavLink to="/rapport" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>📊 Rapport</NavLink>
        <button onClick={onLogout} className="btn btn-secondary btn-sm" style={{ marginLeft: 8 }}>Déconnexion</button>
      </nav>
    </header>
  )
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem('go_auth') === '1')

  function handleLogin() {
    sessionStorage.setItem('go_auth', '1')
    setLoggedIn(true)
  }

  function handleLogout() {
    sessionStorage.removeItem('go_auth')
    setLoggedIn(false)
  }

  if (!loggedIn) return <Login onLogin={handleLogin} />

  return (
    <div className="app-layout">
      <Topbar onLogout={handleLogout} />
      <main>
        <Routes>
          <Route path="/" element={<Rules />} />
          <Route path="/simulateur" element={<Simulator />} />
          <Route path="/rapport" element={<Report />} />
        </Routes>
      </main>
    </div>
  )
}
