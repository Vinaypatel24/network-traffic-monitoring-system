import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, Activity, Sun, Moon, Terminal, Shield } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-primary)',
    }}>

      {/* ── Theme Toggle ── */}
      <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 20 }}>
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={isDark ? 'Light Mode' : 'Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* ══════════════════════════════════════════
          LEFT PANEL — Animated cyber background
          ══════════════════════════════════════════ */}
      <div style={{
        flex: '1 1 55%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        position: 'relative',
        borderRight: '1px solid var(--border-color)',
        overflow: 'hidden',
        background: 'var(--bg-secondary)',
      }}>

        {/* Grid Background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,255,65,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,65,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          zIndex: 0,
        }} />

        {/* Radial glow */}
        <div style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,255,65,0.06) 0%, transparent 70%)',
          zIndex: 0,
        }} />

        {/* Corner brackets */}
        {[
          { top: '20px', left: '20px', borderTop: '2px solid', borderLeft: '2px solid' },
          { top: '20px', right: '20px', borderTop: '2px solid', borderRight: '2px solid' },
          { bottom: '20px', left: '20px', borderBottom: '2px solid', borderLeft: '2px solid' },
          { bottom: '20px', right: '20px', borderBottom: '2px solid', borderRight: '2px solid' },
        ].map((style, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: '24px',
            height: '24px',
            borderColor: 'rgba(0,255,65,0.3)',
            ...style,
            zIndex: 1,
          }} />
        ))}

        {/* Floating hex values */}
        {[
          { top: '12%', left: '8%', text: '0x4E', opacity: 0.15, delay: '0s' },
          { top: '22%', left: '75%', text: 'ACK', opacity: 0.12, delay: '0.5s' },
          { top: '38%', left: '5%', text: 'FF:E2', opacity: 0.1, delay: '1s' },
          { top: '55%', left: '80%', text: '0x1A', opacity: 0.13, delay: '1.5s' },
          { top: '68%', left: '12%', text: 'SYN', opacity: 0.1, delay: '0.8s' },
          { top: '80%', left: '70%', text: '0xC0', opacity: 0.12, delay: '0.3s' },
          { top: '88%', left: '35%', text: 'RST', opacity: 0.09, delay: '2s' },
        ].map((item, i) => (
          <span key={i} style={{
            position: 'absolute',
            top: item.top,
            left: item.left,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.7rem',
            color: 'var(--neon-green, #00ff41)',
            opacity: item.opacity,
            animation: `matrixRain 4s ease-in-out ${item.delay} infinite`,
            zIndex: 1,
            userSelect: 'none',
          }}>
            {item.text}
          </span>
        ))}

        {/* Center content */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '380px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '12px',
            border: '1px solid rgba(0,255,65,0.4)',
            background: 'rgba(0,255,65,0.07)',
            boxShadow: '0 0 30px rgba(0,255,65,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <Shield size={36} color="var(--neon-green, #00ff41)" />
          </div>

          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            marginBottom: '0.5rem',
            lineHeight: 1.2,
          }}>
            Net<span style={{
              color: 'var(--neon-green, #00ff41)',
              textShadow: '0 0 16px rgba(0,255,65,0.5)',
            }}>Monitor</span>
          </h1>

          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '2rem',
          }}>
            Deep Packet Inspection // v2.0
          </p>

          {/* Feature list */}
          {[
            'Real-time traffic analysis',
            'AI-powered threat detection',
            'IP blacklist enforcement',
            'Forensic packet inspection',
          ].map((feat, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.6rem',
              textAlign: 'left',
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--neon-green, #00ff41)',
                boxShadow: '0 0 6px rgba(0,255,65,0.6)',
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}>
                {feat}
              </span>
            </div>
          ))}

          {/* Scanning line */}
          <div style={{
            marginTop: '2rem',
            padding: '0.6rem 1rem',
            borderRadius: '4px',
            background: 'rgba(0,255,65,0.04)',
            border: '1px solid rgba(0,255,65,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <Terminal size={12} color="var(--neon-green, #00ff41)" />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
            }}>
              {'> '}
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.68rem',
              color: 'var(--neon-green, #00ff41)',
              opacity: 0.8,
            }}
              className="terminal-cursor"
            >
              Awaiting authentication
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT PANEL — Login Form
          ══════════════════════════════════════════ */}
      <div style={{
        flex: '0 0 420px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2.5rem',
        background: 'var(--bg-primary)',
      }}>
        <div className="animate-fade-in" style={{ width: '100%', maxWidth: '340px' }}>

          {/* Form header */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}>
              // Secure Access Portal
            </div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>
              Sign In
            </h2>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginTop: '0.3rem',
            }}>
              Authorized personnel only
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(255,34,68,0.08)',
              border: '1px solid rgba(255,34,68,0.3)',
              borderLeft: '3px solid var(--neon-red, #ff2244)',
              padding: '0.875rem 1rem',
              borderRadius: '6px',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--neon-red, #ff2244)',
              boxShadow: '-4px 0 12px rgba(255,34,68,0.1)',
            }}>
              [ERROR] {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <User
                  size={15}
                  color="var(--text-muted)"
                  style={{
                    position: 'absolute', left: '0.875rem',
                    top: '50%', transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="login-username"
                  type="text"
                  className="form-input"
                  placeholder="operator_id"
                  style={{ paddingLeft: '2.5rem' }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={15}
                  color="var(--text-muted)"
                  style={{
                    position: 'absolute', left: '0.875rem',
                    top: '50%', transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="login-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  style={{ paddingLeft: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem' }}
              disabled={loading}
            >
              {loading
                ? <><Activity size={16} className="animate-spin" /> Authenticating...</>
                : <><ArrowRight size={16} /> Access System</>
              }
            </button>
          </form>

          {/* Footer */}
          <p style={{
            marginTop: '2rem',
            textAlign: 'center',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.62rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
          }}>
            ALL ACTIVITY IS MONITORED AND LOGGED
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
