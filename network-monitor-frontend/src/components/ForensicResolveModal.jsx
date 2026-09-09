import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { 
  ShieldAlert, Ban, CheckCircle, X, Activity, 
  AlertTriangle, ShieldCheck, Info 
} from 'lucide-react';

const ForensicResolveModal = ({ alert, onClose, onResolved }) => {
  const { resolveAlert } = useAppData();
  const [loading, setLoading] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState(
    `Blacklisted via Alert #${alert?.id} (${alert?.alertType || 'Threat'})`
  );
  const [genuineNotes, setGenuineNotes] = useState('');
  const [activeTab, setActiveTab] = useState('blacklist'); // 'blacklist' or 'genuine'
  const [feedback, setFeedback] = useState(null);

  if (!alert) return null;

  const handleResolve = async (action) => {
    setLoading(true);
    setFeedback(null);
    try {
      const extraPayload = {
        blacklistReason: action === 'BLACKLIST' ? blacklistReason : null,
        notes: action === 'GENUINE' ? genuineNotes : null
      };

      await resolveAlert(alert.id, action, extraPayload);
      
      setFeedback({
        type: 'success',
        message: action === 'BLACKLIST' 
          ? `IP ${alert.sourceIp} successfully added to Blacklist and alert resolved!` 
          : `Alert marked as Genuine / False Positive and resolved.`
      });

      setTimeout(() => {
        if (onResolved) onResolved(alert.id, action);
        onClose();
      }, 900);
    } catch (err) {
      console.error('Failed to resolve alert:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to complete resolution action.'
      });
      setLoading(false);
    }
  };

  const confidence = alert.confidenceScore || 90;
  const isHighThreat = confidence >= 80;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--danger)',
              padding: '0.5rem',
              borderRadius: '8px'
            }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Threat Forensic & Resolution</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Alert #{alert.id} · {alert.alertType}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-outline" 
            style={{ padding: '0.35rem', borderColor: 'transparent', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
          
          {feedback && (
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${feedback.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
              color: feedback.type === 'success' ? 'var(--success)' : 'var(--danger)'
            }}>
              {feedback.message}
            </div>
          )}

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Source IP</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem' }}>{alert.sourceIp || 'Unknown'}</span>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Target Destination</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem' }}>{alert.destinationIp || 'System Gateway'}</span>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Detection Confidence</span>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isHighThreat ? 'var(--danger)' : 'var(--warning)' }}>
                {confidence}% {isHighThreat ? 'Malicious' : 'Anomalous'}
              </span>
            </div>
          </div>

          {/* Forensic Diagnosis Box */}
          <div className="forensic-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <Info size={16} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Heuristic Verdict
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: '0.75rem', fontWeight: 500 }}>
              {alert.verdict || 'Anomalous traffic signature flagged by deep packet heuristics.'}
            </p>
            
            <div className="forensic-item">
              <span style={{ color: 'var(--text-muted)' }}>Pattern Analysis:</span>
              <span style={{ color: 'var(--text-secondary)', textAlign: 'right', maxWidth: '320px' }}>
                {alert.forensicDetails || alert.description}
              </span>
            </div>
            <div className="forensic-item">
              <span style={{ color: 'var(--text-muted)' }}>Packet Handshake:</span>
              <span style={{ color: alert.alertType === 'PORT_SCAN' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                {alert.alertType === 'PORT_SCAN' ? '100% SYN Probes (Zero Handshake/ACK)' : 'High Request Rate'}
              </span>
            </div>
            <div className="forensic-item">
              <span style={{ color: 'var(--text-muted)' }}>Payload Volume:</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                0 Bytes Application Data (Header Reconnaissance)
              </span>
            </div>
          </div>

          {/* Tab Selector for Resolution Action */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <button
              onClick={() => setActiveTab('blacklist')}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderRadius: '8px',
                border: activeTab === 'blacklist' ? '1px solid var(--danger)' : '1px solid transparent',
                background: activeTab === 'blacklist' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: activeTab === 'blacklist' ? 'var(--danger)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              <Ban size={16} /> Remediate & Blacklist
            </button>
            <button
              onClick={() => setActiveTab('genuine')}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderRadius: '8px',
                border: activeTab === 'genuine' ? '1px solid var(--success)' : '1px solid transparent',
                background: activeTab === 'genuine' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: activeTab === 'genuine' ? 'var(--success)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              <ShieldCheck size={16} /> Mark Genuine / False Positive
            </button>
          </div>

          {/* Tab 1: Blacklist & Resolve */}
          {activeTab === 'blacklist' && (
            <div className="animate-fade-in">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Confirm this activity is malicious. The IP <strong>{alert.sourceIp}</strong> will be immediately added to the Blacklist table and all future packets will be blocked and flagged as <span style={{ color: 'var(--danger)' }}>CRITICAL</span>.
              </p>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Blacklist Reason</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={blacklistReason} 
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
              <button 
                onClick={() => handleResolve('BLACKLIST')} 
                className="btn"
                disabled={loading}
                style={{ 
                  width: '100%', 
                  background: 'var(--danger)', 
                  color: '#fff',
                  padding: '0.75rem'
                }}
              >
                {loading ? <Activity size={18} className="animate-spin" /> : <><Ban size={18} /> Confirm Malicious & Blacklist IP</>}
              </button>
            </div>
          )}

          {/* Tab 2: Mark Genuine */}
          {activeTab === 'genuine' && (
            <div className="animate-fade-in">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Mark this alert as a legitimate request, developer test, or benign burst. The alert will be marked <span style={{ color: 'var(--success)' }}>RESOLVED</span> without punishing or blacklisting the IP address.
              </p>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Justification / Notes (Optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Authorized security audit, load test, or internal dev"
                  value={genuineNotes} 
                  onChange={(e) => setGenuineNotes(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
              <button 
                onClick={() => handleResolve('GENUINE')} 
                className="btn"
                disabled={loading}
                style={{ 
                  width: '100%', 
                  background: 'var(--success)', 
                  color: '#fff',
                  padding: '0.75rem'
                }}
              >
                {loading ? <Activity size={18} className="animate-spin" /> : <><CheckCircle size={18} /> Dismiss as Genuine / False Positive</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForensicResolveModal;
