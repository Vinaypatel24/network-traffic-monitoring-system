import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { Search, ChevronLeft, ChevronRight, Terminal } from 'lucide-react';

const PROTOCOL_BADGE = {
  TCP:  'badge-tcp',
  UDP:  'badge-udp',
  ICMP: 'badge-icmp',
};

const Packets = () => {
  const [packets, setPackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [protocol, setProtocol] = useState('');
  const [srcIp, setSrcIp] = useState('');

  const fetchPackets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, size: 15 });
      if (protocol) params.append('protocol', protocol);
      if (srcIp)    params.append('srcIp', srcIp);
      const response = await api.get(`/packets?${params.toString()}`);
      setPackets(response.data?.data || response.data?.content || []);
      setTotalPages(response.data?.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch packets:', error);
    } finally {
      setLoading(false);
    }
  }, [page, protocol, srcIp]);

  useEffect(() => { fetchPackets(); }, [fetchPackets]);

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(0);
  };

  return (
    <div className="animate-fade-in">

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.62rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '0.3rem',
        }}>
          // Packet Capture
        </div>
        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}>
          Real-Time Packet Stream
        </h2>
      </div>

      {/* ── Filter Bar ── */}
      <div className="glass-panel" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <form onSubmit={handleFilter} style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '140px' }}>
            <label className="form-label">Protocol</label>
            <select
              id="filter-protocol"
              className="form-input"
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              style={{ padding: '0.6rem 0.875rem' }}
            >
              <option value="">ALL</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
            </select>
          </div>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label className="form-label">Source IP Filter</label>
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                id="filter-src-ip"
                type="text"
                className="form-input"
                placeholder="192.168.x.x"
                value={srcIp}
                onChange={(e) => setSrcIp(e.target.value)}
                style={{ paddingLeft: '2.5rem', padding: '0.6rem 0.875rem 0.6rem 2.5rem' }}
              />
            </div>
          </div>
          <button
            id="btn-apply-filter"
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.25rem', alignSelf: 'flex-end' }}
          >
            <Terminal size={14} /> Apply Filter
          </button>
        </form>
      </div>

      {/* ── Packet Table ── */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Protocol</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Size</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{
                  padding: '2.5rem',
                  textAlign: 'center',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.08em',
                }}>
                  FETCHING_PACKETS...
                </td>
              </tr>
            ) : packets.length === 0 ? (
              <tr>
                <td colSpan="6" style={{
                  padding: '2.5rem',
                  textAlign: 'center',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.08em',
                }}>
                  NO_PACKETS_FOUND
                </td>
              </tr>
            ) : (
              packets.map(packet => (
                <tr key={packet.id}>
                  <td style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                  }}>
                    {new Date(packet.capturedAt).toLocaleTimeString()}
                  </td>
                  <td>
                    <span className={`badge ${PROTOCOL_BADGE[packet.protocol] || 'badge-info'}`}>
                      {packet.protocol}
                    </span>
                  </td>
                  <td style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.82rem',
                    color: 'var(--neon-cyan, #00e5ff)',
                  }}>
                    {packet.srcIp}
                    <span style={{ color: 'var(--text-muted)' }}>:{packet.srcPort || '*'}</span>
                  </td>
                  <td style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.82rem',
                    color: 'var(--text-mono)',
                  }}>
                    {packet.dstIp}
                    <span style={{ color: 'var(--text-muted)' }}>:{packet.dstPort || '*'}</span>
                  </td>
                  <td style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                  }}>
                    {packet.packetSize} <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>B</span>
                  </td>
                  <td style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.72rem',
                    color: packet.tcpFlags ? 'var(--neon-amber, #ffb800)' : 'var(--text-muted)',
                    letterSpacing: '0.04em',
                  }}>
                    {packet.tcpFlags || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
          }}>
            PAGE {page + 1} / {Math.max(1, totalPages)}
          </span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              id="btn-prev-page"
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.65rem' }}
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              id="btn-next-page"
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.65rem' }}
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Packets;
