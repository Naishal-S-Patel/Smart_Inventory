import * as React from 'react';
import { Search, LogOut, Menu, Settings, Sun, Moon } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { useInventoryStore } from '@/store';
import { Avatar } from './ui/avatar';
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

  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

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

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login');
  };

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

          {/* Live Notification Bell */}
          <NotificationBell />

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => { setProfileOpen(!profileOpen); }}
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
                    onClick={handleLogout}
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


