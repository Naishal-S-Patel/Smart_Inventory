import * as React from 'react';
import { Bell, Search, LogOut, Menu, Play, Square, Settings, Sun, Moon } from 'lucide-react';
import { useInventoryStore } from '@/store';
import { Avatar } from './ui/avatar';
import { Badge } from './ui/badge';
import { ROLE_CONFIG } from '@/config/permissions';
import { CommandPalette } from './CommandPalette';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavbarProps {
  setMobileOpen: (open: boolean) => void;
}

export function Navbar({ setMobileOpen }: NavbarProps) {
  const navigate = useNavigate();
  const logout = useInventoryStore((state) => state.logout);
  const currentUser = useInventoryStore((state) => state.currentUser);

  const isSimulating = useInventoryStore((state) => state.isSimulating);
  const toggleSimulation = useInventoryStore((state) => state.toggleSimulation);
  const runSimulationTick = useInventoryStore((state) => state.runSimulationTick);

  const alerts = useInventoryStore((state) => state.alerts);
  const unreadAlerts = alerts.filter((a) => a.status === 'unread');

  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [alertsOpen, setAlertsOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  // Simulation interval
  React.useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (isSimulating) {
      intervalId = setInterval(() => runSimulationTick(), 4000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isSimulating, runSimulationTick]);

  // Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const roleConfig = currentUser ? ROLE_CONFIG[currentUser.role] : null;

  const theme = useInventoryStore((state) => state.theme);
  const toggleTheme = useInventoryStore((state) => state.toggleTheme);

  return (
    <>
      <header className="flex h-16 w-full items-center justify-between border-b border-border bg-card/80 backdrop-blur-lg px-6 sticky top-0 z-30 select-none">
        <div className="flex items-center gap-3">
          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search trigger */}
          <div
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-muted/40 hover:bg-muted/70 px-3 py-2 cursor-pointer text-muted-foreground w-64 transition-all"
          >
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-muted-foreground/80">Search...</span>
            <kbd className="hidden lg:inline-flex items-center rounded bg-background border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground font-semibold ml-auto shadow-xs">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Simulator */}
          <div className="hidden lg:flex items-center rounded-lg bg-slate-50 border border-slate-200/80 px-3 py-1.5 gap-2">
            <span className="relative flex h-2 w-2">
              <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75', isSimulating ? 'animate-ping bg-emerald-400' : 'bg-slate-300')} />
              <span className={cn('relative inline-flex rounded-full h-2 w-2', isSimulating ? 'bg-emerald-500' : 'bg-slate-400')} />
            </span>
            <span className="text-[11px] font-semibold text-slate-600">
              {isSimulating ? 'Live' : 'Idle'}
            </span>
            <button
              onClick={toggleSimulation}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all',
                isSimulating
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              )}
            >
              {isSimulating ? <Square className="h-2.5 w-2.5 fill-current" /> : <Play className="h-2.5 w-2.5 fill-current" />}
              {isSimulating ? 'Stop' : 'Start'}
            </button>
          </div>

          {/* Mobile search */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex sm:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Search className="h-4.5 w-4.5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-lg border border-border bg-card hover:bg-muted p-2 text-muted-foreground hover:text-foreground transition-colors"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setAlertsOpen(!alertsOpen); setProfileOpen(false); }}
              className="relative rounded-lg border border-border bg-card hover:bg-muted p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-background">
                  {unreadAlerts.length > 9 ? '9+' : unreadAlerts.length}
                </span>
              )}
            </button>

            {alertsOpen && (
              <>
                <div onClick={() => setAlertsOpen(false)} className="fixed inset-0 z-40" />
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card p-4 shadow-enterprise-lg z-50 animate-scale-in">
                  <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                    <span className="text-xs font-bold text-foreground">Notifications</span>
                    <button
                      onClick={() => { navigate('/alerts'); setAlertsOpen(false); }}
                      className="text-[11px] text-emerald-600 font-semibold hover:underline dark:text-emerald-400"
                    >
                      View all
                    </button>
                  </div>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto no-scrollbar">
                    {unreadAlerts.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-xs font-medium">
                        No unread notifications
                      </div>
                    ) : (
                      unreadAlerts.slice(0, 3).map((a) => (
                        <div key={a.id} className="flex flex-col border-b border-border pb-2 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between">
                            <Badge
                              variant={a.severity === 'critical' ? 'critical' : a.severity === 'high' ? 'orange' : 'warning'}
                              className="text-[9px] font-bold uppercase"
                            >
                              {a.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-foreground/80 line-clamp-2 leading-relaxed font-medium">
                            {a.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => { setProfileOpen(!profileOpen); setAlertsOpen(false); }}
              className="flex items-center gap-2 border border-border rounded-lg p-1.5 pr-3 hover:bg-muted transition-colors bg-card"
            >
              <Avatar name={currentUser?.name || 'User'} size="sm" />
              <span className="text-xs font-semibold text-foreground hidden sm:inline">
                {currentUser?.name}
              </span>
            </button>

            {profileOpen && (
              <>
                <div onClick={() => setProfileOpen(false)} className="fixed inset-0 z-40" />
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-card p-2 shadow-enterprise-lg z-50 animate-scale-in">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-xs font-bold text-foreground">{currentUser?.name}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">{currentUser?.email}</p>
                    {roleConfig && (
                      <span className={cn('inline-block text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full', roleConfig.bgColor, roleConfig.color)}>
                        {roleConfig.label}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { navigate('/settings'); setProfileOpen(false); }}
                    className="flex w-full items-center rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={() => { logout(); setProfileOpen(false); navigate('/login'); }}
                    className="flex w-full items-center rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </>
  );
}
