import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Boxes } from 'lucide-react';
import { useInventoryStore } from '@/store';
import { getNavItemsForRole, ROLE_CONFIG } from '@/config/permissions';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const currentUser = useInventoryStore((state) => state.currentUser);

  if (!currentUser) return null;

  const navItems = getNavItemsForRole(currentUser.role);
  const mainItems = navItems.filter((item) => !item.section || item.section === 'main');
  const systemItems = navItems.filter((item) => item.section === 'system');
  const roleConfig = ROLE_CONFIG[currentUser.role];

  const sidebarVariants = {
    expanded: { width: '260px' },
    collapsed: { width: '72px' },
  };

  const renderNavItem = (item: typeof navItems[0]) => {
    const badgeCount = undefined; // alerts fetched via React Query in Alerts page

    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === '/dashboard'}
        onClick={() => setMobileOpen(false)}
        className={({ isActive }) =>
          cn(
            'flex items-center rounded-lg py-2.5 px-3 text-[13px] font-medium transition-all duration-150 group relative',
            isActive
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-semibold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )
        }
      >
        <item.icon className="h-[18px] w-[18px] shrink-0" />

        {!collapsed && (
          <span className="ml-3 truncate transition-opacity duration-200">{item.name}</span>
        )}

        {/* Alert badge */}
        {badgeCount !== undefined && badgeCount > 0 && (
          <span
            className={cn(
              'flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1',
              collapsed ? 'absolute -top-0.5 -right-0.5' : 'absolute right-3'
            )}
          >
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}

        {/* Tooltip on collapsed */}
        {collapsed && (
          <div className="absolute left-full ml-3 z-50 scale-0 group-hover:scale-100 transition-all duration-100 origin-left rounded-md bg-slate-800 text-white text-[11px] font-medium py-1 px-2.5 pointer-events-none whitespace-nowrap shadow-lg">
            {item.name}
          </div>
        )}
      </NavLink>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-border bg-card">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm shrink-0">
            <Boxes className="h-5 w-5" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col min-w-0"
            >
              <span className="font-bold tracking-tight text-foreground text-[14px] leading-tight">
                SmartInventory
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide uppercase leading-none mt-0.5">
                AI Prediction Suite
              </span>
            </motion.div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto no-scrollbar space-y-1">
        {mainItems.map(renderNavItem)}

        {/* System section divider */}
        {systemItems.length > 0 && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-2 px-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  System
                </p>
              </div>
            )}
            {collapsed && <div className="border-t border-border my-2" />}
            {systemItems.map(renderNavItem)}
          </>
        )}
      </nav>

      {/* User Profile Footer */}
      {currentUser && (
        <div className="border-t border-border p-3 bg-muted/20">
          <div className="flex items-center space-x-3 overflow-hidden">
            <Avatar name={currentUser.name} size="sm" />
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-semibold text-slate-800 leading-none">
                  {currentUser.name}
                </span>
                <span className={cn('text-[10px] font-semibold mt-1 leading-none px-1.5 py-0.5 rounded-full inline-block w-fit', roleConfig.bgColor, roleConfig.color)}>
                  {roleConfig.label}
                </span>
              </div>
            )}
          </div>

          {/* Role display only — no demo switcher in production */}
          {!collapsed && (
            <div className="mt-2">
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', roleConfig.bgColor, roleConfig.color)}>
                {roleConfig.label}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial="expanded"
        animate={collapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        transition={{ type: 'spring', damping: 22, stiffness: 200 }}
        className="hidden md:flex h-screen flex-col shrink-0 sticky top-0 z-20"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[260px] transform bg-card border-r border-border transition-transform duration-300 ease-out md:hidden shadow-2xl',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
