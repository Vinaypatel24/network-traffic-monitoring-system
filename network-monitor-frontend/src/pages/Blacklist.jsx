import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Ban, Trash2, Plus, Shield, RefreshCw } from 'lucide-react';

const Blacklist = () => {
  const { blacklist, blacklistLoading, fetchBlacklist, addToBlacklist, removeFromBlacklist } = useAppData();
  const [newIp, setNewIp] = useState('');
  const [reason, setReason] = useState('');
  const [addError, setAddError] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newIp) return;
    setAddError('');
    try {
      await addToBlacklist(newIp, reason);
      setNewIp('');
      setReason('');
    } catch (error) {
      console.error('Failed to add IP to blacklist:', error);
      setAddError(error.response?.data?.message || 'Failed to add IP');
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this IP from the blacklist?')) return;
    try {
      await removeFromBlacklist(id);
    } catch (error) {
      console.error('Failed to remove IP:', error);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>IP Blacklist Management</h2>
            <span style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--danger)',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.15rem 0.6rem',
              borderRadius: '999px',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              {blacklist.length} {blacklist.length === 1 ? 'Rule' : 'Rules'}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Connections from these IPs will be blocked and trigger alerts.
          </p>
        </div>
        <button
          onClick={fetchBlacklist}
          className="btn btn-outline"
          style={{ padding: '0.45rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          title="Refresh blacklist"
        >
          <RefreshCw size={15} className={blacklistLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid-cols-3">
        {/* Add New Rule */}
        <div className="glass-panel" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Shield size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Add New Rule</h3>
          </div>

          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">IP Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 192.168.1.100"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reason (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Repeated port scanning"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {addError && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{addError}</p>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Plus size={18} /> Add to Blacklist
            </button>
          </form>
        </div>

        {/* Blacklist Table */}
        <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
          {blacklistLoading ? (
            <div className="flex-center" style={{ padding: '3rem' }}>Loading...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>IP Address</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Reason</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Added At</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blacklist.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Ban size={32} style={{ opacity: 0.2, marginBottom: '1rem', display: 'block', margin: '0 auto 0.5rem' }} />
                      <p>No IPs are currently blacklisted</p>
                    </td>
                  </tr>
                ) : (
                  blacklist.map(ip => (
                    <tr key={ip.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 600 }}>{ip.ipAddress}</td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{ip.reason || '-'}</td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {ip.addedAt || ip.createdAt ? new Date(ip.addedAt || ip.createdAt).toLocaleString() : '-'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleRemove(ip.id)}
                          className="btn btn-outline"
                          style={{ padding: '0.4rem', color: 'var(--danger)', borderColor: 'transparent' }}
                          title="Remove from blacklist"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Blacklist;
