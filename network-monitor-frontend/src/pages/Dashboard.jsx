import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import webSocketService from '../services/WebSocketService';
import { Activity, ShieldAlert, Zap, Box, HardDrive } from 'lucide-react';
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
  const { token } = useAuth();
  const [statsHistory, setStatsHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [currentStats, setCurrentStats] = useState({ totalPackets: 0, totalBytes: 0, rate: 0 });

  useEffect(() => {
    if (token) {
      webSocketService.connect(token);

      webSocketService.onStats((statsList) => {
        // Aggregate stats for the current tick
        let tickPackets = 0;
        let tickBytes = 0;
        statsList.forEach(s => {
          tickPackets += s.packetCount;
          tickBytes += s.byteCount;
        });

        setCurrentStats(prev => ({
          totalPackets: prev.totalPackets + tickPackets,
          totalBytes: prev.totalBytes + tickBytes,
          rate: tickPackets
        }));

        setStatsHistory(prev => {
          const newHistory = [...prev, { time: new Date().toLocaleTimeString(), packets: tickPackets }];
          if (newHistory.length > 20) newHistory.shift(); // Keep last 20 ticks
          return newHistory;
        });
      });

      webSocketService.onAlert((alert) => {
        setAlerts(prev => [alert, ...prev].slice(0, 10)); // Keep last 10
      });
    }

    return () => {
      webSocketService.disconnect();
    };
  }, [token]);

  const chartData = {
    labels: statsHistory.map(s => s.time),
    datasets: [
      {
        label: 'Packets / sec',
        data: statsHistory.map(s => s.packets),
        borderColor: '#00f0ff',
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' }, beginAtZero: true },
      x: { grid: { display: false }, ticks: { color: '#94a3b8', maxTicksLimit: 8 } }
    },
    plugins: {
      legend: { display: false }
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="animate-fade-in">
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <StatCard title="Packet Rate" value={`${currentStats.rate}/s`} icon={<Activity size={24} />} color="0, 240, 255" />
        <StatCard title="Total Packets" value={currentStats.totalPackets.toLocaleString()} icon={<Box size={24} />} color="16, 185, 129" />
        <StatCard title="Data Volume" value={formatBytes(currentStats.totalBytes)} icon={<HardDrive size={24} />} color="245, 158, 11" />
        <StatCard title="Active Threats" value={alerts.length} icon={<ShieldAlert size={24} />} color="255, 0, 60" />
      </div>

      <div className="grid-cols-3">
        <div className="glass-panel" style={{ gridColumn: 'span 2', height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Real-Time Traffic</h3>
          <div style={{ flex: 1, position: 'relative' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="glass-panel" style={{ height: '400px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Zap size={20} color="var(--accent-secondary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Live Threat Feed</h3>
          </div>
          
          {alerts.length === 0 ? (
            <div className="flex-center" style={{ height: '80%', color: 'var(--text-muted)' }}>
              No recent threats detected
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {alerts.map((alert, i) => (
                <div key={i} style={{ 
                  padding: '1rem', 
                  background: 'var(--bg-secondary)', 
                  borderLeft: `3px solid var(--${alert.severity.toLowerCase() === 'critical' ? 'danger' : 'warning'})`,
                  borderRadius: '0 8px 8px 0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{alert.alertType}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(alert.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {alert.sourceIp} → {alert.destinationIp || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
