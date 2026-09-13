import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';
import webSocketService from '../services/WebSocketService';
import api from '../services/api';
import {
  Activity, ShieldAlert, Zap, Box, HardDrive,
  Play, Square, Radio, Wifi, Sparkles, RefreshCw, Terminal
} from 'lucide-react';
import ForensicResolveModal from '../components/ForensicResolveModal';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
const CARD_ACCENTS = {
  cyan:  { color: 'var(--neon-cyan,  #00e5ff)', glow: 'rgba(0,229,255,0.2)',  class: 'stat-accent-cyan'  },
  green: { color: 'var(--neon-green, #00ff41)', glow: 'rgba(0,255,65,0.2)',   class: 'stat-accent-green' },
  amber: { color: 'var(--neon-amber, #ffb800)', glow: 'rgba(255,184,0,0.2)',  class: 'stat-accent-amber' },
  red:   { color: 'var(--neon-red,   #ff2244)', glow: 'rgba(255,34,68,0.2)',  class: 'stat-accent-red'   },
};

const StatCard = ({ title, value, icon, accent, index = 0 }) => {
  const a = CARD_ACCENTS[accent] || CARD_ACCENTS.cyan;
  return (
    <div
      className={`glass-panel interactive animate-fade-in stagger-${index + 1} ${a.class}`}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <div>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '0.6rem',
        }}>
          {title}
        </p>
        <h3 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '2rem',
          fontWeight: 700,
          color: a.color,
          textShadow: `0 0 16px ${a.glow}`,
          lineHeight: 1,
          letterSpacing: '-0.03em',
        }}>
          {value}
        </h3>
      </div>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '8px',
        background: `rgba(${a.color === CARD_ACCENTS.cyan.color ? '0,229,255' : a.color === CARD_ACCENTS.green.color ? '0,255,65' : a.color === CARD_ACCENTS.amber.color ? '255,184,0' : '255,34,68'}, 0.08)`,
        border: `1px solid ${a.glow.replace('0.2', '0.3')}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: a.color,
        flexShrink: 0,
        boxShadow: `0 0 16px ${a.glow}`,
      }}>
        {icon}
      </div>
    </div>
  );
};

/* ─── Dashboard ──────────────────────────────────────────────────────────── */
const Dashboard = () => {
  const { isDark } = useTheme();
  const { token } = useAuth();
  const { alerts, resolveAlert } = useAppData();
  const [statsHistory, setStatsHistory] = useState([]);
  const [currentStats, setCurrentStats] = useState({ totalPackets: 0, totalBytes: 0, rate: 0 });

  const [wsConnected, setWsConnected] = useState(false);
  const [interfaces, setInterfaces] = useState([]);
  const [selectedInterface, setSelectedInterface] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [selectedAlertForModal, setSelectedAlertForModal] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('selectedInterface');
    if (saved) setSelectedInterface(saved);
  }, []);

  useEffect(() => {
    if (selectedInterface) localStorage.setItem('selectedInterface', selectedInterface);
  }, [selectedInterface]);

  const fetchInitialData = useCallback(async () => {
    try {
      const summaryRes = await api.get('/statistics/summary').catch(() => null);
      if (summaryRes?.data?.data) {
        const s = summaryRes.data.data;
        setCurrentStats(prev => ({
          ...prev,
          totalPackets: s.totalPackets || 0,
          totalBytes: s.totalBytes || 0,
        }));
      }
      const ifaceRes = await api.get('/interfaces').catch(() => null);
      if (ifaceRes?.data?.data?.length > 0) {
        setInterfaces(ifaceRes.data.data);
        const demo = ifaceRes.data.data.find(i => i.name?.includes('demo'));
        setSelectedInterface(demo ? demo.id : ifaceRes.data.data[0].id);
      }
      const sessionRes = await api.get('/capture/status').catch(() => null);
      setActiveSession(sessionRes?.data?.data || null);
    } catch (err) {
      console.warn('Error loading initial dashboard data:', err);
    }
  }, []);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  useEffect(() => {
    if (token) {
      webSocketService.onStatusChange(setWsConnected);
      webSocketService.connect(token);
      webSocketService.onStats((statsList) => {
        if (!Array.isArray(statsList)) return;
        let tp = 0, tb = 0;
        statsList.forEach(s => { tp += (s.packetCount || 0); tb += (s.byteCount || 0); });
        setCurrentStats(prev => ({ totalPackets: prev.totalPackets + tp, totalBytes: prev.totalBytes + tb, rate: tp }));
        setStatsHistory(prev => {
          const next = [...prev, { time: new Date().toLocaleTimeString(), packets: tp }];
          if (next.length > 20) next.shift();
          return next;
        });
      });
    }
    return () => { webSocketService.onStats(null); webSocketService.onStatusChange(null); };
  }, [token]);

  const handleStartCapture = async (ifaceId) => {
    const id = ifaceId || selectedInterface;
    if (!id) return;
    setSessionLoading(true);
    try {
      const res = await api.post('/capture/start', { interfaceId: Number(id) });
      if (res.data?.data) setActiveSession(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start capture');
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
    } catch { /* ignore */ } finally {
      setSessionLoading(false);
    }
  };

  const handleStartDemo = () => {
    const demo = interfaces.find(i => i.name?.includes('demo'));
    handleStartCapture(demo ? demo.id : interfaces[0]?.id);
  };

  const quickResolve = async (alertId, action) => {
    try { await resolveAlert(alertId, action); } catch { /* ignore */ }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /* ── Chart ── */
  const chartColor   = 'rgba(0, 255, 65, 0.9)';
  const chartFill    = 'rgba(0, 255, 65, 0.06)';
  const gridColor    = 'rgba(0, 255, 65, 0.06)';
  const tickColor    = isDark ? '#2a6640' : '#7aa888';
  const tooltipBg    = isDark ? '#060e16' : '#ffffff';
  const tooltipBorder = 'rgba(0, 255, 65, 0.3)';

  const chartData = {
    labels: statsHistory.length > 0 ? statsHistory.map(s => s.time) : Array(10).fill(''),
    datasets: [{
      label: 'Packets / sec',
      data: statsHistory.length > 0 ? statsHistory.map(s => s.packets) : Array(10).fill(0),
      borderColor: chartColor,
      borderWidth: 2,
      backgroundColor: chartFill,
      fill: true,
      tension: 0.4,
      pointRadius: 2,
      pointBackgroundColor: chartColor,
      pointHoverRadius: 5,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    scales: {
      y: {
        grid: { color: gridColor },
        ticks: { color: tickColor, font: { family: "'JetBrains Mono', monospace", size: 10 }, precision: 0 },
        beginAtZero: true,
      },
      x: {
        grid: { display: false },
        ticks: { color: tickColor, font: { family: "'JetBrains Mono', monospace", size: 9 }, maxTicksLimit: 8 },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: '#00ff41',
        bodyColor: isDark ? '#7aff9a' : '#2d5a3d',
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 10,
        titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
      },
    },
  };

  const unresolvedCount = alerts.filter(a => a.status !== 'RESOLVED').length;

  return (
    <div className="animate-fade-in">

      {/* ── Control Bar ── */}
      <div className="glass-panel" style={{
        marginBottom: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.875rem 1.25rem',
      }}>
        {/* Status indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* WS connection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`live-dot ${wsConnected ? '' : 'amber'}`} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.72rem',
              color: wsConnected ? 'var(--neon-green, #00ff41)' : 'var(--neon-amber, #ffb800)',
              letterSpacing: '0.05em',
            }}>
              {wsConnected ? 'WS_CONNECTED' : 'WS_CONNECTING'}
            </span>
          </div>

          {/* Session badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.25rem 0.65rem',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.06em',
            background: activeSession ? 'rgba(0,255,65,0.07)' : 'rgba(0,255,65,0.03)',
            border: `1px solid ${activeSession ? 'rgba(0,255,65,0.25)' : 'var(--border-color)'}`,
            color: activeSession ? 'var(--neon-green, #00ff41)' : 'var(--text-muted)',
          }}>
            <Radio size={11} className={activeSession ? 'animate-pulse' : ''} />
            {activeSession
              ? `CAPTURE // ${activeSession.interfaceName || 'SESSION_' + activeSession.id}`
              : 'CAPTURE_INACTIVE'}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {!activeSession ? (
            <>
              {interfaces.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Wifi size={14} color="var(--text-muted)" />
                  <select
                    className="form-input"
                    value={selectedInterface}
                    onChange={(e) => setSelectedInterface(e.target.value)}
                    style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem', width: 'auto', minWidth: '160px' }}
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
                id="btn-start-capture"
                onClick={() => handleStartCapture()}
                disabled={sessionLoading || !selectedInterface}
                className="btn btn-primary"
                style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}
              >
                <Play size={13} /> Start
              </button>
              <button
                id="btn-demo-traffic"
                onClick={handleStartDemo}
                disabled={sessionLoading}
                className="btn btn-outline"
                style={{
                  padding: '0.4rem 0.875rem',
                  fontSize: '0.8rem',
                  borderColor: 'rgba(0,229,255,0.3)',
                  color: 'var(--neon-cyan, #00e5ff)',
                }}
                title="Simulated traffic for demo"
              >
                <Sparkles size={13} /> Demo
              </button>
            </>
          ) : (
            <button
              id="btn-stop-capture"
              onClick={handleStopCapture}
              disabled={sessionLoading}
              className="btn btn-danger"
              style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}
            >
              <Square size={13} /> Stop
            </button>
          )}
          <button
            id="btn-refresh-data"
            onClick={fetchInitialData}
            className="btn btn-outline"
            style={{ padding: '0.4rem 0.6rem' }}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid-cols-4" style={{ marginBottom: '1.25rem' }}>
        <StatCard
          title="Packet Rate"
          value={`${currentStats.rate}/s`}
          icon={<Activity size={22} />}
          accent="cyan"
          index={0}
        />
        <StatCard
          title="Total Packets"
          value={currentStats.totalPackets.toLocaleString()}
          icon={<Box size={22} />}
          accent="green"
          index={1}
        />
        <StatCard
          title="Data Volume"
          value={formatBytes(currentStats.totalBytes)}
          icon={<HardDrive size={22} />}
          accent="amber"
          index={2}
        />
        <StatCard
          title="Active Threats"
          value={unresolvedCount}
          icon={<ShieldAlert size={22} />}
          accent="red"
          index={3}
        />
      </div>

      {/* ── Chart + Threat Feed ── */}
      <div className="grid-cols-3">
        {/* Traffic Chart */}
        <div className="glass-panel" style={{ gridColumn: 'span 2', height: '420px', display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Terminal size={16} color="var(--neon-green, #00ff41)" />
              <span className="section-title">
                Real-Time DPI Stream
                <span className="title-tag">packets/sec</span>
              </span>
            </div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
            }}>
              ↻ 1s INTERVAL
            </span>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Live Threat Feed */}
        <div className="glass-panel" style={{ height: '420px', display: 'flex', flexDirection: 'column', padding: 0 }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={15} color="var(--neon-red, #ff2244)" />
              <span className="section-title">
                Threat Feed
              </span>
            </div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
              padding: '0.15rem 0.45rem',
              border: '1px solid var(--border-color)',
              borderRadius: '3px',
            }}>
              {alerts.length} events
            </span>
          </div>

          {/* Feed items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {alerts.length === 0 ? (
              <div className="flex-center" style={{
                height: '80%', flexDirection: 'column', gap: '0.5rem',
                color: 'var(--text-muted)',
              }}>
                <ShieldAlert size={32} style={{ opacity: 0.2 }} />
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.06em' }}>
                  NO_THREATS_DETECTED
                </p>
                <p style={{ fontSize: '0.72rem' }}>Start capture to monitor</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {alerts.map((alert) => {
                  const isCrit = alert.severity?.toLowerCase() === 'critical';
                  const borderColor = isCrit
                    ? 'var(--neon-red, #ff2244)'
                    : 'var(--neon-amber, #ffb800)';
                  const glowColor = isCrit
                    ? 'rgba(255,34,68,0.15)'
                    : 'rgba(255,184,0,0.12)';
                  return (
                    <div
                      key={alert.id || alert.detectedAt + '-' + alert.alertType}
                      style={{
                        padding: '0.75rem',
                        background: 'var(--bg-tertiary)',
                        borderLeft: `2px solid ${borderColor}`,
                        borderRadius: '0 6px 6px 0',
                        boxShadow: `-3px 0 10px ${glowColor}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            fontFamily: "'Space Grotesk', sans-serif",
                            color: 'var(--text-primary)',
                          }}>
                            {alert.alertType}
                          </span>
                          {alert.status === 'RESOLVED' && (
                            <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>
                              RESOLVED
                            </span>
                          )}
                        </div>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '0.62rem',
                          color: 'var(--text-muted)',
                        }}>
                          {alert.detectedAt ? new Date(alert.detectedAt).toLocaleTimeString() : 'just now'}
                        </span>
                      </div>
                      <p style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.72rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.25rem',
                      }}>
                        <span style={{ color: borderColor }}>{alert.sourceIp}</span>
                        {' → '}
                        <span style={{ color: 'var(--text-mono)' }}>{alert.destinationIp || 'SYSTEM'}</span>
                      </p>
                      {alert.status !== 'RESOLVED' && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem', marginTop: '0.45rem' }}>
                          <button
                            onClick={() => quickResolve(alert.id, 'BLACKLIST')}
                            className="btn btn-danger"
                            style={{ padding: '0.18rem 0.5rem', fontSize: '0.65rem' }}
                          >
                            BLACKLIST
                          </button>
                          <button
                            onClick={() => quickResolve(alert.id, 'GENUINE')}
                            className="btn btn-success"
                            style={{ padding: '0.18rem 0.5rem', fontSize: '0.65rem' }}
                          >
                            GENUINE
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
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

export default Dashboard;
