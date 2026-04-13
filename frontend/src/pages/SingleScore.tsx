import { useState, useEffect } from 'react';
import { Zap, RefreshCw, Target, TrendingUp, TrendingDown, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { scoreApplicant, type ApplicantInput, type ScoreResult } from '../hooks/useApi';

// Default form values
const DEFAULTS: ApplicantInput = {
  loan_amnt: 15000,
  term: 36,
  int_rate: 12.5,
  installment: 501,
  grade: 'C',
  sub_grade: 'C1',
  annual_inc: 72000,
  emp_length: 5,
  home_ownership: 'RENT',
  verification_status: 'Verified',
  application_type: 'Individual',
  dti: 18.5,
  fico_range_low: 690,
  fico_range_high: 694,
  open_acc: 8,
  pub_rec: 0,
  revol_bal: 12000,
  revol_util: 45,
  total_acc: 20,
  pub_rec_bankruptcies: 0,
  mort_acc: 0,
  purpose: 'debt_consolidation',
  addr_state: 'CA',
  initial_list_status: 'w',
  num_actv_rev_tl: 5,
  bc_util: 42,
  avg_cur_bal: 8000,
  acc_open_past_24mths: 3,
};

// Score Ring Component
function ScoreRing({ percentage, color }: { percentage: number; color: string }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference * (1 - percentage / 100));
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full score-ring" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="14" strokeOpacity="0.15" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)' }} />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)', filter: `drop-shadow(0 0 8px ${color})` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{percentage}%</span>
        <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider">PD Score</span>
      </div>
    </div>
  );
}

// Processing Overlay
function ProcessingOverlay({ progress, stage }: { progress: number; stage: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8" style={{ background: 'rgba(5,6,15,0.98)', backdropFilter: 'blur(20px)' }}>
      <div className="relative w-28 h-28">
        <svg className="absolute inset-0 w-full h-full" style={{ animation: 'spin 3s linear infinite' }}>
          <circle cx="56" cy="56" r="50" fill="none" stroke="rgba(232,245,50,0.2)" strokeWidth="1" strokeDasharray="6 10" />
        </svg>
        <svg className="absolute inset-0 w-full h-full" style={{ animation: 'spin-reverse 4s linear infinite' }}>
          <circle cx="56" cy="56" r="38" fill="none" stroke="rgba(0,229,197,0.2)" strokeWidth="1" strokeDasharray="4 8" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-[#e8f532]">{Math.min(Math.round(progress), 100)}</span>
          <span className="text-[10px] text-white/40 font-mono">PCT</span>
        </div>
      </div>
      <div className="text-xs text-[#e8f532] font-mono tracking-[0.2em] uppercase">{stage}</div>
      <div className="w-64">
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-150" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #e8f532, #00e5c5)' }} />
        </div>
      </div>
    </div>
  );
}

// Decision Result Component
function DecisionResult({ result, onReset }: { result: ScoreResult; onReset: () => void }) {
  const decisionConfig = {
    APPROVE: { icon: CheckCircle, color: '#22d47a', bgColor: 'rgba(34,212,122,0.08)', borderColor: 'rgba(34,212,122,0.25)' },
    REFER: { icon: AlertCircle, color: '#ffb020', bgColor: 'rgba(255,176,32,0.08)', borderColor: 'rgba(255,176,32,0.25)' },
    DECLINE: { icon: XCircle, color: '#ff4f6e', bgColor: 'rgba(255,79,110,0.08)', borderColor: 'rgba(255,79,110,0.25)' },
  };

  const config = decisionConfig[result.decision];
  const DecisionIcon = config.icon;
  const maxMagnitude = Math.max(...result.shap_reasons.map(r => r.magnitude), 0.001);

  return (
    <div className="space-y-6">
      {/* Main Result Card */}
      <div className="rounded-2xl p-6 lg:p-8 fade-up visible" style={{ background: `linear-gradient(145deg, ${config.bgColor}, rgba(8,15,26,0.8))`, border: `1px solid ${config.borderColor}`, boxShadow: `0 0 60px ${config.bgColor}` }}>
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left - Decision */}
          <div className="space-y-6">
            <div>
              <div className="text-xs font-mono tracking-[0.25em] uppercase mb-2" style={{ color: config.color }}>Credit Decision</div>
              <div className="flex items-center gap-3">
                <DecisionIcon size={32} style={{ color: config.color }} />
                <span className="text-4xl lg:text-5xl font-bold" style={{ color: config.color, textShadow: `0 0 40px ${config.color}66` }}>{result.decision}</span>
              </div>
              <div className="text-sm text-white/50 font-mono mt-2">{result.risk_tier} Risk Tier</div>
            </div>

            <div className="flex items-center gap-6">
              <ScoreRing percentage={result.pd_pct} color={result.tier_color} />
              <div>
                <div className="text-xs font-mono tracking-[0.15em] uppercase text-white/40 mb-1">Expected Loss</div>
                <div className="text-3xl font-bold" style={{ color: config.color }}>${result.expected_loss.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                <div className="text-xs text-white/40 mt-1">{result.el_pct}% of funded amount</div>
              </div>
            </div>
          </div>

          {/* Right - Metrics */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Raw PD', value: result.pd_score.toFixed(4), color: result.tier_color },
              { label: 'Funded', value: `$${result.funded_amnt.toLocaleString()}`, color: 'white' },
              { label: 'LGD', value: `${(result.lgd_assumption * 100).toFixed(0)}%`, color: 'rgba(255,255,255,0.6)' },
            ].map((metric) => (
              <div key={metric.label} className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-lg font-bold" style={{ color: metric.color }}>{metric.value}</div>
                <div className="text-[10px] text-white/40 font-mono uppercase tracking-wider mt-1">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/[0.06]">
          <div className="text-xs text-white/40 font-mono">{new Date(result.scored_at).toLocaleTimeString()} · v{result.model_version}</div>
          <button onClick={onReset} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white">
            <RefreshCw size={12} className="inline mr-2" /> New Application
          </button>
        </div>
      </div>

      {/* SHAP Reasons */}
      <div className="rounded-2xl p-6 fade-up visible" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', animationDelay: '150ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} className="text-[#e8f532]" />
          <span className="text-sm font-semibold">Adverse Action Factors</span>
        </div>
        
        <div className="text-xs text-white/50 mb-4 p-3 rounded-lg" style={{ background: 'rgba(232,245,50,0.03)', border: '1px solid rgba(232,245,50,0.08)' }}>
          SHAP attribution — each factor's directional contribution. Provide top adverse factors to any declined applicant (FCRA §615).
        </div>

        <div className="space-y-3">
          {result.shap_reasons.map((reason, i) => (
            <div key={i} className="flex items-center gap-4 slide-in-left visible" style={{ animationDelay: `${i * 80 + 300}ms` }}>
              <span className="w-5 text-xs text-white/40 font-mono">{i + 1}</span>
              <span className="flex-1 text-sm text-white/80 min-w-[160px]">{reason.feature}</span>
              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(reason.magnitude / maxMagnitude) * 100}%`, background: reason.direction === 'increases' ? 'linear-gradient(90deg, rgba(255,79,110,0.5), #ff4f6e)' : 'linear-gradient(90deg, rgba(34,212,122,0.5), #22d47a)', boxShadow: reason.direction === 'increases' ? '0 0 6px rgba(255,79,110,0.4)' : '0 0 6px rgba(34,212,122,0.4)' }} />
              </div>
              <span className={`flex items-center gap-1 text-xs font-mono min-w-[70px] justify-end ${reason.direction === 'increases' ? 'text-[#ff4f6e]' : 'text-[#22d47a]'}`}>
                {reason.direction === 'increases' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                Risk {reason.direction === 'increases' ? '↑' : '↓'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function SingleScore() {
  const [form, setForm] = useState<ApplicantInput>(DEFAULTS);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');

  const stages = [
    'Loading feature pipeline...',
    'Running LightGBM inference...',
    'Computing SHAP values...',
    'Calibrating probabilities...',
    'Building adverse action report...',
  ];

  const handleChange = (key: keyof ApplicantInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setProgress(0);

    let p = 0;
    const interval = setInterval(() => {
      p = Math.min(p + 2 + Math.random() * 3, 95);
      setProgress(p);
      setStage(stages[Math.floor(p / 20)] || stages[4]);
    }, 80);

    try {
      const data = await scoreApplicant(form);
      clearInterval(interval);
      setProgress(100);
      await new Promise(r => setTimeout(r, 400));
      setResult(data);
    } catch (error) {
      clearInterval(interval);
      // Demo mode fallback
      const demoResult: ScoreResult = {
        pd_score: 0.1523,
        pd_pct: 15.23,
        risk_tier: 'Medium-High',
        tier_color: '#ffb020',
        decision: 'REFER',
        expected_loss: 1978,
        el_pct: 13.19,
        funded_amnt: 15000,
        lgd_assumption: 0.87,
        shap_reasons: [
          { feature: 'FICO Credit Score', direction: 'increases', magnitude: 0.08 },
          { feature: 'Debt-to-Income Ratio', direction: 'increases', magnitude: 0.05 },
          { feature: 'Monthly Payment Burden', direction: 'increases', magnitude: 0.03 },
          { feature: 'Revolving Utilisation', direction: 'increases', magnitude: 0.02 },
          { feature: 'Public Records', direction: 'decreases', magnitude: 0.01 },
        ],
        scored_at: new Date().toISOString(),
        model_version: '2.0-demo',
      };
      setResult(demoResult);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    {
      title: 'Loan Structure',
      fields: [
        { key: 'loan_amnt', label: 'Loan Amount ($)', type: 'number' },
        { key: 'term', label: 'Term', type: 'select', options: [{ v: 36, l: '36 months' }, { v: 60, l: '60 months' }] },
        { key: 'int_rate', label: 'Interest Rate (%)', type: 'number', step: '0.1' },
        { key: 'installment', label: 'Monthly Install. ($)', type: 'number' },
        { key: 'grade', label: 'Grade', type: 'select', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },
        { key: 'sub_grade', label: 'Sub-Grade', type: 'select', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'].flatMap(g => [1, 2, 3, 4, 5].map(n => `${g}${n}`)) },
      ],
    },
    {
      title: 'Borrower Profile',
      fields: [
        { key: 'annual_inc', label: 'Annual Income ($)', type: 'number' },
        { key: 'emp_length', label: 'Employment (yrs)', type: 'number' },
        { key: 'home_ownership', label: 'Home Ownership', type: 'select', options: ['RENT', 'MORTGAGE', 'OWN', 'OTHER'] },
        { key: 'verification_status', label: 'Verification', type: 'select', options: ['Verified', 'Source Verified', 'Not Verified'] },
        { key: 'purpose', label: 'Loan Purpose', type: 'select', options: ['debt_consolidation', 'credit_card', 'home_improvement', 'other', 'major_purchase', 'medical', 'small_business', 'car', 'vacation', 'moving'] },
        { key: 'application_type', label: 'Application Type', type: 'select', options: ['Individual', 'Joint App'] },
      ],
    },
    {
      title: 'Credit Bureau',
      fields: [
        { key: 'fico_range_low', label: 'FICO Low', type: 'number' },
        { key: 'fico_range_high', label: 'FICO High', type: 'number' },
        { key: 'dti', label: 'DTI (%)', type: 'number', step: '0.1' },
        { key: 'revol_util', label: 'Revol. Util (%)', type: 'number', step: '0.1' },
        { key: 'revol_bal', label: 'Revol. Balance ($)', type: 'number' },
        { key: 'pub_rec', label: 'Public Records', type: 'number' },
        { key: 'pub_rec_bankruptcies', label: 'Bankruptcies', type: 'number' },
        { key: 'open_acc', label: 'Open Accounts', type: 'number' },
        { key: 'total_acc', label: 'Total Accounts', type: 'number' },
        { key: 'mort_acc', label: 'Mortgage Accounts', type: 'number' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {loading && <ProcessingOverlay progress={progress} stage={stage} />}

      {/* Header */}
      <div className="fade-up visible">
        <div className="flex items-center gap-2 text-xs font-mono tracking-[0.3em] uppercase text-[#e8f532] mb-3">
          <span className="w-4 h-px bg-[#e8f532]" />
          Credit Origination
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">Single Applicant Scoring</h1>
        <p className="text-sm text-white/50 max-w-xl">Enter applicant details to generate a calibrated PD score, Expected Loss in dollars, and SHAP-powered adverse action reasons.</p>
      </div>

      {result ? (
        <DecisionResult result={result} onReset={() => setResult(null)} />
      ) : (
        <>
          {/* Form */}
          <div className="rounded-2xl p-6 fade-up visible" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', animationDelay: '80ms' }}>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232,245,50,0.1)' }}>
                <Zap size={14} className="text-[#e8f532]" />
              </div>
              <span className="font-semibold">Applicant Details</span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.map((section) => (
                <div key={section.title} className="col-span-full">
                  <div className="flex items-center gap-3 my-4">
                    <span className="text-xs font-mono tracking-[0.2em] uppercase text-[#e8f532]">{section.title}</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-[rgba(232,245,50,0.3)] to-transparent" />
                  </div>
                  {section.fields.map((field: any) => (
                    <div key={field.key} className="space-y-1">
                      <label className="text-[10px] font-mono tracking-[0.15em] uppercase text-white/40">{field.label}</label>
                      {field.type === 'select' ? (
                        <select className="w-full px-4 py-3 rounded-lg text-sm bg-white/[0.03] border border-white/[0.06] text-white focus:outline-none focus:border-[#e8f532]/50 focus:bg-[rgba(232,245,50,0.04)] transition-all" value={form[field.key as keyof ApplicantInput] as string | number} onChange={handleChange(field.key as keyof ApplicantInput)}>
                          {field.options?.map((opt: any) => (
                            <option className="bg-[#05060f] text-white" key={typeof opt === 'object' ? opt.v : opt} value={typeof opt === 'object' ? opt.v : opt}>{typeof opt === 'object' ? opt.l : opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input type="number" step={field.step || '1'} className="w-full px-4 py-3 rounded-lg text-sm bg-white/[0.03] border border-white/[0.06] text-white focus:outline-none focus:border-[#e8f532]/50 focus:bg-[rgba(232,245,50,0.04)] transition-all font-mono" value={form[field.key as keyof ApplicantInput] as number} onChange={handleChange(field.key as keyof ApplicantInput)} />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-4 fade-up visible" style={{ animationDelay: '160ms' }}>
            <button onClick={handleSubmit} disabled={loading} className="px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #e8f532, #d4de1e)', color: '#05060f', boxShadow: '0 4px 20px rgba(232,245,50,0.3)' }}>
              {loading ? <><span className="w-4 h-4 border-2 border-white/10 border-t-[#05060f] rounded-full animate-spin" /> Scoring...</> : <><Zap size={16} /> Score Applicant</>}
            </button>
            <button onClick={() => setForm(DEFAULTS)} className="px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300 bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white">
              <RefreshCw size={14} className="inline mr-2" /> Reset
            </button>
            <div className="ml-auto text-xs text-white/40 font-mono">PD × LGD × EAD = Expected Loss</div>
          </div>
        </>
      )}
    </div>
  );
}
