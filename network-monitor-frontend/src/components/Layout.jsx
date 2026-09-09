import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Activity, ShieldAlert, FileText, Ban, LogOut, Sun, Moon, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
  const { logout, user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Activity size={20} /> },
    { name: 'Packets', path: '/packets', icon: <FileText size={20} /> },
    { name: 'Alerts', path: '/alerts', icon: <ShieldAlert size={20} /> },
    { name: 'Blacklist', path: '/blacklist', icon: <Ban size={20} /> },
  ];

  return (
    <div style={{
      width: '260px',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      zIndex: 20,
      transition: 'background-color var(--transition-normal), border-color var(--transition-normal)'
    }}>
      <div style={{ padding: '1.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
          color: '#ffffff',
          padding: '0.55rem',
          borderRadius: '10px',
          boxShadow: 'var(--shadow-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Activity size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
            Net<span style={{ color: 'var(--accent-primary)' }}>Monitor</span>
          </h2>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.05em' }}>
            DEEP PACKET INSPECTION
          </p>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '9px',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-primary-dim)' : 'transparent',
              border: isActive ? '1px solid var(--accent-primary-dim)' : '1px solid transparent',
              fontWeight: isActive ? 600 : 500,
              textDecoration: 'none',
              transition: 'all var(--transition-fast)'
            })}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ marginBottom: '0.9rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Logged in as <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{user?.username}</strong>
        </div>
        <button 
          onClick={logout} 
          className="btn btn-outline" 
          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.55rem', fontSize: '0.85rem' }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
};

const Layout = () => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'System Dashboard';
      case '/packets': return 'Real-Time Packet Stream';
      case '/alerts': return 'Threat Intelligence & Alerts';
      case '/blacklist': return 'IP Blacklist Firewall';
      default: return 'Network Traffic Monitor';
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />
      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          height: '70px',
          backgroundColor: 'var(--header-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          borderBottom: '1px solid var(--border-color)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          transition: 'background-color var(--transition-normal), border-color var(--transition-normal)'
        }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {getPageTitle()}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Live Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '999px',
              padding: '0.3rem 0.75rem',
              fontSize: '0.78rem',
              color: 'var(--success)',
              fontWeight: 600
            }}>
              <Radio size={14} className="animate-pulse" />
              Live Engine Active
            </div>

            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>
        
        <main style={{ padding: '2rem', flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
