import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { ShieldAlert, CheckCircle, Clock, Bell, Ban, ShieldCheck } from 'lucide-react';
import ForensicResolveModal from '../components/ForensicResolveModal';

const Alerts = () => {
  const { alerts, alertsLoading, fetchAlerts, resolveAlert, acknowledgeAlert } = useAppData();
  const [selectedAlertForModal, setSelectedAlertForModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // alertId being actioned

  const handleResolve = async (alertId, action) => {
    setActionLoading(alertId + action);
    try {
      await resolveAlert(alertId, action);
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId);
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'var(--danger)';
      case 'high': return 'var(--warning)';
      case 'medium': return 'var(--accent-primary)';
      default: return 'var(--success)';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Security Alerts</h2>
        <button onClick={fetchAlerts} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
          Refresh
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {alertsLoading ? (
          <div className="flex-center" style={{ padding: '3rem' }}>Loading...</div>
        ) : alerts.length === 0 ? (
          <div className="glass-panel flex-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
            <ShieldAlert size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>No alerts recorded</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className="glass-panel" style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderLeft: `4px solid ${getSeverityColor(alert.severity)}`
            }}>
              <div style={{ flex: 1, marginRight: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {alert.alertType}
                  </h3>
                  <span className="badge" style={{
                    background: `${getSeverityColor(alert.severity)}33`,
                    color: getSeverityColor(alert.severity)
                  }}>
                    {alert.severity}
                  </span>
                  <span className="badge" style={{
                    background: alert.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                    color: alert.status === 'RESOLVED' ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {alert.status}
                  </span>
                  {alert.confidenceScore && (
                    <span className="badge" style={{ background: 'rgba(0, 240, 255, 0.12)', color: 'var(--accent-primary)', fontSize: '0.7rem' }}>
                      {alert.confidenceScore}% Confidence
                    </span>
                  )}
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                  {alert.description}
                </p>

                {alert.verdict && (
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'var(--accent-primary)',
                    marginBottom: '0.4rem',
                    background: 'rgba(0, 240, 255, 0.05)',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '6px',
                    display: 'inline-block'
                  }}>
                    <strong>Diagnosis:</strong> {alert.verdict}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={14} /> Detected: {new Date(alert.detectedAt).toLocaleString()}
                  </span>
                  <span>Source: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{alert.sourceIp || 'Unknown'}</strong></span>
                  <span>Target: <strong style={{ fontFamily: 'monospace' }}>{alert.destinationIp || 'System'}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                {alert.status === 'NEW' && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="btn btn-outline"
                    style={{ color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                    title="Acknowledge"
                  >
                    <Bell size={18} />
                  </button>
                )}
                {(alert.status === 'NEW' || alert.status === 'ACKNOWLEDGED') && (
                  <>
                    <button
                      onClick={() => handleResolve(alert.id, 'BLACKLIST')}
                      className="btn btn-danger"
                      disabled={actionLoading === alert.id + 'BLACKLIST'}
                      style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      title="Blacklist IP and resolve"
                    >
                      <Ban size={16} />
                      {actionLoading === alert.id + 'BLACKLIST' ? '...' : 'Blacklist'}
                    </button>
                    <button
                      onClick={() => handleResolve(alert.id, 'GENUINE')}
                      className="btn btn-success"
                      disabled={actionLoading === alert.id + 'GENUINE'}
                      style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      title="Mark as genuine / false positive"
                    >
                      <CheckCircle size={16} />
                      {actionLoading === alert.id + 'GENUINE' ? '...' : 'Genuine'}
                    </button>
                    <button
                      onClick={() => setSelectedAlertForModal(alert)}
                      className="btn btn-outline"
                      style={{ padding: '0.5rem 0.7rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)', borderColor: 'var(--border-color)' }}
                      title="Full forensic analysis"
                    >
                      <ShieldCheck size={16} /> Analyze
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Forensic Resolution Modal */}
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
