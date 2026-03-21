import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import { ShieldAlert } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
      login(res.data.access_token);
      navigate('/app');
    } catch (err) {
      setError('AUTHORIZATION FAILED');
      setShake(true);
      setTimeout(() => setShake(false), 500); // match shake animation duration
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="ambient-bg">
        <div className="aurora-orb aurora-1" />
        <div className="aurora-orb aurora-2" />
        <div className="grid-overlay" />
        <div className="vignette" />
      </div>

      <div className={`login-card ${shake ? 'anim-shake' : ''}`}>
        <div className="login-header">
          <div className="brand-logo anim-float">⊕</div>
          <h1 className="login-title">CREDIT ENGINE</h1>
          <p className="login-subtitle">SECURE ACCESS PORTAL</p>
        </div>

        {error && (
          <div className="login-error anim-fade-in">
            <ShieldAlert size={14} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="form-label">OPERATOR ID</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">ACCESS CODE</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
            {isLoading ? <span className="spinner" /> : 'AUTHENTICATE'}
          </button>
        </form>
      </div>
    </div>
  );
}
