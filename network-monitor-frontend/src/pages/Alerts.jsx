import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { ShieldAlert, CheckCircle, Clock, Bell, Ban, ShieldCheck, Filter, RefreshCw } from 'lucide-react';
import ForensicResolveModal from '../components/ForensicResolveModal';

const SEVERITY_CONFIG = {
  critical: { color: 'var(--neon-red,   #ff2244)', glow: 'rgba(255,34,68,0.18)',  badge: 'badge-danger',   cls: 'alert-critical' },
  high:     { color: 'var(--neon-amber, #ffb800)', glow: 'rgba(255,184,0,0.14)',  badge: 'badge-warning',  cls: 'alert-high'     },
  medium:   { color: 'var(--neon-cyan,  #00e5ff)', glow: 'rgba(0,229,255,0.12)', badge: 'badge-info',     cls: 'alert-medium'   },
  low:      { color: 'var(--neon-green, #00ff41)', glow: 'rgba(0,255,65,0.12)',  badge: 'badge-success',  cls: 'alert-low'      },
};

const getSeverity = (sev) => SEVERITY_CONFIG[sev?.toLowerCase()] || SEVERITY_CONFIG.low;

const Alerts = () => {
  const { alerts, alertsLoading, fetchAlerts, resolveAlert, acknowledgeAlert } = useAppData();
  const [selectedAlertForModal, setSelectedAlertForModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL | NEW | ACKNOWLEDGED | RESOLVED

  const handleResolve = async (alertId, action) => {
    setActionLoading(alertId + action);
    try { await resolveAlert(alertId, action); }
    catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleAcknowledge = async (alertId) => {
    try { await acknowledgeAlert(alertId); }
    catch (err) { console.error(err); }
  };

  const filtered = filter === 'ALL'
    ? alerts
    : alerts.filter(a => a.status === filter);

  const counts = {
    ALL: alerts.length,
    NEW: alerts.filter(a => a.status === 'NEW').length,
    ACKNOWLEDGED: alerts.filter(a => a.status === 'ACKNOWLEDGED').length,
    RESOLVED: alerts.filter(a => a.status === 'RESOLVED').length,
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
            // Threat Intelligence
          </div>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            Security Alerts
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            id="btn-refresh-alerts"
            onClick={fetchAlerts}
            className="btn btn-outline"
            style={{ padding: '0.45rem 0.6rem' }}
          >
            <RefreshCw size={14} className={alertsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="glass-panel" style={{ padding: '0.5rem', marginBottom: '1.25rem', display: 'flex', gap: '0.25rem' }}>
        {['ALL', 'NEW', 'ACKNOWLEDGED', 'RESOLVED'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '5px',
              border: filter === tab ? '1px solid rgba(0,255,65,0.3)' : '1px solid transparent',
              background: filter === tab ? 'rgba(0,255,65,0.08)' : 'transparent',
              color: filter === tab ? 'var(--neon-green, #00ff41)' : 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'all 0.15s ease-in-out',
              textShadow: filter === tab ? '0 0 8px rgba(0,255,65,0.4)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            {tab}
            <span style={{
              background: filter === tab ? 'rgba(0,255,65,0.15)' : 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '3px',
              padding: '0 0.35rem',
              fontSize: '0.6rem',
            }}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Alert List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {alertsLoading ? (
          <div className="flex-center glass-panel" style={{ padding: '3rem' }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
            }}>
              LOADING...
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel flex-center" style={{
            padding: '3rem',
            flexDirection: 'column',
            gap: '0.75rem',
          }}>
            <ShieldAlert size={40} style={{ opacity: 0.15, color: 'var(--neon-green)' }} />
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              letterSpacing: '0.08em',
            }}>
              NO_ALERTS_FOUND
            </p>
          </div>
        ) : (
          filtered.map(alert => {
            const s = getSeverity(alert.severity);
            return (
              <div
                key={alert.id}
                className={`glass-panel ${s.cls}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <h3 style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}>
                        {alert.alertType}
                      </h3>
                      <span className={`badge ${s.badge}`}>
                        {alert.severity || 'LOW'}
                      </span>
                      <span className={`badge ${alert.status === 'RESOLVED' ? 'badge-success' : alert.status === 'ACKNOWLEDGED' ? 'badge-warning' : 'badge-danger'}`}>
                        {alert.status}
                      </span>
                      {alert.confidenceScore && (
                        <span className="badge badge-info" style={{ fontSize: '0.62rem' }}>
                          {alert.confidenceScore}% CONF
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.5rem',
                      fontFamily: "'Inter', sans-serif",
                    }}>
                      {alert.description}
                    </p>

                    {/* Verdict */}
                    {alert.verdict && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.25rem 0.65rem',
                        marginBottom: '0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(0,229,255,0.06)',
                        border: '1px solid rgba(0,229,255,0.15)',
                        fontSize: '0.78rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        color: 'var(--neon-cyan, #00e5ff)',
                      }}>
                        DIAGNOSIS: {alert.verdict}
                      </div>
                    )}

                    {/* Meta */}
                    <div style={{
                      display: 'flex',
                      gap: '1.25rem',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      flexWrap: 'wrap',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} />
                        {new Date(alert.detectedAt).toLocaleString()}
                      </span>
                      <span>
                        SRC: <strong style={{ color: s.color }}>{alert.sourceIp || 'UNKNOWN'}</strong>
                      </span>
                      <span>
                        DST: <strong style={{ color: 'var(--text-mono)' }}>{alert.destinationIp || 'SYSTEM'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.45rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {alert.status === 'NEW' && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="btn btn-outline"
                        style={{ padding: '0.45rem', borderColor: 'rgba(255,184,0,0.3)', color: 'var(--neon-amber, #ffb800)' }}
                        title="Acknowledge"
                      >
                        <Bell size={15} />
                      </button>
                    )}
                    {(alert.status === 'NEW' || alert.status === 'ACKNOWLEDGED') && (
                      <>
                        <button
                          onClick={() => handleResolve(alert.id, 'BLACKLIST')}
                          className="btn btn-danger"
                          disabled={actionLoading === alert.id + 'BLACKLIST'}
                          style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
                        >
                          <Ban size={13} />
                          {actionLoading === alert.id + 'BLACKLIST' ? '...' : 'BLACKLIST'}
                        </button>
                        <button
                          onClick={() => handleResolve(alert.id, 'GENUINE')}
                          className="btn btn-success"
                          disabled={actionLoading === alert.id + 'GENUINE'}
                          style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
                        >
                          <CheckCircle size={13} />
                          {actionLoading === alert.id + 'GENUINE' ? '...' : 'GENUINE'}
                        </button>
                        <button
                          onClick={() => setSelectedAlertForModal(alert)}
                          className="btn btn-outline"
                          style={{
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.78rem',
                            borderColor: 'rgba(0,255,65,0.25)',
                            color: 'var(--neon-green, #00ff41)',
                          }}
                        >
                          <ShieldCheck size={13} /> FORENSIC
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedAlertForModal && (
        <ForensicResolveModal
          alert={selectedAlertForModal}
          onClose={() => setSelectedAlertForModal(null)}
          onResolved={() => setSelectedAlertForModal(null)}
        />
      )}
    </div>
  );
};

export default Alerts;
