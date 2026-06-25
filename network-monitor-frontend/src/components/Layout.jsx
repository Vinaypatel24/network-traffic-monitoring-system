import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Activity, ShieldAlert, FileText, Ban, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
      position: 'fixed'
    }}>
      <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          background: 'var(--accent-primary-dim)',
          color: 'var(--accent-primary)',
          padding: '0.5rem',
          borderRadius: '8px'
        }}>
          <Activity size={24} />
        </div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.5px' }}>NetMonitor</h2>
      </div>

      <nav style={{ flex: 1, padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-glass-hover)' : 'transparent',
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

      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Logged in as <strong style={{ color: 'var(--text-primary)' }}>{user?.username}</strong>
        </div>
        <button 
          onClick={logout} 
          className="btn btn-outline" 
          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem' }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
};

const Layout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />
      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          height: '70px',
          backgroundColor: 'rgba(11, 15, 25, 0.8)',
          backdropFilter: 'var(--glass-blur)',
          borderBottom: '1px solid var(--border-color)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          padding: '0 2rem'
        }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>System Overview</h1>
        </header>
        
        <main style={{ padding: '2rem', flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
