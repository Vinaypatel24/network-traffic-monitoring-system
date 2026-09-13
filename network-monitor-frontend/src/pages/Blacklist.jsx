import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Ban, Trash2, Plus, Shield, RefreshCw, AlertTriangle } from 'lucide-react';

const Blacklist = () => {
  const { blacklist, blacklistLoading, fetchBlacklist, addToBlacklist, removeFromBlacklist } = useAppData();
  const [newIp, setNewIp] = useState('');
  const [reason, setReason] = useState('');
  const [addError, setAddError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // id to confirm

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newIp) return;
    setAddError('');
    try {
      await addToBlacklist(newIp, reason);
      setNewIp('');
      setReason('');
    } catch (error) {
      setAddError(error.response?.data?.message || 'Failed to add IP');
    }
  };

  const handleRemove = async (id) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000); // auto-cancel confirm
      return;
    }
    setConfirmDelete(null);
    try {
      await removeFromBlacklist(id);
    } catch (error) {
      console.error('Failed to remove IP:', error);
    }
  };

  return (
    <div className="animate-fade-in">

      {/* ── Header ── */}
      <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.62rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '0.3rem',
          }}>
            // Firewall Rules
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              IP Blacklist
            </h2>
            <span style={{
              background: 'rgba(255,34,68,0.1)',
              color: 'var(--neon-red, #ff2244)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.15rem 0.55rem',
              borderRadius: '3px',
              border: '1px solid rgba(255,34,68,0.25)',
              letterSpacing: '0.06em',
              textShadow: '0 0 8px rgba(255,34,68,0.3)',
            }}>
              {blacklist.length} RULES
            </span>
          </div>
          <p style={{
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            marginTop: '0.2rem',
            fontFamily: "'Inter', sans-serif",
          }}>
            Connections from these IPs will be blocked and trigger alerts.
          </p>
        </div>

        <button
          id="btn-refresh-blacklist"
          onClick={fetchBlacklist}
          className="btn btn-outline"
          style={{ padding: '0.45rem 0.6rem' }}
          title="Refresh"
        >
          <RefreshCw size={14} className={blacklistLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid-cols-3">

        {/* ── Add Rule Panel ── */}
        <div className="glass-panel" style={{ height: 'fit-content' }}>
          {/* Panel header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            paddingBottom: '0.875rem',
            borderBottom: '1px solid var(--border-color)',
          }}>
            <Shield size={16} color="var(--neon-red, #ff2244)" />
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
            }}>
              Add Firewall Rule
            </span>
          </div>

          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">IP Address</label>
              <input
                id="input-blacklist-ip"
                type="text"
                className="form-input"
                placeholder="192.168.1.100"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reason (Optional)</label>
              <input
                id="input-blacklist-reason"
                type="text"
                className="form-input"
                placeholder="Port scanning, malicious traffic..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {addError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255,34,68,0.08)',
                border: '1px solid rgba(255,34,68,0.2)',
                borderRadius: '5px',
                padding: '0.6rem 0.75rem',
                marginBottom: '1rem',
                fontSize: '0.78rem',
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--neon-red, #ff2244)',
              }}>
                <AlertTriangle size={12} />
                {addError}
              </div>
            )}

            <button
              id="btn-add-blacklist"
              type="submit"
              className="btn btn-danger"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Plus size={15} /> Add to Blacklist
            </button>
          </form>

          {/* Warning notice */}
          <div style={{
            marginTop: '1.25rem',
            padding: '0.75rem',
            borderRadius: '5px',
            background: 'rgba(255,184,0,0.06)',
            border: '1px solid rgba(255,184,0,0.15)',
          }}>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.65rem',
              color: 'var(--neon-amber, #ffb800)',
              letterSpacing: '0.04em',
              lineHeight: 1.6,
            }}>
              ⚠ Blacklisted IPs are blocked at the capture level. All traffic from these addresses will trigger alerts.
            </p>
          </div>
        </div>

        {/* ── Blacklist Table ── */}
        <div className="glass-panel" style={{ gridColumn: 'span 2', padding: 0, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <Ban size={15} color="var(--neon-red, #ff2244)" />
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
            }}>
              Blocked IP Addresses
            </span>
          </div>

          {blacklistLoading ? (
            <div className="flex-center" style={{ padding: '3rem' }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
              }}>
                LOADING_RULES...
              </span>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Reason</th>
                  <th>Added At</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {blacklist.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{
                      padding: '3rem',
                      textAlign: 'center',
                    }}>
                      <Ban size={28} style={{ opacity: 0.15, display: 'block', margin: '0 auto 0.75rem', color: 'var(--neon-red)' }} />
                      <p style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.08em',
                      }}>
                        NO_RULES_CONFIGURED
                      </p>
                    </td>
                  </tr>
                ) : (
                  blacklist.map(ip => (
                    <tr key={ip.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'var(--neon-red, #ff2244)',
                            boxShadow: '0 0 6px rgba(255,34,68,0.6)',
                            flexShrink: 0,
                          }} />
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: 'var(--neon-red, #ff2244)',
                            textShadow: '0 0 8px rgba(255,34,68,0.3)',
                          }}>
                            {ip.ipAddress}
                          </span>
                        </div>
                      </td>
                      <td style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                        fontFamily: "'Inter', sans-serif",
                      }}>
                        {ip.reason || (
                          <span style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem' }}>
                            —
                          </span>
                        )}
                      </td>
                      <td style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                      }}>
                        {(ip.addedAt || ip.createdAt)
                          ? new Date(ip.addedAt || ip.createdAt).toLocaleString()
                          : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          id={`btn-remove-ip-${ip.id}`}
                          onClick={() => handleRemove(ip.id)}
                          className={`btn ${confirmDelete === ip.id ? 'btn-danger' : 'btn-outline'}`}
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.72rem',
                            ...(confirmDelete !== ip.id && {
                              borderColor: 'transparent',
                              color: 'var(--text-muted)',
                            }),
                          }}
                          title={confirmDelete === ip.id ? 'Click again to confirm' : 'Remove from blacklist'}
                        >
                          {confirmDelete === ip.id
                            ? <><AlertTriangle size={12} /> CONFIRM</>
                            : <Trash2 size={14} />
                          }
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
