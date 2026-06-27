import { useEffect, useRef, useState } from 'react';
import { getAccessToken } from '@/lib/apiClient';

function parseStompFrame(data: string) {
  const normalized = data.replace(/\r\n/g, '\n');
  const parts = normalized.split('\n\n');
  const headersPart = parts[0];
  const bodyPart = parts.slice(1).join('\n\n');
  const lines = headersPart.split('\n');
  const command = lines[0].trim();
  const headers: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const idx = line.indexOf(':');
      if (idx !== -1) {
        headers[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
      }
    }
  }
  const body = bodyPart ? bodyPart.replace(/\u0000$/, '').trim() : '';
  return { command, headers, body };
}

function buildStompFrame(command: string, headers: Record<string, string>, body = '') {
  let frame = command + '\n';
  for (const [key, value] of Object.entries(headers)) {
    frame += `${key}:${value}\n`;
  }
  frame += '\n' + body + '\u0000';
  return frame;
}

export type WsStatus = 'connecting' | 'connected' | 'disconnected';

export function useWebSocket(
  destination: string | null,
  onMessage: (body: unknown) => void
) {
  const [status, setStatus] = useState<WsStatus>('disconnected');
  const socketRef = useRef<WebSocket | null>(null);
  const subIdRef = useRef<string>(`sub-${Math.random().toString(36).substring(2, 11)}`);

  // Use a ref for the callback so changes to onMessage don't trigger sub-unsub cycles
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!destination) return;

    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let isMounted = true;

    const connect = () => {
      setStatus('connecting');
      const token = getAccessToken();
      const wsUrl = `ws://${window.location.hostname}:8080/ws/websocket`;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        const connectHeaders: Record<string, string> = {
          'accept-version': '1.1,1.2',
          'heart-beat': '10000,10000',
        };
        if (token) {
          connectHeaders['Authorization'] = `Bearer ${token}`;
        }
        ws.send(buildStompFrame('CONNECT', connectHeaders));
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const frame = parseStompFrame(event.data);
          if (frame.command === 'CONNECTED') {
            setStatus('connected');
            ws.send(
              buildStompFrame('SUBSCRIBE', {
                id: subIdRef.current,
                destination: destination,
              })
            );
          } else if (frame.command === 'MESSAGE') {
            if (frame.headers.destination === destination || frame.headers.destination?.startsWith(destination)) {
              try {
                const parsed = JSON.parse(frame.body);
                onMessageRef.current(parsed);
              } catch {
                onMessageRef.current(frame.body);
              }
            }
          }
        } catch (err) {
          console.error('Error parsing stomp frame', err);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setStatus('disconnected');
        reconnectTimeout = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        if (socketRef.current.readyState === WebSocket.OPEN) {
          try {
            socketRef.current.send(
              buildStompFrame('UNSUBSCRIBE', { id: subIdRef.current })
            );
            socketRef.current.send(buildStompFrame('DISCONNECT', {}));
          } catch {
            // ignore
          }
        }
        socketRef.current.close();
      }
    };
  }, [destination]);

  return status;
}

// ─── Typed hook for Alert events ───────────────────────────────────────────
export interface AlertEvent {
  alertId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  timestamp: string;
}

export interface InventoryEvent {
  eventType: string;
  warehouseId: string;
  productId: string;
  oldQuantity: number;
  newQuantity: number;
  timestamp: string;
}

/** Subscribe to real-time alert events for a specific user */
export function useAlertWebSocket(
  userId: string | undefined,
  onAlert: (event: AlertEvent) => void
) {
  const destination = userId ? `/topic/alerts/${userId}` : null;
  return useWebSocket(destination, onAlert as (body: unknown) => void);
}

/** Subscribe to real-time inventory updates for all warehouses */
export function useInventoryWebSocket(
  warehouseId: string | undefined,
  onUpdate: (event: InventoryEvent) => void
) {
  const destination = warehouseId ? `/topic/inventory/${warehouseId}` : null;
  return useWebSocket(destination, onUpdate as (body: unknown) => void);
}
