import * as React from 'react';
import { Bell, BellRing, Check, Trash2, Wifi, WifiOff, Loader } from 'lucide-react';
import { useInventoryStore } from '@/store';
import { useNotificationStore, LiveNotification } from '@/store/notificationStore';
import { useAlertWebSocket, WsStatus } from '@/hooks/useWebSocket';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── WebSocket connection manager (renders nothing) ──────────────────────────
function WsConnectionManager() {
  const currentUser = useInventoryStore((s) => s.currentUser);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const queryClient = useQueryClient();

  const status = useAlertWebSocket(currentUser?.id, (event) => {
    addNotification(event);

    // Show a toast for critical/high severity
    if (event.severity === 'CRITICAL') {
      toast.error(event.message, { duration: 8000, id: event.alertId });
    } else if (event.severity === 'HIGH') {
      toast.warning(event.message, { duration: 5000, id: event.alertId });
    } else {
      toast.info(event.message, { duration: 3000, id: event.alertId });
    }

    // Invalidate relevant queries so data refreshes automatically
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['ml-low-stock-alerts'] });
  });

  // Expose status for the bell indicator
  React.useEffect(() => {
    (window as unknown as { __wsStatus?: WsStatus }).__wsStatus = status;
    window.dispatchEvent(new CustomEvent('ws-status', { detail: status }));
  }, [status]);

  return null;
}

// ─── Individual notification item ────────────────────────────────────────────
function NotificationItem({
  notif,
  onRead,
}: {
  notif: LiveNotification;
  onRead: (id: string) => void;
}) {
  const age = Math.round((Date.now() - new Date(notif.timestamp).getTime()) / 60000);

  const severityConfig = {
    CRITICAL: { dot: 'bg-red-500 animate-pulse', text: 'text-red-600', label: 'Critical' },
    HIGH:     { dot: 'bg-orange-500',             text: 'text-orange-600', label: 'High' },
    MEDIUM:   { dot: 'bg-amber-400',              text: 'text-amber-600', label: 'Medium' },
    LOW:      { dot: 'bg-slate-400',              text: 'text-slate-500', label: 'Low' },
  }[notif.severity] ?? { dot: 'bg-slate-300', text: 'text-slate-400', label: notif.severity };

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 transition-colors border-b border-slate-50 last:border-0',
        !notif.read ? 'bg-blue-50/30 hover:bg-blue-50/60' : 'hover:bg-slate-50/60'
      )}
    >
      <div className="mt-1.5 shrink-0">
        <span className={cn('block h-2 w-2 rounded-full', severityConfig.dot)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-[11px] font-bold uppercase tracking-wide mb-0.5', severityConfig.text)}>
          {severityConfig.label}
        </p>
        <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">{notif.message}</p>
        <p className="text-[10px] text-slate-400 mt-1">
          {age === 0 ? 'just now' : `${age}m ago`}
        </p>
      </div>
      {!notif.read && (
        <button
          onClick={() => onRead(notif.id)}
          className="shrink-0 p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors mt-0.5"
          title="Mark as read"
        >
          <Check className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ─── Connection status indicator ─────────────────────────────────────────────
function StatusPill({ status }: { status: WsStatus }) {
  if (status === 'connected') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
        <Wifi className="h-3 w-3" />
        Live
      </span>
    );
  }
  if (status === 'connecting') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500">
        <Loader className="h-3 w-3 animate-spin" />
        Connecting…
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
      <WifiOff className="h-3 w-3" />
      Offline
    </span>
  );
}

// ─── Main bell component ──────────────────────────────────────────────────────
export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [wsStatus, setWsStatus] = React.useState<WsStatus>('disconnected');
  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clearAll = useNotificationStore((s) => s.clearAll);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Listen for status changes from WsConnectionManager
  React.useEffect(() => {
    const handler = (e: Event) => {
      setWsStatus((e as CustomEvent<WsStatus>).detail);
    };
    window.addEventListener('ws-status', handler);
    return () => window.removeEventListener('ws-status', handler);
  }, []);

  return (
    <>
      {/* Mount the connection manager which actually holds the WS socket */}
      <WsConnectionManager />

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'relative rounded-lg border border-border bg-card hover:bg-muted p-2 text-muted-foreground hover:text-foreground transition-colors',
            open && 'bg-muted text-foreground'
          )}
          title="Notifications"
        >
          {unreadCount > 0 ? (
            <BellRing className="h-4.5 w-4.5 text-amber-500" />
          ) : (
            <Bell className="h-4.5 w-4.5" />
          )}

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white px-1 animate-in zoom-in-50 duration-200">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {/* Live dot indicator */}
          {wsStatus === 'connected' && (
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 border border-card" />
          )}
        </button>

        {/* Dropdown panel */}
        {open && (
          <>
            {/* Backdrop */}
            <div onClick={() => setOpen(false)} className="fixed inset-0 z-40" />

            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-enterprise-lg z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-150">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <StatusPill status={wsStatus} />
              </div>

              {/* Actions bar */}
              {notifications.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Mark all read
                  </button>
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear all
                  </button>
                </div>
              )}

              {/* Notifications list */}
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                    <div className="p-3 rounded-xl bg-slate-100">
                      <Bell className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-xs font-semibold text-slate-500">No notifications yet</p>
                    <p className="text-[11px] text-slate-400 max-w-[180px] leading-relaxed">
                      {wsStatus === 'connected'
                        ? 'You\'re connected — alerts will appear here in real time'
                        : 'Connect to the backend to receive live alerts'}
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <NotificationItem key={notif.id} notif={notif} onRead={markRead} />
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-border bg-slate-50/50">
                <p className="text-[10px] text-slate-400 text-center">
                  {wsStatus === 'connected'
                    ? '🟢 Connected — receiving live alerts from backend'
                    : wsStatus === 'connecting'
                    ? '🟡 Reconnecting to WebSocket…'
                    : '🔴 Disconnected — start the Spring Boot backend'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
