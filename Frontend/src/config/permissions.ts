import {
  LayoutDashboard,
  Package,
  Boxes,
  Warehouse,
  FileSpreadsheet,
  Users,
  LineChart,
  BrainCircuit,
  BellRing,
  Settings,
  ScrollText,
  FileBarChart,
  ArrowRightLeft,
  PackageCheck,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

// ─── Navigation Item ───────────────────────────────────────────
export interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  badge?: 'alerts';
  section?: 'main' | 'system';
}

// ─── Role Navigation Maps ──────────────────────────────────────
const ADMIN_NAV: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', path: '/products', icon: Boxes },
  { name: 'Inventory', path: '/inventory', icon: Package },
  { name: 'Warehouses', path: '/warehouses', icon: Warehouse },
  { name: 'Purchase Orders', path: '/purchase-orders', icon: FileSpreadsheet },
  { name: 'Suppliers', path: '/suppliers', icon: Users },
  { name: 'Forecasting', path: '/forecasting', icon: BrainCircuit },
  { name: 'Analytics', path: '/analytics', icon: LineChart },
  { name: 'Users', path: '/users', icon: Users, section: 'system' },
  { name: 'Audit Logs', path: '/audit-logs', icon: ScrollText, section: 'system' },
  { name: 'Settings', path: '/settings', icon: Settings, section: 'system' },
];

const MANAGER_NAV: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', path: '/products', icon: Boxes },
  { name: 'Inventory', path: '/inventory', icon: Package },
  { name: 'Warehouses', path: '/warehouses', icon: Warehouse },
  { name: 'Purchase Orders', path: '/purchase-orders', icon: FileSpreadsheet },
  { name: 'Suppliers', path: '/suppliers', icon: Users },
  { name: 'Forecasting', path: '/forecasting', icon: BrainCircuit },
  { name: 'Alerts', path: '/alerts', icon: BellRing, badge: 'alerts' },
];

const STAFF_NAV: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', path: '/inventory', icon: Package },
  { name: 'Products', path: '/products', icon: Boxes },
  { name: 'Warehouse Transfers', path: '/warehouse-transfers', icon: ArrowRightLeft },
  { name: 'Receive Orders', path: '/receive-orders', icon: PackageCheck },
];

const ANALYST_NAV: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Forecasting', path: '/forecasting', icon: BrainCircuit },
  { name: 'Analytics', path: '/analytics', icon: LineChart },
  { name: 'Reports', path: '/reports', icon: FileBarChart },
];

// ─── Get nav items by role ─────────────────────────────────────
export function getNavItemsForRole(role: UserRole): NavItem[] {
  switch (role) {
    case 'ADMIN': return ADMIN_NAV;
    case 'MANAGER': return MANAGER_NAV;
    case 'STAFF': return STAFF_NAV;
    case 'ANALYST': return ANALYST_NAV;
    default: return [];
  }
}

// ─── Route Access Map ──────────────────────────────────────────
const ROUTE_ROLES: Record<string, UserRole[]> = {
  '/dashboard': ['ADMIN', 'MANAGER', 'STAFF', 'ANALYST'],
  '/products': ['ADMIN', 'MANAGER', 'STAFF'],
  '/inventory': ['ADMIN', 'MANAGER', 'STAFF'],
  '/warehouses': ['ADMIN', 'MANAGER'],
  '/purchase-orders': ['ADMIN', 'MANAGER'],
  '/suppliers': ['ADMIN', 'MANAGER'],
  '/forecasting': ['ADMIN', 'MANAGER', 'ANALYST'],
  '/analytics': ['ADMIN', 'ANALYST'],
  '/alerts': ['ADMIN', 'MANAGER'],
  '/users': ['ADMIN'],
  '/audit-logs': ['ADMIN'],
  '/settings': ['ADMIN'],
  '/reports': ['ANALYST'],
  '/warehouse-transfers': ['STAFF'],
  '/receive-orders': ['STAFF'],
};

export function canAccessRoute(role: UserRole, path: string): boolean {
  const allowedRoles = ROUTE_ROLES[path];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

export function getAllowedRoles(path: string): UserRole[] {
  return ROUTE_ROLES[path] || [];
}

// ─── Role Display Config ───────────────────────────────────────
export const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bgColor: string }> = {
  ADMIN: { label: 'Administrator', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  MANAGER: { label: 'Manager', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  STAFF: { label: 'Staff', color: 'text-orange-700', bgColor: 'bg-orange-50' },
  ANALYST: { label: 'Analyst', color: 'text-purple-700', bgColor: 'bg-purple-50' },
};
