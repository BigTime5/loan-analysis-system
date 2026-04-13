import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Download, CheckCircle, XCircle, AlertCircle, Trash2, Zap, FileText } from 'lucide-react';
import { scoreBatch, scoreBatchCsv, type BatchScoreResult } from '../hooks/useApi';

// Tier styles
const TIER_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  'Low': { bg: 'rgba(34,212,122,0.1)', color: '#22d47a', dot: '#22d47a' },
  'Medium': { bg: 'rgba(0,229,197,0.08)', color: '#00e5c5', dot: '#00e5c5' },
  'Medium-High': { bg: 'rgba(255,176,32,0.1)', color: '#ffb020', dot: '#ffb020' },
  'High': { bg: 'rgba(251,146,60,0.1)', color: '#fb923c', dot: '#fb923c' },
  'Very High': { bg: 'rgba(255,79,110,0.1)', color: '#ff4f6e', dot: '#ff4f6e' },
  'ERROR': { bg: 'rgba(255,255,255,0.04)', color: '#555', dot: '#555' },
};

const DECISION_ICONS = {
  APPROVE: <CheckCircle size={14} className="text-[#22d47a]" />,
  REFER: <AlertCircle size={14} className="text-[#ffb020]" />,
  DECLINE: <XCircle size={14} className="text-[#ff4f6e]" />,
  ERROR: <XCircle size={14} className="text-[#555]" />,
};

// Parse CSV preview
function parseCSVPreview(text: string) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1, 6).map(line => {
    const vals = line.split(',');
    return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim()]));
  });
  return { headers, rows, total: lines.length - 1 };
}

// Removed parseScoredResults since backend now returns JSON directly.

// Summary Pill Component
function SummaryPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="p-4 rounded-xl text-center" style={{ background: `linear-gradient(145deg, ${color}08, rgba(8,15,26,0.7))`, border: `1px solid ${color}22`, boxShadow: `0 0 30px ${color}08` }}>
      <div className="text-2xl font-bold" style={{ color, textShadow: `0 0 20px ${color}44` }}>{value}</div>
      <div className="text-[10px] text-white/40 font-mono uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

export default function BatchScore() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: Record<string, string>[]; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BatchScoreResult | null>(null);
  const [scoredBlob, setScoredBlob] = useState<Blob | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    setResults(null);
    setScoredBlob(null);
    const text = await f.text();
    setPreview(parseCSVPreview(text));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  const handleScore = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);

    try {
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + 1.5 + Math.random() * 2, 92));
      }, 100);

      const [jsonData, csvBlob] = await Promise.all([
        scoreBatch(file),
        scoreBatchCsv(file)
      ]);
      
      clearInterval(interval);
      setProgress(100);

      setResults(jsonData);
      setScoredBlob(csvBlob);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!scoredBlob || !file) return;
    const url = URL.createObjectURL(scoredBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scored_${file.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setResults(null);
    setScoredBlob(null);
    setProgress(0);
  };

  const summary = results ? (() => {
    const approve = results.results.filter(r => r.decision === 'APPROVE').length;
    const refer = results.results.filter(r => r.decision === 'REFER').length;
    const decline = results.results.filter(r => r.decision === 'DECLINE').length;
    const errors = results.results.filter(r => r.decision === 'ERROR').length;
    const totalEL = results.results.reduce((s, r) => s + (r.expected_loss || 0), 0);
    return { approve, refer, decline, errors, totalEL, total: results.total };
  })() : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="fade-up visible">
        <div className="flex items-center gap-2 text-xs font-mono tracking-[0.3em] uppercase text-[#e8f532] mb-3">
          <span className="w-4 h-px bg-[#e8f532]" />
          Credit Origination
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">Batch Scoring</h1>
        <p className="text-sm text-white/50 max-w-xl">Upload a CSV of applicants. Every row scored independently — returns PD, risk tier, Expected Loss, and top risk factor.</p>
      </div>

      {/* Upload Card */}
      <div className="rounded-2xl p-6 fade-up visible" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', animationDelay: '80ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <UploadCloud size={16} className="text-[#e8f532]" />
          <span className="font-semibold">Upload CSV</span>
        </div>

        {/* Dropzone */}
        <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-[#e8f532] bg-[rgba(232,245,50,0.08)]' : 'border-white/10 bg-[rgba(232,245,50,0.02)] hover:border-[rgba(232,245,50,0.3)] hover:bg-[rgba(232,245,50,0.04)]'}`}>
          <input {...getInputProps()} />
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(232,245,50,0.1)', border: '1px solid rgba(232,245,50,0.2)', animation: 'float 5s ease-in-out infinite' }}>
            <UploadCloud size={24} className="text-[#e8f532]" />
          </div>
          <div className="text-lg font-medium mb-1">{file ? file.name : isDragActive ? 'Drop to upload' : 'Drop your CSV here or click to browse'}</div>
          <div className="text-xs text-white/40 font-mono">{file ? `${(file.size / 1024).toFixed(1)} KB · ${preview?.total} applicants detected` : 'Accepts .csv · Required columns: loan_amnt, term, int_rate, grade, annual_inc, dti, fico_range_low/high'}</div>
        </div>

        {/* Preview */}
        {preview && !results && (
          <div className="mt-4 fade-up visible">
            <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-white/40 mb-2">Preview — first 5 of {preview.total} rows</div>
            <div className="overflow-x-auto rounded-lg border border-white/[0.06]" style={{ maxHeight: 180 }}>
              <table className="w-full text-xs font-mono">
                <thead className="bg-white/[0.03]">
                  <tr>{preview.headers.slice(0, 8).map(h => <th key={h} className="px-3 py-2 text-left text-white/40">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="border-t border-white/[0.04]">
                      {preview.headers.slice(0, 8).map(h => <td key={h} className="px-3 py-2 text-white/60">{row[h] ?? '—'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Progress */}
        {loading && (
          <div className="mt-4">
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-white/40">Scoring {preview?.total} applicants</span>
              <span className="text-[#e8f532]">{Math.min(Math.round(progress), 100)}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-150" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #e8f532, #00e5c5)' }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-4">
          <button onClick={handleScore} disabled={!file || loading} className="px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #e8f532, #d4de1e)', color: '#05060f', boxShadow: '0 4px 20px rgba(232,245,50,0.3)' }}>
            {loading ? <><span className="w-4 h-4 border-2 border-white/10 border-t-[#05060f] rounded-full animate-spin" /> Scoring...</> : <><Zap size={14} /> Score All Applicants</>}
          </button>
          {scoredBlob && (
            <button onClick={handleDownload} className="px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300 bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white flex items-center gap-2">
              <Download size={14} /> Download Results
            </button>
          )}
          {file && (
            <button onClick={handleClear} className="px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300 bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white flex items-center gap-2">
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {summary && (
        <>
          {/* Summary Pills */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-up visible">
            <SummaryPill label="Approve" value={summary.approve} color="#22d47a" />
            <SummaryPill label="Refer" value={summary.refer} color="#ffb020" />
            <SummaryPill label="Decline" value={summary.decline} color="#ff4f6e" />
            <SummaryPill label="Total Portfolio EL" value={`$${summary.totalEL.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color="#00e5c5" />
          </div>

          {/* Results Table */}
          <div className="rounded-2xl p-6 fade-up visible" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-[#22d47a]" />
                <span className="font-semibold">Scored Results — {results?.results.length} applicants</span>
              </div>
              <button onClick={handleDownload} className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white flex items-center gap-2">
                <Download size={12} /> CSV
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-white/[0.06]" style={{ maxHeight: 440 }}>
              <table className="w-full text-xs font-mono">
                <thead className="bg-white/[0.03] sticky top-0">
                  <tr>
                    <th className="px-3 py-3 text-left text-white/40">#</th>
                    <th className="px-3 py-3 text-left text-white/40">PD Score</th>
                    <th className="px-3 py-3 text-left text-white/40">PD %</th>
                    <th className="px-3 py-3 text-left text-white/40">Risk Tier</th>
                    <th className="px-3 py-3 text-left text-white/40">Decision</th>
                    <th className="px-3 py-3 text-left text-white/40">Expected Loss</th>
                    <th className="px-3 py-3 text-left text-white/40">Top Risk Factor</th>
                  </tr>
                </thead>
                <tbody>
                  {results?.results.map((row, i) => {
                    const style = TIER_STYLES[row.risk_tier] || TIER_STYLES['ERROR'];
                    return (
                      <tr key={i} className="border-t border-white/[0.04] hover:bg-[rgba(232,245,50,0.03)]">
                        <td className="px-3 py-3 text-white/40">{i + 1}</td>
                        <td className="px-3 py-3 text-white/80">{row.pd_score ?? '—'}</td>
                        <td className="px-3 py-3" style={{ color: style.color }}>{row.pd_pct ? `${row.pd_pct}%` : '—'}</td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px]" style={{ background: style.bg, color: style.color, border: `1px solid ${style.color}30` }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: style.dot }} />
                            {row.risk_tier}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="flex items-center gap-1.5">
                            {DECISION_ICONS[row.decision as keyof typeof DECISION_ICONS]}
                            <span style={{ color: style.color }}>{row.decision}</span>
                          </span>
                        </td>
                        <td className="px-3 py-3 text-white/80">{row.expected_loss !== null ? `$${row.expected_loss.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}</td>
                        <td className="px-3 py-3 text-white/50 max-w-[200px] truncate">{row.top_reason || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Template Card */}
      <div className="rounded-2xl p-6 border border-dashed fade-up visible" style={{ borderColor: 'rgba(255,255,255,0.06)', animationDelay: '200ms' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-[#e8f532]" />
              <span className="font-semibold">Need a template?</span>
            </div>
            <p className="text-xs text-white/50">Pre-formatted CSV with all required columns and 3 sample rows.</p>
          </div>
          <button onClick={() => {
            const headers = 'loan_amnt,term,int_rate,installment,grade,sub_grade,annual_inc,emp_length,home_ownership,verification_status,application_type,dti,fico_range_low,fico_range_high,open_acc,pub_rec,revol_bal,revol_util,total_acc,pub_rec_bankruptcies,mort_acc,purpose,addr_state,initial_list_status';
            const rows = [
              '15000,36,12.5,501,C,C1,72000,5,RENT,Verified,Individual,18.5,690,694,8,0,12000,45,20,0,0,debt_consolidation,CA,w',
              '8000,36,7.2,247,B,B2,55000,3,MORTGAGE,Not Verified,Individual,12.1,720,724,6,0,5000,22,15,0,1,credit_card,NY,w',
              '25000,60,18.9,646,D,D3,42000,1,RENT,Source Verified,Individual,28.4,650,654,11,1,18000,72,25,1,0,debt_consolidation,TX,f',
            ];
            const csv = [headers, ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'applicant_template.csv';
            a.click();
            URL.revokeObjectURL(url);
          }} className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white flex items-center gap-2">
            <Download size={12} /> Template CSV
          </button>
        </div>
      </div>
    </div>
  );
}
