import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Users, UploadCloud, BarChart3, LogOut, Database } from 'lucide-react'
import { AuthProvider, useAuth } from './AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import SingleScore from './pages/SingleScore'
import BatchScore from './pages/BatchScore'
import ModelCard from './pages/ModelCard'
import './index.css'

function AmbientBackground() {
  return (
    <div className="ambient-bg">
      <div className="aurora-orb aurora-1" />
      <div className="aurora-orb aurora-2" />
      <div className="aurora-orb aurora-3" />
      <div className="aurora-orb aurora-4" />
      <div className="grid-overlay" />
      <div className="scan-line" />
      <div className="vignette" />
    </div>
  )
}

function LiveTicker() {
  const items = [
    { label: 'MODEL', val: 'LightGBM v4.6' },
    { label: 'GINI',  val: '0.4415' },
    { label: 'KS',    val: '0.3351' },
    { label: 'BRIER', val: '0.1039' },
    { label: 'PSI',   val: '0.0477 · STABLE' },
    { label: 'LGD',   val: '87%' },
    { label: 'STATUS',val: 'PRODUCTION READY' },
    { label: 'TRAIN', val: '2007–2015' },
    { label: 'TEST',  val: '2017 COHORT' },
    { label: 'SHAP',  val: 'ENABLED' },
  ]
  const all = [...items, ...items]
  return (
    <div className="ticker-wrap">
      <div className="ticker-inner">
        {all.map((item, i) => (
          <span className="ticker-item" key={i}>
            <span className="ticker-label">{item.label}</span>
            <span>{item.val}</span>
            <span style={{ color: 'var(--ink-4)', margin: '0 0.5rem' }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// Global Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

function AppShell() {
  const { logout } = useAuth()
  const [time, setTime] = useState(new Date())
  
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="app-shell anim-fade-in">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">⊕</div>
          <div>
            <div className="brand-name">CreditEngine</div>
            <div className="brand-tagline">v2.1 · Secure</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Scoring</div>

          <NavLink to="/app" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Users size={15} /> Single Applicant
          </NavLink>

          <NavLink to="/app/batch" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <UploadCloud size={15} /> Batch Upload
          </NavLink>

          <div className="nav-label" style={{ marginTop: '1.4rem' }}>System</div>

          <NavLink to="/app/model" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <BarChart3 size={15} /> Model Card
          </NavLink>

          <button onClick={logout} className="nav-item" style={{ marginTop: 'auto', background: 'transparent', width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <LogOut size={15} /> End Session
          </button>
        </nav>

        {/* Live clock */}
        <div style={{
          padding: '0.75rem 1.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
          color: 'var(--ink-3)', letterSpacing: '0.06em', borderTop: '1px solid var(--line)', textAlign: 'center'
        }}>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>

        <div className="sidebar-footer">
          <div className="status-dot" />
          <span className="status-text">API Connected</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-content">
        <LiveTicker />
        <Routes>
          <Route path="/"      element={<SingleScore />} />
          <Route path="/batch" element={<BatchScore />} />
          <Route path="/model" element={<ModelCard />} />
        </Routes>
      </main>
    </div>
  )
}

function AppContent() {
  return (
    <>
      <AmbientBackground />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(8,15,26,0.95)', color: '#eef2f8', border: '1px solid rgba(0,212,255,0.2)',
            backdropFilter: 'blur(20px)', fontFamily: "'Azeret Mono', monospace", fontSize: '0.75rem',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#080f1a' } },
          error:   { iconTheme: { primary: '#f43f5e', secondary: '#080f1a' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app/*" element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}
