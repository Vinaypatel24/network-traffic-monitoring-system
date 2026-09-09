import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';
import webSocketService from '../services/WebSocketService';
import api from '../services/api';
import { 
  Activity, ShieldAlert, Zap, Box, HardDrive, 
  Play, Square, Radio, Wifi, Sparkles, RefreshCw
} from 'lucide-react';
import ForensicResolveModal from '../components/ForensicResolveModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const StatCard = ({ title, value, icon, color }) => (
  <div className="glass-panel interactive" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
        {title}
      </p>
      <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</h3>
    </div>
    <div style={{ background: `rgba(${color}, 0.15)`, color: `rgb(${color})`, padding: '1rem', borderRadius: '12px' }}>
      {icon}
    </div>
  </div>
);

const Dashboard = () => {
  const { isDark } = useTheme();
  const { token } = useAuth();
  const { alerts, resolveAlert } = useAppData();  // shared state
  const [statsHistory, setStatsHistory] = useState([]);
  const [currentStats, setCurrentStats] = useState({ totalPackets: 0, totalBytes: 0, rate: 0 });
  
  // Connection and Session States
  const [wsConnected, setWsConnected] = useState(false);
  const [interfaces, setInterfaces] = useState([]);
  const [selectedInterface, setSelectedInterface] = useState('');
  // Load persisted interface selection from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedInterface');
    if (saved) setSelectedInterface(saved);
  }, []);
  // Persist selection changes
  useEffect(() => {
    if (selectedInterface) localStorage.setItem('selectedInterface', selectedInterface);
  }, [selectedInterface]);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [selectedAlertForModal, setSelectedAlertForModal] = useState(null);

  // ─── Fetch Initial Data (stats, interfaces, session only — alerts from context) ──
  const fetchInitialData = useCallback(async () => {
    try {
      // 1. Fetch System Summary Overview
      const summaryRes = await api.get('/statistics/summary').catch(() => null);
      if (summaryRes?.data?.data) {
        const s = summaryRes.data.data;
        setCurrentStats(prev => ({
          ...prev,
          totalPackets: s.totalPackets || 0,
          totalBytes: s.totalBytes || 0
        }));
      }

      // 2. Fetch Network Interfaces
      const ifaceRes = await api.get('/interfaces').catch(() => null);
      if (ifaceRes?.data?.data && ifaceRes.data.data.length > 0) {
        setInterfaces(ifaceRes.data.data);
        // Default to demo interface if available or the first active one
        const demo = ifaceRes.data.data.find(i => i.name?.includes('demo'));
        setSelectedInterface(demo ? demo.id : ifaceRes.data.data[0].id);
      }

      // 3. Fetch Active Capture Session
      const sessionRes = await api.get('/capture/status').catch(() => null);
      if (sessionRes?.data?.data) {
        setActiveSession(sessionRes.data.data);
      } else {
        setActiveSession(null);
      }

    } catch (err) {
      console.warn('Error loading initial dashboard data:', err);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // ─── WebSocket Subscriptions (stats + status only — alerts handled by context) ─
  useEffect(() => {
    if (token) {
      webSocketService.onStatusChange((status) => {
        setWsConnected(status);
      });

      webSocketService.connect(token);

      webSocketService.onStats((statsList) => {
        if (!Array.isArray(statsList)) return;

        let tickPackets = 0;
        let tickBytes = 0;

        statsList.forEach(s => {
          tickPackets += (s.packetCount || 0);
          tickBytes += (s.byteCount || 0);
        });

        setCurrentStats(prev => ({
          totalPackets: prev.totalPackets + tickPackets,
          totalBytes: prev.totalBytes + tickBytes,
          rate: tickPackets
        }));

        setStatsHistory(prev => {
          const newHistory = [...prev, { time: new Date().toLocaleTimeString(), packets: tickPackets }];
          if (newHistory.length > 20) newHistory.shift();
          return newHistory;
        });
      });
    }

    return () => {
      webSocketService.onStats(null);
      webSocketService.onStatusChange(null);
    };
  }, [token]);

  // ─── Capture Controls ──────────────────────────────────────────────────────
  const handleStartCapture = async (ifaceId) => {
    const targetId = ifaceId || selectedInterface;
    if (!targetId) return;

    setSessionLoading(true);
    try {
      const res = await api.post('/capture/start', { interfaceId: Number(targetId) });
      if (res.data?.data) {
        setActiveSession(res.data.data);
      }
    } catch (err) {
      console.error('Failed to start capture:', err);
      alert(err.response?.data?.message || 'Failed to start capture session');
    } finally {
      setSessionLoading(false);
    }
  };

  const handleStopCapture = async () => {
    if (!activeSession) return;

    setSessionLoading(true);
    try {
      await api.post(`/capture/stop/${activeSession.id}`);
      setActiveSession(null);
    } catch (err) {
      console.error('Failed to stop capture:', err);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleStartDemo = () => {
    const demo = interfaces.find(i => i.name?.includes('demo'));
    if (demo) {
      handleStartCapture(demo.id);
    } else if (interfaces.length > 0) {
      handleStartCapture(interfaces[0].id);
    }
  };

  // Quick resolve from the dashboard threat feed — delegates to shared context
  const quickResolve = async (alertId, action) => {
    try {
      await resolveAlert(alertId, action);
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  // ─── Chart Config ─────────────────────────────────────────────────────────
  const chartColor = isDark ? '#6366f1' : '#4f46e5';
  const chartBg = isDark ? 'rgba(99, 102, 241, 0.16)' : 'rgba(79, 70, 229, 0.12)';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#191c27' : '#ffffff';
  const tooltipBorder = isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(79, 70, 229, 0.25)';

  const chartData = {
    labels: statsHistory.length > 0 
      ? statsHistory.map(s => s.time) 
      : Array(10).fill(''),
    datasets: [
      {
        label: 'Packets / sec',
        data: statsHistory.length > 0 
          ? statsHistory.map(s => s.packets) 
          : Array(10).fill(0),
        borderColor: chartColor,
        backgroundColor: chartBg,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: chartColor,
        pointHoverRadius: 6,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 350 },
    scales: {
      y: { 
        grid: { color: gridColor }, 
        ticks: { color: tickColor, precision: 0 }, 
        beginAtZero: true 
      },
      x: { 
        grid: { display: false }, 
        ticks: { color: tickColor, maxTicksLimit: 8 } 
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#f8fafc' : '#0f172a',
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
      }
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="animate-fade-in">
      {/* ─── Control Bar & Status Banner ─────────────────────────────────── */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Live WebSocket Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <span style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: wsConnected ? '#10b981' : '#f59e0b',
              boxShadow: wsConnected ? '0 0 8px #10b981' : 'none'
            }} />
            <span style={{ color: wsConnected ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 500 }}>
              {wsConnected ? 'Live Stream Active' : 'Connecting to Stream...'}
            </span>
          </div>

          {/* Active Capture Status Badge */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.3rem 0.75rem', 
            borderRadius: '20px', 
            fontSize: '0.8rem',
            background: activeSession ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.1)',
            border: `1px solid ${activeSession ? '#10b981' : 'var(--border-color)'}`,
            color: activeSession ? '#10b981' : 'var(--text-muted)'
          }}>
            <Radio size={14} className={activeSession ? 'animate-pulse' : ''} />
            {activeSession 
              ? `Capture Running (${activeSession.interfaceName || 'Session #' + activeSession.id})`
              : 'Capture Inactive'}
          </div>
        </div>

        {/* Capture Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {!activeSession ? (
            <>
              {interfaces.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wifi size={16} color="var(--text-secondary)" />
                  <select 
                    className="form-input" 
                    value={selectedInterface} 
                    onChange={(e) => setSelectedInterface(e.target.value)}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto', minWidth: '180px' }}
                  >
                    {interfaces.map(iface => (
                      <option key={iface.id} value={iface.id}>
                        {iface.description || iface.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button 
                onClick={() => handleStartCapture()} 
                disabled={sessionLoading || !selectedInterface}
                className="btn btn-primary"
                style={{ padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <Play size={15} /> Start Capture
              </button>

              <button 
                onClick={handleStartDemo} 
                disabled={sessionLoading}
                className="btn btn-outline"
                style={{ padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', borderColor: 'var(--accent-secondary)', color: 'var(--accent-secondary)' }}
                title="Generates simulated packets and threats for instant demonstration"
              >
                <Sparkles size={15} /> Demo Traffic
              </button>
            </>
          ) : (
            <button 
              onClick={handleStopCapture} 
              disabled={sessionLoading}
              className="btn btn-outline"
              style={{ padding: '0.45rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
            >
              <Square size={15} /> Stop Capture
            </button>
          )}

          <button 
            onClick={fetchInitialData} 
            className="btn btn-outline" 
            style={{ padding: '0.45rem 0.6rem' }}
            title="Refresh overview metrics"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ─── Metric Cards ─────────────────────────────────────────────────── */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <StatCard title="Packet Rate" value={`${currentStats.rate}/s`} icon={<Activity size={24} />} color="0, 240, 255" />
        <StatCard title="Total Packets" value={currentStats.totalPackets.toLocaleString()} icon={<Box size={24} />} color="16, 185, 129" />
        <StatCard title="Data Volume" value={formatBytes(currentStats.totalBytes)} icon={<HardDrive size={24} />} color="245, 158, 11" />
        <StatCard title="Active Threats" value={alerts.filter(a => a.status !== 'RESOLVED').length} icon={<ShieldAlert size={24} />} color="255, 0, 60" />
      </div>

      {/* ─── Traffic Graph & Threat Feed ──────────────────────────────────── */}
      <div className="grid-cols-3">
        <div className="glass-panel" style={{ gridColumn: 'span 2', height: '420px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Real-Time Traffic (DPI Stream)</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Updates every second via WebSocket
            </span>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="glass-panel" style={{ height: '420px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={20} color="var(--accent-secondary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Live Threat Feed</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {alerts.length} events
            </span>
          </div>
          
          {alerts.length === 0 ? (
            <div className="flex-center" style={{ height: '75%', color: 'var(--text-muted)', flexDirection: 'column', gap: '0.5rem' }}>
              <ShieldAlert size={36} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '0.9rem' }}>No recent threats detected</p>
              <span style={{ fontSize: '0.75rem' }}>Start capture to inspect packets</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {alerts.map((alert) => (
                <div key={alert.id || alert.detectedAt + '-' + alert.alertType} style={{ 
                  padding: '0.85rem 1rem', 
                  background: 'var(--bg-secondary)', 
                  borderLeft: `3px solid var(--${alert.severity?.toLowerCase() === 'critical' ? 'danger' : 'warning'})`,
                  borderRadius: '0 8px 8px 0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{alert.alertType}</span>
                      {alert.status === 'RESOLVED' && (
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', fontSize: '0.65rem' }}>
                          Resolved
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {alert.detectedAt ? new Date(alert.detectedAt).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                    <strong style={{ fontFamily: 'monospace' }}>{alert.sourceIp}</strong> → <span style={{ fontFamily: 'monospace' }}>{alert.destinationIp || 'System'}</span>
                  </p>
                  {alert.description && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      {alert.description}
                    </p>
                  )}
                  {alert.status !== 'RESOLVED' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.5rem' }}>
                      <button
                        onClick={() => quickResolve(alert.id, 'BLACKLIST')}
                        className="btn btn-danger"
                        style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        title="Blacklist IP"
                      >
                        Blacklist
                      </button>
                      <button
                        onClick={() => quickResolve(alert.id, 'GENUINE')}
                        className="btn btn-success"
                        style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        title="Mark as genuine"
                      >
                        Genuine
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Forensic Resolution Modal on Dashboard */}
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

export default Dashboard;
