import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { ShieldAlert, CheckCircle, Clock, Bell } from 'lucide-react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/alerts');
      setAlerts(response.data.content);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const resolveAlert = async (id) => {
    try {
      await api.post(`/alerts/${id}/resolve`);
      fetchAlerts();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const acknowledgeAlert = async (id) => {
    try {
      await api.post(`/alerts/${id}/acknowledge`);
      fetchAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
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
        {loading ? (
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
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {alert.alertType}
                  </h3>
                  <span className={`badge`} style={{ 
                    background: `${getSeverityColor(alert.severity)}33`, 
                    color: getSeverityColor(alert.severity) 
                  }}>
                    {alert.severity}
                  </span>
                  <span className={`badge`} style={{ 
                    background: alert.status === 'RESOLVED' ? 'var(--bg-glass-hover)' : 'rgba(239, 68, 68, 0.1)', 
                    color: alert.status === 'RESOLVED' ? 'var(--text-secondary)' : 'var(--danger)' 
                  }}>
                    {alert.status}
                  </span>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  {alert.description}
                </p>
                
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={14} /> Detected: {new Date(alert.detectedAt).toLocaleString()}
                  </span>
                  <span>Target: <strong>{alert.destinationIp || 'System'}</strong></span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {alert.status === 'NEW' && (
                  <button 
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="btn btn-outline" 
                    style={{ color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                    title="Acknowledge"
                  >
                    <Bell size={18} />
                  </button>
                )}
                {(alert.status === 'NEW' || alert.status === 'ACKNOWLEDGED') && (
                  <button 
                    onClick={() => resolveAlert(alert.id)}
                    className="btn btn-outline" 
                    style={{ color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                    title="Resolve"
                  >
                    <CheckCircle size={18} /> Resolve
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;
