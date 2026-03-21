import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import { Activity, Search, Shield, ArrowRight, Zap, Target, Lock } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Animated counters
  const [gini, setGini] = useState(0);
  const [ks, setKs] = useState(0);
  const [decisions, setDecisions] = useState(0);

  useEffect(() => {
    // Elegant count-up animation
    const duration = 2000;
    const steps = 60;
    const stepTime = Math.abs(Math.floor(duration / steps));
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      // Ease out quad
      const progress = 1 - (1 - currentStep / steps) * (1 - currentStep / steps);
      
      setGini(0.4415 * progress);
      setKs(33.51 * progress);
      setDecisions(50000 * progress);

      if (currentStep >= steps) clearInterval(timer);
    }, stepTime);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="landing-page">
      {/* Background layer */}
      <div className="ambient-bg">
        <div className="aurora-orb aurora-1" style={{ width: '100vw', height: '100vh', opacity: 0.15 }}></div>
        <div className="aurora-orb aurora-4" style={{ top: '20%', left: '10%', opacity: 0.1 }}></div>
        <div className="grid-overlay" style={{ opacity: 0.35 }}></div>
        <div className="scan-line"></div>
        <div className="vignette"></div>
      </div>

      <nav className="landing-nav flex items-center justify-between">
        <div className="flex items-center gap-sm">
          <div className="brand-logo" style={{ width: 28, height: 28 }}>⊕</div>
          <span className="brand-name text-sm">CreditEngine</span>
        </div>
        <button 
          className="btn btn-ghost" 
          style={{ padding: '0.4rem 1rem', fontSize: '0.7rem' }}
          onClick={() => navigate(isAuthenticated ? '/app' : '/login')}
        >
          {isAuthenticated ? 'GO TO CONSOLE' : 'OPERATOR LOGIN'}
        </button>
      </nav>

      <main className="landing-hero container">
        <div className="hero-content">
          <div className="page-eyebrow anim-fade-up d0">INSTITUTIONAL GRADE RISK ENGINE</div>
          <h1 className="hero-title anim-fade-up d1">
            Predict Defaults Before<br />They Happen.
          </h1>
          <p className="hero-subtitle anim-fade-up d2">
            AI-powered loan origination with precise Probability of Default (PD), 
            Expected Loss (EL) projection, and fully auditable SHAP risk factors. 
            Built for modern credit teams.
          </p>

          <div className="hero-actions anim-fade-up d3">
            <button className="btn btn-primary cta-btn" onClick={() => navigate(isAuthenticated ? '/app' : '/login')}>
              LAUNCH TERMINAL <ArrowRight size={16} />
            </button>
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span>API SYSTEMS ONLINE</span>
            </div>
          </div>
        </div>

        <div className="hero-stats anim-fade-up d4">
          <div className="stat-card">
            <div className="stat-val">{gini.toFixed(4)}</div>
            <div className="stat-label">GINI COEFFICIENT</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{ks.toFixed(2)}%</div>
            <div className="stat-label">K-S STATISTIC</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{Math.floor(decisions).toLocaleString()}+</div>
            <div className="stat-label">DECISIONS PROCESSED</div>
          </div>
        </div>
      </main>

      <section className="features-section container">
        <div className="feature-grid">
          <div className="feature-card anim-fade-up d5">
            <div className="feature-icon"><Zap /></div>
            <h3>Real-Time Scoring</h3>
            <p>Instantaneous single-applicant analysis returning risk tier, calculated expected loss, and automated decisioning.</p>
          </div>
          
          <div className="feature-card anim-fade-up d6">
            <div className="feature-icon"><Search /></div>
            <h3>SHAP Explainability</h3>
            <p>Every score is broken down into constituent risk factors to ensure Fair Lending compliance and easy adverse action reporting.</p>
          </div>
          
          <div className="feature-card anim-fade-up d7">
            <div className="feature-icon"><Activity /></div>
            <h3>Portfolio Batching</h3>
            <p>Drag-and-drop CSV processing for high-volume portfolio analysis. Score thousands of applicants in seconds.</p>
          </div>

          <div className="feature-card anim-fade-up d5">
            <div className="feature-icon"><Shield /></div>
            <h3>Immutable Audit Log</h3>
            <p>Every single API request and risk decision is persistently logged for compliance, regulator review, and model drift analysis.</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p className="text-mono text-dim" style={{ fontSize: '0.55rem', letterSpacing: '0.1em' }}>
          CREDIT ENGINE V2.1 // CONFIDENTIAL AND PROPRIETARY
        </p>
      </footer>
    </div>
  );
}
