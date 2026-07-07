import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.client = null;
    this.onStatsCallback = null;
    this.onAlertCallback = null;
  }

  connect(token) {
    if (this.client && this.client.active) {
      return;
    }

    // SockJS fallback required if STOMP over pure WebSocket fails due to CORS or auth headers
    
    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: function (str) {
        // console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log('Connected to WebSocket STOMP broker');
      
      this.client.subscribe('/topic/stats', (message) => {
        if (this.onStatsCallback && message.body) {
          this.onStatsCallback(JSON.parse(message.body));
        }
      });

      this.client.subscribe('/topic/alerts', (message) => {
        if (this.onAlertCallback && message.body) {
          this.onAlertCallback(JSON.parse(message.body));
        }
      });
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
    }
  }

  onStats(callback) {
    this.onStatsCallback = callback;
  }

  onAlert(callback) {
    this.onAlertCallback = callback;
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
