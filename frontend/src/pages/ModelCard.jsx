import { useEffect, useState } from 'react'
import { BarChart3, Activity, Clock, Cpu, TrendingUp, Zap } from 'lucide-react'
import { getModelCard, getHealth } from '../hooks/useApi'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

const BENCHMARK_BARS = [
  { label: 'Gini Coefficient', val: 44.15, max: 100, color: '#00d4ff',  bench: '> 40 = Good' },
  { label: 'KS Statistic',     val: 33.51, max: 100, color: '#7c3aed',  bench: '> 30 = Good' },
  { label: 'Calibration',      val: 89.61, max: 100, color: '#10b981',  bench: '< 0.15 Brier' },
  { label: 'PSI Stability',    val: 95.23, max: 100, color: '#f59e0b',  bench: '< 0.10 Stable' },
]

const RISK_TIERS = [
  { tier: 'Low',         range: '0–10%',   color: '#10b981', decision: 'APPROVE' },
  { tier: 'Medium',      range: '10–20%',  color: '#00d4ff', decision: 'APPROVE' },
  { tier: 'Medium-High', range: '20–30%',  color: '#f59e0b', decision: 'REFER'   },
  { tier: 'High',        range: '30–45%',  color: '#fb923c', decision: 'REFER'   },
  { tier: 'Very High',   range: '45%+',    color: '#f43f5e', decision: 'DECLINE' },
]

function AnimatedBar({ val, max, color, index }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth((val / max) * 100), 200 + index * 120)
    return () => clearTimeout(t)
  }, [val, max, index])
  return (
    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${width}%`,
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        borderRadius: 2, transition: 'width 0.9s cubic-bezier(.22,1,.36,1)',
        boxShadow: `0 0 8px ${color}55`,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 20,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5))',
        }} />
      </div>
    </div>
  )
}

export default function ModelCard() {
  const [card, setCard]     = useState(null)
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getModelCard(), getHealth()])
      .then(([c, h]) => { setCard(c.data); setHealth(h.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const radarData = [
    { subject: 'Gini',        A: 44.15, fullMark: 100 },
    { subject: 'KS Stat',     A: 33.51, fullMark: 100 },
    { subject: 'Calibration', A: 89.61, fullMark: 100 },
    { subject: 'Stability',   A: 95.23, fullMark: 100 },
    { subject: 'Coverage',    A: 78.00, fullMark: 100 },
  ]

  return (
    <div className="page">
      <div className="page-header anim-fade-up">
        <div className="page-eyebrow">System</div>
        <div className="page-title">Model Card</div>
        <div className="page-sub">
          Live model performance metrics, risk tier configuration, and system health.
        </div>
      </div>

      {/* Health strip */}
      <div className={`card anim-fade-up d1 mb-2 ${health?.model_loaded ? 'card-glow-green' : ''}`} style={{
        borderColor: health?.model_loaded ? 'rgba(16,185,129,0.22)' : 'rgba(245,158,11,0.2)',
        background: health?.model_loaded
          ? 'linear-gradient(135deg, rgba(16,185,129,0.06), var(--glass))'
          : 'linear-gradient(135deg, rgba(245,158,11,0.06), var(--glass))',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: health?.model_loaded ? 'var(--approve)' : 'var(--refer)',
              boxShadow: `0 0 10px ${health?.model_loaded ? 'var(--approve)' : 'var(--refer)'}`,
              animation: 'dot-blink 2.5s ease-in-out infinite',
            }} />
            <div>
              <div style={{
                fontFamily: 'var(--font-ui)', fontSize: '0.88rem', fontWeight: 600,
                color: health?.model_loaded ? 'var(--approve)' : 'var(--refer)',
              }}>
                {loading ? 'Checking...' : health?.model_loaded ? 'Production Model Active' : 'Running in Demo Mode'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-3)', marginTop: 2 }}>
                {health?.mode} · SHAP {health?.shap_enabled ? 'enabled' : 'disabled'}
                {health?.timestamp ? ` · ${new Date(health.timestamp).toLocaleTimeString()}` : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="badge badge-cyan">{card?.engine || 'LightGBM'}</span>
            <span className="badge" style={{
              background: 'rgba(255,255,255,0.05)', color: 'var(--ink-2)',
              border: '1px solid var(--line-2)',
            }}>v{card?.version || '2.0'}</span>
          </div>
        </div>
      </div>

      {/* Performance metrics */}
      <div className="mc-grid anim-fade-up d1">
        {[
          { label: 'Gini Coefficient', val: card?.gini ?? '0.4415',        bench: '> 0.40 = Good ✓', color: '#00d4ff' },
          { label: 'KS Statistic',     val: card?.ks_statistic ?? '0.3351', bench: '> 0.30 = Good ✓', color: '#7c3aed' },
          { label: 'Brier Score',      val: card?.brier_score ?? '0.1039',  bench: '< 0.15 = Calibrated ✓', color: '#10b981' },
          { label: 'Avg Precision',    val: card?.avg_precision ?? '0.2147', bench: '> 0.20 baseline', color: '#f59e0b' },
          { label: 'PSI — 2017',       val: '0.0477',                        bench: 'Stable < 0.10 ✓', color: '#f43f5e' },
          { label: 'Training Rows',    val: '647,071',                        bench: 'Full dataset used', color: 'var(--ink-2)' },
        ].map((m, i) => (
          <div className="mc-stat" key={m.label} style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="mc-stat-val" style={{ color: m.color }}>{m.val}</div>
            <div className="mc-stat-label">{m.label}</div>
            <div className="mc-stat-bench" style={{ color: m.color, opacity: 0.75 }}>{m.bench}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-2">

        {/* Benchmark bars */}
        <div className="card anim-fade-up d2">
          <div className="card-title"><TrendingUp size={14} /> Performance Benchmarks</div>
          {BENCHMARK_BARS.map((b, i) => (
            <div key={b.label} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-2)' }}>{b.label}</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: b.color }}>{b.val}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--ink-4)' }}>{b.bench}</span>
                </div>
              </div>
              <AnimatedBar val={b.val} max={b.max} color={b.color} index={i} />
            </div>
          ))}
        </div>

        {/* Radar chart */}
        <div className="card anim-fade-up d3">
          <div className="card-title"><Activity size={14} /> Capability Radar</div>
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={radarData} cx="50%" cy="50%">
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'rgba(238,242,248,0.35)' }}
              />
              <Radar
                name="Model"
                dataKey="A"
                stroke="var(--cyan)"
                fill="var(--cyan)"
                fillOpacity={0.1}
                strokeWidth={1.5}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(8,15,26,0.95)',
                  border: '1px solid rgba(0,212,255,0.2)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--ink)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: 8,
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--ink-4)', lineHeight: 1.7, textAlign: 'center' }}>
            Calibration = 1 − Brier × 100 · Stability = 100 − PSI × 100
          </div>
        </div>

        {/* Training details */}
        <div className="card anim-fade-up d3">
          <div className="card-title"><Clock size={14} /> Training Specification</div>
          {[
            { label: 'Algorithm',         val: card?.engine || 'LightGBM 4.6.0' },
            { label: 'Calibration',       val: card?.calibration || 'Platt scaling (sigmoid)' },
            { label: 'Training window',   val: card?.training_period || '2007-01 to 2015-12' },
            { label: 'Validation window', val: card?.validation_period || '2016-01 to 2016-12' },
            { label: 'Test window',       val: card?.test_period || '2017-01 to 2017-09' },
            { label: 'Class balance',     val: card?.class_balance || 'class_weight=balanced' },
            { label: 'Features',          val: '39 input → 151 encoded' },
            { label: 'Monotone rules',    val: '9 domain constraints' },
            { label: 'LGD assumption',    val: `${((card?.lgd_assumption || 0.87) * 100).toFixed(0)}% (empirical)` },
          ].map((r, i) => (
            <div className="mc-row" key={r.label} style={{ animationDelay: `${i * 0.04}s` }}>
              <span className="mc-row-label">{r.label}</span>
              <span className="mc-row-val">{r.val}</span>
            </div>
          ))}
        </div>

        {/* Risk tiers */}
        <div className="card anim-fade-up d4">
          <div className="card-title"><Cpu size={14} /> Risk Tier Configuration</div>
          {RISK_TIERS.map((t, i) => (
            <div key={t.tier} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.72rem 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }} className={`anim-slide-r d${i}`}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: t.color, flexShrink: 0,
                boxShadow: `0 0 8px ${t.color}88`,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', fontWeight: 500, color: 'var(--ink)' }}>
                  {t.tier}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--ink-3)' }}>
                  PD {t.range}
                </div>
              </div>
              {/* Visual PD bar */}
              <div style={{ width: 60, height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: t.tier === 'Low' ? '10%' : t.tier === 'Medium' ? '30%' : t.tier === 'Medium-High' ? '50%' : t.tier === 'High' ? '70%' : '90%',
                  background: t.color, borderRadius: 2,
                }} />
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.08em',
                padding: '0.18rem 0.6rem', borderRadius: 20,
                background: `${t.color}14`, border: `1px solid ${t.color}30`, color: t.color,
              }}>
                {t.decision}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
