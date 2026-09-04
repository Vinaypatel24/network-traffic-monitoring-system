import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const Packets = () => {
  const [packets, setPackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filters
  const [protocol, setProtocol] = useState('');
  const [srcIp, setSrcIp] = useState('');

  const fetchPackets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, size: 15 });
      if (protocol) params.append('protocol', protocol);
      if (srcIp) params.append('srcIp', srcIp);

      const response = await api.get(`/packets?${params.toString()}`);
      const list = response.data?.data || response.data?.content || [];
      setPackets(list);
      setTotalPages(response.data?.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch packets:', error);
    } finally {
      setLoading(false);
    }
  }, [page, protocol, srcIp]);

  useEffect(() => {
    fetchPackets();
  }, [fetchPackets]);

  const handleFilter = (e) => {
    e.preventDefault();
    // Just reset page; useEffect re-fetches automatically via fetchPackets dependency
    setPage(0);
  };

  return (
    <div className="animate-fade-in">
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleFilter} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Protocol</label>
            <select 
              className="form-input" 
              value={protocol} 
              onChange={(e) => setProtocol(e.target.value)}
              style={{ padding: '0.65rem 1rem' }}
            >
              <option value="">All</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <label className="form-label">Source IP</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. 192.168.1.10"
              value={srcIp}
              onChange={(e) => setSrcIp(e.target.value)}
              style={{ padding: '0.65rem 1rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
            <Search size={18} /> Search
          </button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Time</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Protocol</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Source</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Destination</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Size</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Flags</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : packets.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>No packets found</td></tr>
            ) : (
              packets.map(packet => (
                <tr key={packet.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{new Date(packet.capturedAt).toLocaleString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${packet.protocol === 'TCP' ? 'badge-info' : packet.protocol === 'UDP' ? 'badge-warning' : 'badge-danger'}`}>
                      {packet.protocol}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{packet.srcIp}:{packet.srcPort || '*'}</td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{packet.dstIp}:{packet.dstPort || '*'}</td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{packet.packetSize} B</td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{packet.tcpFlags || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex-between" style={{ padding: '1rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Page {page + 1} of {Math.max(1, totalPages)}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-outline" 
              style={{ padding: '0.4rem 0.8rem' }}
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              className="btn btn-outline" 
              style={{ padding: '0.4rem 0.8rem' }}
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Packets;
