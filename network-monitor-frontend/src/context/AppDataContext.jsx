import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import api from '../services/api';
import webSocketService from '../services/WebSocketService';
import { useAuth } from './AuthContext';

const AppDataContext = createContext();

export const useAppData = () => useContext(AppDataContext);

export const AppDataProvider = ({ children }) => {
  const { token } = useAuth();

  // ── Alerts State ────────────────────────────────────────────────────────────
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // ── Blacklist State ──────────────────────────────────────────────────────────
  const [blacklist, setBlacklist] = useState([]);
  const [blacklistLoading, setBlacklistLoading] = useState(false);

  // Keep a stable ref to blacklist so we can check duplicates without deps
  const blacklistRef = useRef(blacklist);
  useEffect(() => { blacklistRef.current = blacklist; }, [blacklist]);

  // ── Fetch helpers ────────────────────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const res = await api.get('/alerts', { params: { size: 200, sort: 'detectedAt,desc' } });
      const list = res.data?.data || res.data?.content || [];
      setAlerts(list.slice(0, 50));
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  const fetchBlacklist = useCallback(async () => {
    setBlacklistLoading(true);
    try {
      const res = await api.get('/blacklist', { params: { size: 200, sort: 'addedAt,desc' } });
      const list = res.data?.content || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setBlacklist(list);
    } catch (err) {
      console.error('Failed to fetch blacklist:', err);
    } finally {
      setBlacklistLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (token) {
      fetchAlerts();
      fetchBlacklist();
    }
  }, [token, fetchAlerts, fetchBlacklist]);

  // ── WebSocket: live alert feed ───────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    webSocketService.connect(token);
    webSocketService.onAlert((incomingAlert) => {
      setAlerts(prev => {
        const existing = prev.find(a => a.id === incomingAlert.id);
        // Never overwrite a locally-resolved alert with a stale WS event
        if (existing && existing.status === 'RESOLVED') return prev;
        return [incomingAlert, ...prev.filter(a => a.id !== incomingAlert.id)].slice(0, 50);
      });
    });
    return () => {
      webSocketService.onAlert(null);
    };
  }, [token]);

  // ── Resolve alert (BLACKLIST or GENUINE) ────────────────────────────────────
  const resolveAlert = useCallback(async (alertId, action, extraPayload = {}) => {
    const payload = {
      action,
      blacklistReason: action === 'BLACKLIST' ? `Blacklisted via Alert #${alertId}` : null,
      ...extraPayload
    };
    await api.post(`/alerts/${alertId}/resolve`, payload);

    // Update alert status locally immediately
    setAlerts(prev =>
      prev.map(a => a.id === alertId ? { ...a, status: 'RESOLVED' } : a)
    );

    // If blacklisted, refresh blacklist so the new entry shows up
    if (action === 'BLACKLIST') {
      fetchBlacklist();
    }
  }, [fetchBlacklist]);

  // ── Blacklist CRUD ────────────────────────────────────────────────────────────
  const addToBlacklist = useCallback(async (ipAddress, reason) => {
    await api.post('/blacklist', { ipAddress, reason });
    fetchBlacklist();
  }, [fetchBlacklist]);

  const removeFromBlacklist = useCallback(async (id) => {
    await api.delete(`/blacklist/${id}`);
    setBlacklist(prev => prev.filter(ip => ip.id !== id));
  }, []);

  // ── Acknowledge alert ─────────────────────────────────────────────────────────
  const acknowledgeAlert = useCallback(async (alertId) => {
    await api.post(`/alerts/${alertId}/acknowledge`);
    setAlerts(prev =>
      prev.map(a => a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a)
    );
  }, []);

  const value = {
    // Alerts
    alerts,
    alertsLoading,
    fetchAlerts,
    resolveAlert,
    acknowledgeAlert,
    // Blacklist
    blacklist,
    blacklistLoading,
    fetchBlacklist,
    addToBlacklist,
    removeFromBlacklist,
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};
