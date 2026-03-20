import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, Download, CheckCircle, XCircle, AlertCircle, Trash2, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { scoreBatch } from '../hooks/useApi'

const TIER_STYLES = {
  'Low':        { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', dot: '#10b981' },
  'Medium':     { bg: 'rgba(0,212,255,0.08)',  color: '#00d4ff', dot: '#00d4ff' },
  'Medium-High':{ bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', dot: '#f59e0b' },
  'High':       { bg: 'rgba(251,146,60,0.1)',  color: '#fb923c', dot: '#fb923c' },
  'Very High':  { bg: 'rgba(244,63,94,0.1)',   color: '#f43f5e', dot: '#f43f5e' },
  'ERROR':      { bg: 'rgba(255,255,255,0.04)',color: '#555',    dot: '#555' },
}

const DECISION_ICON = {
  APPROVE: <CheckCircle size={12} color="#10b981" />,
  REFER:   <AlertCircle size={12} color="#f59e0b" />,
  DECLINE: <XCircle     size={12} color="#f43f5e" />,
  ERROR:   <XCircle     size={12} color="#555" />,
}

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  const rows = lines.slice(1, 6).map(line => {
    const vals = line.split(',')
    return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim()]))
  })
  return { headers, rows, total: lines.length - 1 }
}

async function parseScoredBlob(blob) {
  const text = await blob.text()
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  const scoreFields = ['pd_score','pd_pct','risk_tier','decision','expected_loss','top_reason','error']
  const rows = lines.slice(1).map(line => {
    const vals = line.split(',')
    return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim()]))
  })
  return { headers: scoreFields, rows }
}

function SummaryPill({ label, value, color }) {
  return (
    <div className="card anim-fade-up" style={{
      borderColor: `${color}22`,
      background: `linear-gradient(145deg, ${color}08, var(--glass))`,
      boxShadow: `0 0 30px ${color}08`,
    }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: '2.2rem',
        letterSpacing: '0.04em', color, lineHeight: 1,
        textShadow: `0 0 20px ${color}44`,
        marginBottom: '0.3rem',
      }}>{value}</div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
        letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)',
      }}>{label}</div>
    </div>
  )
}

export default function BatchScore() {
  const [file, setFile]           = useState(null)
  const [preview, setPreview]     = useState(null)
  const [loading, setLoading]     = useState(false)
  const [progress, setProgress]   = useState(0)
  const [results, setResults]     = useState(null)
  const [scoredBlob, setScoredBlob] = useState(null)

  const onDrop = useCallback(async (accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setResults(null)
    setScoredBlob(null)
    const text = await f.text()
    setPreview(parseCSV(text))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'text/csv': ['.csv'] }, multiple: false,
  })

  const handleScore = async () => {
    setLoading(true)
    setProgress(0)
    try {
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + 1.5 + Math.random() * 2, 92))
      }, 100)
      const { data: blob } = await scoreBatch(file)
      clearInterval(interval)
      setProgress(100)
      const parsed = await parseScoredBlob(blob)
      setResults(parsed)
      setScoredBlob(blob)
      toast.success(`${parsed.rows.length} applicants scored`)
    } catch {
      toast.error('Batch scoring failed — check API connection')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!scoredBlob) return
    const url = URL.createObjectURL(scoredBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scored_${file.name}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    setFile(null); setPreview(null); setResults(null); setScoredBlob(null); setProgress(0)
  }

  const summary = results ? (() => {
    const approve = results.rows.filter(r => r.decision === 'APPROVE').length
    const refer   = results.rows.filter(r => r.decision === 'REFER').length
    const decline = results.rows.filter(r => r.decision === 'DECLINE').length
    const totalEL = results.rows.reduce((s, r) => s + (parseFloat(r.expected_loss) || 0), 0)
    return { approve, refer, decline, totalEL, total: results.rows.length }
  })() : null

  return (
    <div className="page">
      <div className="page-header anim-fade-up">
        <div className="page-eyebrow">Credit Origination</div>
        <div className="page-title">Batch Scoring</div>
        <div className="page-sub">
          Upload a CSV of applicants. Every row scored independently — returns PD, risk tier, Expected Loss, and top risk factor.
        </div>
      </div>

      {/* Upload card */}
      <div className="card anim-fade-up d1 mb-2">
        <div className="card-title"><UploadCloud size={14} /> Upload CSV</div>

        <div {...getRootProps()} className={`dropzone${isDragActive ? ' active' : ''}`}>
          <input {...getInputProps()} />
          <div className="dropzone-icon anim-float">
            <UploadCloud size={22} />
          </div>
          <div className="dropzone-title">
            {file ? file.name : isDragActive ? 'Drop to upload' : 'Drop your CSV here or click to browse'}
          </div>
          <div className="dropzone-sub">
            {file
              ? `${(file.size / 1024).toFixed(1)} KB · ${preview?.total} applicants detected`
              : 'Accepts .csv · Required columns: loan_amnt, term, int_rate, grade, annual_inc, dti, fico_range_low/high'
            }
          </div>
        </div>

        {/* Preview table */}
        {preview && !results && (
          <div className="mt-2 anim-fade-up">
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.56rem',
              color: 'var(--ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase',
              marginBottom: '0.6rem',
            }}>
              Preview — first 5 of {preview.total} rows
            </div>
            <div className="batch-table-wrap" style={{ maxHeight: 160, overflowY: 'auto' }}>
              <table className="batch-table">
                <thead>
                  <tr>{preview.headers.slice(0, 8).map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i}>
                      {preview.headers.slice(0, 8).map(h => <td key={h}>{row[h] ?? '—'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Progress */}
        {loading && (
          <div className="mt-2">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-3)', letterSpacing: '0.1em' }}>
                Scoring {preview?.total} applicants
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--cyan)' }}>
                {Math.min(Math.round(progress), 100)}%
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.2rem' }}>
          <button className="btn btn-primary" onClick={handleScore} disabled={!file || loading}>
            {loading ? <><span className="spinner" /> Scoring...</> : <><Zap size={14} /> Score All Applicants</>}
          </button>
          {scoredBlob && (
            <button className="btn btn-ghost" onClick={handleDownload}>
              <Download size={13} /> Download Results
            </button>
          )}
          {file && (
            <button className="btn btn-ghost" onClick={handleClear}>
              <Trash2 size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      {summary && (
        <>
          <div className="grid-2 mb-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <SummaryPill label="Approve"       value={summary.approve} color="#10b981" />
            <SummaryPill label="Refer"         value={summary.refer}   color="#f59e0b" />
            <SummaryPill label="Decline"       value={summary.decline} color="#f43f5e" />
            <SummaryPill
              label="Total Portfolio EL"
              value={`$${summary.totalEL.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              color="#00d4ff"
            />
          </div>

          {/* Results table */}
          <div className="card anim-fade-up">
            <div className="card-title" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={14} />
                Scored Results — {results.rows.length} applicants
              </span>
              <button
                className="btn btn-ghost"
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem' }}
                onClick={handleDownload}
              >
                <Download size={11} /> CSV
              </button>
            </div>

            <div className="batch-table-wrap" style={{ maxHeight: 440, overflowY: 'auto' }}>
              <table className="batch-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>PD Score</th>
                    <th>PD %</th>
                    <th>Risk Tier</th>
                    <th>Decision</th>
                    <th>Expected Loss</th>
                    <th>Top Risk Factor</th>
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((row, i) => {
                    const s = TIER_STYLES[row.risk_tier] || TIER_STYLES['ERROR']
                    return (
                      <tr key={i} className={i < 8 ? `anim-fade-up d${Math.min(i, 7)}` : ''}>
                        <td style={{ color: 'var(--ink-4)' }}>{i + 1}</td>
                        <td style={{ color: 'var(--ink)', fontWeight: 500 }}>{row.pd_score ?? '—'}</td>
                        <td style={{ color: s.color }}>{row.pd_pct ? `${row.pd_pct}%` : '—'}</td>
                        <td>
                          <span className="tier-badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}30` }}>
                            <span className="tier-dot" style={{ background: s.dot }} />
                            {row.risk_tier}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {DECISION_ICON[row.decision]}
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: s.color }}>
                              {row.decision}
                            </span>
                          </span>
                        </td>
                        <td style={{ color: 'var(--ink)' }}>
                          {row.expected_loss
                            ? `$${parseFloat(row.expected_loss).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                            : '—'
                          }
                        </td>
                        <td style={{ color: 'var(--ink-2)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.top_reason || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Template download */}
      <div className="card anim-fade-up d2 mt-2" style={{ borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.2rem' }}>
              Need a template?
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--ink-3)' }}>
              Pre-formatted CSV with all required columns and 3 sample rows.
            </div>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => {
              const headers = 'loan_amnt,term,int_rate,installment,grade,sub_grade,annual_inc,emp_length,home_ownership,verification_status,application_type,dti,fico_range_low,fico_range_high,open_acc,pub_rec,revol_bal,revol_util,total_acc,pub_rec_bankruptcies,mort_acc,purpose,addr_state,initial_list_status'
              const rows = [
                '15000,36,12.5,501,C,C1,72000,5,RENT,Verified,Individual,18.5,690,694,8,0,12000,45,20,0,0,debt_consolidation,CA,w',
                '8000,36,7.2,247,B,B2,55000,3,MORTGAGE,Not Verified,Individual,12.1,720,724,6,0,5000,22,15,0,1,credit_card,NY,w',
                '25000,60,18.9,646,D,D3,42000,1,RENT,Source Verified,Individual,28.4,650,654,11,1,18000,72,25,1,0,debt_consolidation,TX,f',
              ]
              const csv = [headers, ...rows].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = 'applicant_template.csv'; a.click()
              URL.revokeObjectURL(url)
            }}
          >
            <Download size={13} /> Template CSV
          </button>
        </div>
      </div>
    </div>
  )
}
