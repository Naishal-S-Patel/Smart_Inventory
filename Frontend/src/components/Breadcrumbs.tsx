import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const PATH_LABELS: Record<string, string> = {
  '': 'Dashboard',
  'dashboard': 'Dashboard',
  'products': 'Products',
  'inventory': 'Inventory',
  'warehouses': 'Warehouses',
  'purchase-orders': 'Purchase Orders',
  'suppliers': 'Suppliers',
  'forecasting': 'Forecasting',
  'analytics': 'Analytics',
  'alerts': 'Alerts',
  'users': 'Users',
  'audit-logs': 'Audit Logs',
  'settings': 'Settings',
  'reports': 'Reports',
  'warehouse-transfers': 'Warehouse Transfers',
  'receive-orders': 'Receive Orders',
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 mb-6 text-xs font-medium">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 text-slate-400 hover:text-emerald-600 transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Home</span>
      </Link>
      {segments.map((segment, index) => {
        const path = '/' + segments.slice(0, index + 1).join('/');
        const isLast = index === segments.length - 1;
        const label = PATH_LABELS[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        return (
          <div key={path} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-slate-300" />
            {isLast ? (
              <span className="text-slate-700 font-semibold">{label}</span>
            ) : (
              <Link
                to={path}
                className="text-slate-400 hover:text-emerald-600 transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
