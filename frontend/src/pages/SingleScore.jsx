import { useState, useEffect, useRef } from 'react'
import { Zap, RefreshCw, Target, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { scoreApplicant } from '../hooks/useApi'

const DEFAULTS = {
  loan_amnt: 15000, term: 36, int_rate: 12.5, installment: 501,
  grade: 'C', sub_grade: 'C1', annual_inc: 72000, emp_length: 5,
  home_ownership: 'RENT', verification_status: 'Verified',
  application_type: 'Individual', dti: 18.5,
  fico_range_low: 690, fico_range_high: 694,
  open_acc: 8, pub_rec: 0, revol_bal: 12000, revol_util: 45,
  total_acc: 20, pub_rec_bankruptcies: 0, mort_acc: 0,
  purpose: 'debt_consolidation', addr_state: 'CA',
  initial_list_status: 'w', num_actv_rev_tl: 5,
  bc_util: 42, avg_cur_bal: 8000, acc_open_past_24mths: 3,
}

/* ── Animated SVG Score Ring ──────────────────────────────────────── */
function ScoreRing({ pct, color }) {
  const r = 56
  const circ = 2 * Math.PI * r
  const [dashOffset, setDashOffset] = useState(circ)

  useEffect(() => {
    const t = setTimeout(() => {
      setDashOffset(circ * (1 - pct / 100))
    }, 120)
    return () => clearTimeout(t)
  }, [pct, circ])

  return (
    <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
      {/* Outer glow track */}
      <circle cx="65" cy="65" r={r} fill="none"
        stroke={color} strokeWidth="14" opacity="0.06"
        strokeDasharray={circ}
        strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)' }}
      />
      {/* Track */}
      <circle cx="65" cy="65" r={r} fill="none"
        stroke="rgba(255,255,255,0.05)" strokeWidth="7"
      />
      {/* Arc */}
      <circle cx="65" cy="65" r={r} fill="none"
        stroke={color} strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={dashOffset}
        style={{
          transition: 'stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)',
          filter: `drop-shadow(0 0 6px ${color})`,
        }}
      />
    </svg>
  )
}

/* ── Processing Overlay ──────────────────────────────────────────── */
function ProcessingOverlay({ progress, stage }) {
  return (
    <div
      className="anim-fade-in"
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(2,5,9,0.92)',
        backdropFilter: 'blur(18px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '2rem',
      }}
    >
      {/* Spinning rings */}
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <svg width="120" height="120" viewBox="0 0 120 120"
          style={{ position: 'absolute', inset: 0, animation: 'spin 3s linear infinite' }}>
          <circle cx="60" cy="60" r="54" fill="none"
            stroke="rgba(0,212,255,0.2)" strokeWidth="1"
            strokeDasharray="6 10" strokeLinecap="round" />
        </svg>
        <svg width="120" height="120" viewBox="0 0 120 120"
          style={{ position: 'absolute', inset: 0, animation: 'spin-reverse 4s linear infinite' }}>
          <circle cx="60" cy="60" r="42" fill="none"
            stroke="rgba(124,58,237,0.2)" strokeWidth="1"
            strokeDasharray="4 8" />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.4rem',
            color: 'var(--cyan)',
            lineHeight: 1,
            textShadow: '0 0 20px rgba(0,212,255,0.6)',
          }}>
            {Math.min(Math.round(progress), 100)}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.52rem',
            color: 'var(--ink-3)', letterSpacing: '0.15em', marginTop: 4,
          }}>
            PCT
          </div>
        </div>
      </div>

      {/* Stage label */}
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
        color: 'var(--cyan)', letterSpacing: '0.2em', textTransform: 'uppercase',
        minHeight: '1.2em',
      }}>
        {stage}
      </div>

      {/* Progress bar */}
      <div style={{ width: 260 }}>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}

/* ── Result Panel ────────────────────────────────────────────────── */
function DecisionResult({ result, onReset }) {
  const cls = result.decision === 'APPROVE' ? 'approve'
    : result.decision === 'REFER' ? 'refer' : 'decline'

  const maxMag = Math.max(...(result.shap_reasons || []).map(r => r.magnitude), 0.001)

  return (
    <div className="result-panel anim-fade-up mt-2">
      {/* Left — decision card */}
      <div className={`decision-card ${cls}`}>
        {/* Corner accent */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 80, height: 80,
          background: `radial-gradient(circle at top right, ${
            cls === 'approve' ? 'rgba(16,185,129,0.15)'
            : cls === 'refer' ? 'rgba(245,158,11,0.15)'
            : 'rgba(244,63,94,0.15)'
          }, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div>
          <div className={`decision-label ${cls}`}>Credit Decision</div>
          <div className={`decision-verdict ${cls}`}>{result.decision}</div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
            color: 'var(--ink-3)', marginTop: '0.3rem', letterSpacing: '0.08em',
          }}>
            {result.risk_tier} Risk Tier
          </div>
        </div>

        {/* Ring + EL */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.4rem' }}>
          <div className="score-ring-wrap">
            <ScoreRing pct={result.pd_pct} color={result.tier_color} />
            <div className="score-ring-label">
              <span className="score-ring-pct anim-count-in" style={{ color: result.tier_color }}>
                {result.pd_pct}%
              </span>
              <span className="score-ring-sub">PD Score</span>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
              color: 'var(--ink-3)', letterSpacing: '0.15em', textTransform: 'uppercase',
              marginBottom: '0.3rem',
            }}>Expected Loss</div>
            <div className="anim-count-in d1" style={{
              fontFamily: 'var(--font-display)', fontSize: '1.6rem',
              letterSpacing: '0.04em', lineHeight: 1,
              color: cls === 'approve' ? 'var(--approve)'
                   : cls === 'refer'   ? 'var(--refer)'
                   : 'var(--decline)',
            }}>
              ${result.expected_loss?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
              color: 'var(--ink-3)', marginTop: '0.2rem',
            }}>
              {result.el_pct}% of funded amount
            </div>
          </div>
        </div>

        {/* Metric boxes */}
        <div className="metrics-row">
          {[
            { label: 'Raw PD',     val: result.pd_score?.toFixed(4), color: result.tier_color },
            { label: 'Funded',     val: `$${result.funded_amnt?.toLocaleString()}`, color: 'var(--ink)' },
            { label: 'LGD',        val: `${(result.lgd_assumption * 100).toFixed(0)}%`, color: 'var(--ink-2)' },
          ].map((m, i) => (
            <div className={`metric-box anim-fade-up d${i + 2}`} key={m.label}>
              <div className="metric-box-val" style={{ color: m.color }}>{m.val}</div>
              <div className="metric-box-label">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--ink-4)' }}>
            {new Date(result.scored_at).toLocaleTimeString()} · v{result.model_version}
          </div>
          <button className="btn btn-ghost" style={{ padding: '0.4rem 0.9rem', fontSize: '0.72rem' }} onClick={onReset}>
            <RefreshCw size={12} /> New
          </button>
        </div>
      </div>

      {/* Right — SHAP */}
      <div className="card anim-fade-up d1">
        <div className="card-title">
          <Target size={14} /> Adverse Action Factors
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
          color: 'var(--ink-3)', lineHeight: 1.7, marginBottom: '1rem',
          padding: '0.6rem 0.8rem',
          background: 'rgba(0,212,255,0.03)',
          border: '1px solid rgba(0,212,255,0.08)',
          borderRadius: 'var(--r-sm)',
        }}>
          SHAP attribution — each factor's directional contribution. Provide top adverse factors to any declined applicant (FCRA §615).
        </div>

        {(result.shap_reasons || []).map((r, i) => (
          <div
            className={`reason-item anim-slide-r d${i}`}
            key={i}
          >
            <span className="reason-rank">{i + 1}</span>
            <span className="reason-label">{r.feature}</span>
            <div className="reason-bar-track">
              <div
                className={`reason-bar-fill ${r.direction === 'increases' ? 'risk-up' : 'risk-down'}`}
                style={{
                  width: `${(r.magnitude / maxMag) * 100}%`,
                  animationDelay: `${i * 0.08 + 0.3}s`,
                }}
              />
            </div>
            <span className={`reason-direction ${r.direction === 'increases' ? 'risk-up' : 'risk-down'}`}>
              {r.direction === 'increases'
                ? <><TrendingUp size={10} style={{ display: 'inline', marginRight: 3 }} />Risk ↑</>
                : <><TrendingDown size={10} style={{ display: 'inline', marginRight: 3 }} />Risk ↓</>
              }
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main Page ───────────────────────────────────────────────────── */
const STAGES = [
  'Loading feature pipeline...',
  'Running LightGBM inference...',
  'Computing SHAP values...',
  'Calibrating probabilities...',
  'Building adverse action report...',
]

export default function SingleScore() {
  const [form, setForm]       = useState(DEFAULTS)
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage]     = useState('')

  const set = (k) => (e) => {
    const v = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
    setForm(f => ({ ...f, [k]: v }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setResult(null)
    setProgress(0)

    // Animate progress
    let p = 0
    const interval = setInterval(() => {
      p = Math.min(p + 2 + Math.random() * 3, 95)
      setProgress(p)
      setStage(STAGES[Math.floor(p / 20)] || STAGES[4])
    }, 80)

    try {
      const { data } = await scoreApplicant(form)
      clearInterval(interval)
      setProgress(100)
      await new Promise(r => setTimeout(r, 400))
      setResult(data)
      toast.success('Applicant scored successfully')
    } catch {
      clearInterval(interval)
      toast.error('Scoring failed — check API connection')
    } finally {
      setLoading(false)
    }
  }

  const sections = [
    {
      title: 'Loan Structure',
      fields: [
        { k: 'loan_amnt',   label: 'Loan Amount ($)',     type: 'number' },
        { k: 'term',        label: 'Term',                type: 'select', opts: [{ v: 36, l: '36 months' }, { v: 60, l: '60 months' }] },
        { k: 'int_rate',    label: 'Interest Rate (%)',   type: 'number', step: '0.1' },
        { k: 'installment', label: 'Monthly Install. ($)', type: 'number' },
        { k: 'grade',       label: 'Grade',               type: 'select', opts: ['A','B','C','D','E','F','G'] },
        { k: 'sub_grade',   label: 'Sub-Grade',           type: 'select', opts: ['A','B','C','D','E','F','G'].flatMap(g=>[1,2,3,4,5].map(n=>`${g}${n}`)) },
      ],
    },
    {
      title: 'Borrower Profile',
      fields: [
        { k: 'annual_inc',           label: 'Annual Income ($)',   type: 'number' },
        { k: 'emp_length',           label: 'Employment (yrs)',    type: 'number' },
        { k: 'home_ownership',       label: 'Home Ownership',      type: 'select', opts: ['RENT','MORTGAGE','OWN','OTHER'] },
        { k: 'verification_status',  label: 'Verification',        type: 'select', opts: ['Verified','Source Verified','Not Verified'] },
        { k: 'purpose',              label: 'Loan Purpose',        type: 'select', opts: ['debt_consolidation','credit_card','home_improvement','other','major_purchase','medical','small_business','car','vacation','moving'] },
        { k: 'application_type',     label: 'Application Type',    type: 'select', opts: ['Individual','Joint App'] },
      ],
    },
    {
      title: 'Credit Bureau',
      fields: [
        { k: 'fico_range_low',        label: 'FICO Low',           type: 'number' },
        { k: 'fico_range_high',       label: 'FICO High',          type: 'number' },
        { k: 'dti',                   label: 'DTI (%)',            type: 'number', step: '0.1' },
        { k: 'revol_util',            label: 'Revol. Util (%)',    type: 'number', step: '0.1' },
        { k: 'revol_bal',             label: 'Revol. Balance ($)', type: 'number' },
        { k: 'pub_rec',               label: 'Public Records',     type: 'number' },
        { k: 'pub_rec_bankruptcies',  label: 'Bankruptcies',       type: 'number' },
        { k: 'open_acc',              label: 'Open Accounts',      type: 'number' },
        { k: 'total_acc',             label: 'Total Accounts',     type: 'number' },
        { k: 'mort_acc',              label: 'Mortgage Accounts',  type: 'number' },
      ],
    },
  ]

  return (
    <div className="page">
      {loading && <ProcessingOverlay progress={progress} stage={stage} />}

      <div className="page-header anim-fade-up">
        <div className="page-eyebrow">Credit Origination</div>
        <div className="page-title">Single Applicant Scoring</div>
        <div className="page-sub">
          Enter applicant details to generate a calibrated PD score, Expected Loss in dollars, and SHAP-powered adverse action reasons.
        </div>
      </div>

      {result ? (
        <DecisionResult result={result} onReset={() => setResult(null)} />
      ) : (
        <>
          {/* Form */}
          <div className="card anim-fade-up d1 mb-2">
            <div className="card-title">
              <ShieldCheck size={14} /> Applicant Details
            </div>
            <div className="form-grid">
              {sections.map((sec) => (
                <>
                  <div className="form-section-header" key={sec.title}>
                    <span className="form-section-title">{sec.title}</span>
                  </div>
                  {sec.fields.map(f => (
                    <div className="form-group" key={f.k}>
                      <label className="form-label">{f.label}</label>
                      {f.type === 'select' ? (
                        <select className="form-select" value={form[f.k]} onChange={set(f.k)}>
                          {(f.opts || []).map(o =>
                            typeof o === 'object'
                              ? <option key={o.v} value={o.v}>{o.l}</option>
                              : <option key={o} value={o}>{o}</option>
                          )}
                        </select>
                      ) : (
                        <input
                          className="form-input"
                          type="number"
                          step={f.step || '1'}
                          value={form[f.k]}
                          onChange={set(f.k)}
                        />
                      )}
                    </div>
                  ))}
                </>
              ))}
            </div>
          </div>

          {/* Action bar */}
          <div className="anim-fade-up d2" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? <><span className="spinner" /> Scoring...</> : <><Zap size={14} /> Score Applicant</>}
            </button>
            <button className="btn btn-ghost" onClick={() => setForm(DEFAULTS)}>
              <RefreshCw size={13} /> Reset
            </button>
            <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-4)', letterSpacing: '0.1em' }}>
              PD × LGD × EAD = Expected Loss
            </div>
          </div>
        </>
      )}
    </div>
  )
}
