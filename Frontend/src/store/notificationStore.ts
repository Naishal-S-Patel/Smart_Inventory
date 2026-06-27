import { create } from 'zustand';
import { AlertEvent } from '@/hooks/useWebSocket';

export interface LiveNotification {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationStore {
  notifications: LiveNotification[];
  addNotification: (event: AlertEvent) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],

  addNotification: (event) =>
    set((state) => ({
      notifications: [
        {
          id: event.alertId ?? `notif-${Date.now()}`,
          severity: event.severity,
          message: event.message,
          timestamp: event.timestamp,
          read: false,
        },
        ...state.notifications,
      ].slice(0, 50), // keep last 50
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  clearAll: () => set({ notifications: [] }),
}));
