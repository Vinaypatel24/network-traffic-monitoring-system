import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, ArrowRight, Activity } from 'lucide-react';
import '../index.css'; // Just to ensure styles are loaded

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '2rem' }}>
      
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute', top: '10%', left: '10%', width: '300px', height: '300px',
        background: 'var(--accent-primary)', filter: 'blur(150px)', opacity: 0.1, zIndex: 0
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '10%', width: '300px', height: '300px',
        background: 'var(--accent-secondary)', filter: 'blur(150px)', opacity: 0.1, zIndex: 0
      }} />

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="flex-center" style={{ 
            width: '64px', height: '64px', borderRadius: '50%', 
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            margin: '0 auto 1rem auto', boxShadow: 'var(--shadow-glow)'
          }}>
            <Shield size={32} color="var(--accent-primary)" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Secure Access</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Network Traffic Monitoring & Threat Detection
          </p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger)',
            padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-primary)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter username" 
                style={{ paddingLeft: '2.5rem' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                className="form-input" 
                placeholder="Enter password" 
                style={{ paddingLeft: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? <Activity size={18} className="animate-spin" /> : <><ArrowRight size={18} /> Sign In</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
