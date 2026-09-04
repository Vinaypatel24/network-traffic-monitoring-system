import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.client = null;
    this.onStatsCallback = null;
    this.onAlertCallback = null;
    this.onStatusChangeCallback = null;
    this.isConnected = false;
  }

  getWsUrl() {
    if (typeof window !== 'undefined' && window.location) {
      // Connects via Vite proxy (/ws) or Nginx reverse proxy
      return `${window.location.origin}/ws`;
    }
    return 'http://localhost:8080/ws';
  }

  connect(token) {
    if (this.client && this.client.active) {
      return;
    }

    const wsUrl = this.getWsUrl();

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: token ? {
        Authorization: `Bearer ${token}`
      } : {},
      debug: (str) => {
        // console.debug('STOMP: ' + str);
      },
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      this.isConnected = true;
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(true);
      }

      this.client.subscribe('/topic/stats', (message) => {
        if (this.onStatsCallback && message.body) {
          try {
            const parsed = JSON.parse(message.body);
            this.onStatsCallback(parsed);
          } catch (e) {
            console.warn('Failed to parse /topic/stats payload:', e);
          }
        }
      });

      this.client.subscribe('/topic/alerts', (message) => {
        if (this.onAlertCallback && message.body) {
          try {
            const parsed = JSON.parse(message.body);
            this.onAlertCallback(parsed);
          } catch (e) {
            console.warn('Failed to parse /topic/alerts payload:', e);
          }
        }
      });
    };

    this.client.onDisconnect = () => {
      this.isConnected = false;
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(false);
      }
    };

    this.client.onStompError = (frame) => {
      console.warn('STOMP Broker error:', frame?.headers?.message, frame?.body);
      this.isConnected = false;
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(false);
      }
    };

    this.client.onWebSocketClose = () => {
      this.isConnected = false;
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(false);
      }
    };

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (e) {
        // ignore
      }
      this.isConnected = false;
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(false);
      }
    }
  }

  onStats(callback) {
    this.onStatsCallback = callback;
  }

  onAlert(callback) {
    this.onAlertCallback = callback;
  }

  onStatusChange(callback) {
    this.onStatusChangeCallback = callback;
    if (callback) {
      callback(this.isConnected);
    }
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
