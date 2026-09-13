import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Activity, ShieldAlert, FileText, Ban, LogOut, Sun, Moon, Radio, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/* ──────────────────────────────────────────────
   Inline styles kept minimal — most styling
   lives in index.css utility classes
   ────────────────────────────────────────────── */

const NAV_ITEMS = [
  { name: 'Dashboard',  path: '/dashboard', icon: <Activity size={18} />,    tag: '01' },
  { name: 'Packets',    path: '/packets',   icon: <FileText size={18} />,    tag: '02' },
  { name: 'Alerts',     path: '/alerts',    icon: <ShieldAlert size={18} />, tag: '03' },
  { name: 'Blacklist',  path: '/blacklist', icon: <Ban size={18} />,         tag: '04' },
];

const Sidebar = () => {
  const { logout, user } = useAuth();

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'SYS';

  return (
    <aside style={{
      width: '240px',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      zIndex: 20,
      transition: 'background-color var(--transition-normal)',
      backgroundImage: 'linear-gradient(180deg, rgba(0,255,65,0.02) 0%, transparent 40%)',
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: '1.5rem 1.25rem 1rem',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            border: '1px solid var(--neon-green-border, rgba(0,255,65,0.35))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,255,65,0.06)',
            boxShadow: '0 0 12px rgba(0,255,65,0.2)',
            flexShrink: 0,
          }}>
            <Shield size={20} color="var(--neon-green, #00ff41)" />
          </div>
          <div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: '1rem',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}>
              Net<span style={{
                color: 'var(--neon-green, #00ff41)',
                textShadow: '0 0 8px rgba(0,255,65,0.5)',
              }}>Monitor</span>
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.6rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginTop: '1px',
            }}>
              DPI // v2.0
            </div>
          </div>
        </div>
      </div>

      {/* ── System Status ── */}
      <div style={{
        margin: '0.75rem 1rem',
        padding: '0.6rem 0.85rem',
        borderRadius: '6px',
        background: 'rgba(0,255,65,0.05)',
        border: '1px solid rgba(0,255,65,0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <span className="live-dot" style={{ flexShrink: 0 }} />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.7rem',
          color: 'var(--neon-green, #00ff41)',
          letterSpacing: '0.05em',
        }}>
          SYS_ONLINE
        </span>
      </div>

      {/* ── Navigation ── */}
      <nav style={{
        flex: 1,
        padding: '0.5rem 0.875rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        overflowY: 'auto',
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.62rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '0.5rem 0.5rem 0.75rem',
        }}>
          // Navigation
        </div>

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.875rem',
              borderRadius: '6px',
              color: isActive ? 'var(--neon-green, #00ff41)' : 'var(--text-secondary)',
              background: isActive
                ? 'rgba(0,255,65,0.08)'
                : 'transparent',
              border: isActive
                ? '1px solid rgba(0,255,65,0.2)'
                : '1px solid transparent',
              borderLeft: isActive
                ? '2px solid var(--neon-green, #00ff41)'
                : '2px solid transparent',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.875rem',
              fontFamily: "'Inter', sans-serif",
              textDecoration: 'none',
              transition: 'all 0.15s ease-in-out',
              boxShadow: isActive
                ? '-4px 0 12px rgba(0,255,65,0.15), inset 0 0 12px rgba(0,255,65,0.04)'
                : 'none',
              textShadow: isActive ? '0 0 8px rgba(0,255,65,0.4)' : 'none',
            })}
          >
            <span style={{ flexShrink: 0 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.name}</span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.6rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
              opacity: 0.7,
            }}>
              {item.tag}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* ── User + Logout ── */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(0,255,65,0.02)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.75rem',
          padding: '0.5rem 0.5rem',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'rgba(0,255,65,0.1)',
            border: '1px solid rgba(0,255,65,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.65rem',
            fontWeight: 700,
            color: 'var(--neon-green, #00ff41)',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user?.username || 'Operator'}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.62rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
            }}>
              ANALYST
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.55rem',
            fontSize: '0.8rem',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            background: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.15s ease-in-out',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,34,68,0.4)';
            e.currentTarget.style.color = 'var(--neon-red, #ff2244)';
            e.currentTarget.style.background = 'rgba(255,34,68,0.06)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LogOut size={14} /> Logout
        </button>
      </div>
    </aside>
  );
};

const Layout = () => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const PAGE_META = {
    '/dashboard': { title: 'System Dashboard',             tag: 'OVERVIEW' },
    '/packets':   { title: 'Real-Time Packet Stream',      tag: 'CAPTURE' },
    '/alerts':    { title: 'Threat Intelligence & Alerts', tag: 'SECURITY' },
    '/blacklist': { title: 'IP Blacklist Firewall',         tag: 'FIREWALL' },
  };

  const meta = PAGE_META[location.pathname] || { title: 'Network Monitor', tag: 'SYS' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />

      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

        {/* ── Top Header ── */}
        <header style={{
          height: '64px',
          backgroundColor: 'var(--header-bg)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-color)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.75rem',
          transition: 'background-color var(--transition-normal)',
        }}>
          {/* Left — breadcrumb + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '0.2rem 0.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '3px',
            }}>
              {meta.tag}
            </span>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}>
              {meta.title}
            </h1>
          </div>

          {/* Right — live badge + theme */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(0,255,65,0.07)',
              border: '1px solid rgba(0,255,65,0.2)',
              borderRadius: '4px',
              padding: '0.25rem 0.7rem',
              fontSize: '0.72rem',
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--neon-green, #00ff41)',
              letterSpacing: '0.06em',
              textShadow: '0 0 8px rgba(0,255,65,0.4)',
            }}>
              <Radio size={12} style={{ animation: 'pulseGreen 1.8s ease-in-out infinite' }} />
              LIVE ENGINE
            </div>

            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main style={{ padding: '1.75rem', flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
