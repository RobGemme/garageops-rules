import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Rules from './pages/Rules.jsx'
import Simulator from './pages/Simulator.jsx'
import Report from './pages/Report.jsx'

function Topbar() {
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
        <NavLink to="/" end className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>
          📋 Règles
        </NavLink>
        <NavLink to="/simulateur" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>
          🔍 Simulateur VIN
        </NavLink>
        <NavLink to="/rapport" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>
          📊 Rapport
        </NavLink>
      </nav>
    </header>
  )
}

export default function App() {
  return (
    <div className="app-layout">
      <Topbar />
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
