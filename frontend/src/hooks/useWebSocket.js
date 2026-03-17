import { useEffect, useRef, useCallback } from 'react';

export default function useWebSocket(onMessage) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const stableOnMessage = useCallback(onMessage, []);

  useEffect(() => {
    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const token = localStorage.getItem('amicare_token') || '';
      const ws = new WebSocket(`${protocol}://${window.location.host}/ws?token=${token}`);

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          stableOnMessage(data);
        } catch (e) {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      wsRef.current = ws;
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [stableOnMessage]);
}
