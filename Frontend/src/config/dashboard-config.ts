import type { UserRole } from '@/types';
import type { LucideIcon } from 'lucide-react';
import {
  Package,
  Warehouse,
  Users,
  FileSpreadsheet,
  DollarSign,
  BrainCircuit,
  AlertTriangle,
  TrendingUp,
  ArrowRightLeft,
  PackageCheck,
  BarChart3,
  ShoppingCart,
  Gauge,
  Archive,
  Layers,
} from 'lucide-react';

// ─── KPI Widget Configuration ──────────────────────────────────
export interface KPIWidget {
  id: string;
  title: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  valueKey: string;
  format?: 'number' | 'currency' | 'percent';
  changeText?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

// ─── Dashboard Configs ─────────────────────────────────────────

export const ADMIN_KPIS: KPIWidget[] = [
  {
    id: 'total-products',
    title: 'Total Products',
    icon: Package,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    valueKey: 'totalProducts',
    format: 'number',
    changeText: '+12 this month',
    changeType: 'positive',
  },
  {
    id: 'total-warehouses',
    title: 'Total Warehouses',
    icon: Warehouse,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    valueKey: 'totalWarehouses',
    format: 'number',
    changeText: 'All operational',
    changeType: 'neutral',
  },
  {
    id: 'active-users',
    title: 'Active Users',
    icon: Users,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    valueKey: 'activeUsers',
    format: 'number',
    changeText: '3 online now',
    changeType: 'neutral',
  },
  {
    id: 'active-pos',
    title: 'Active Purchase Orders',
    icon: FileSpreadsheet,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    valueKey: 'activePOs',
    format: 'number',
    changeText: '1 arriving today',
    changeType: 'positive',
  },
  {
    id: 'inventory-value',
    title: 'Inventory Value',
    icon: DollarSign,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    valueKey: 'inventoryValue',
    format: 'currency',
    changeText: '+8.4% MoM',
    changeType: 'positive',
  },
  {
    id: 'forecast-health',
    title: 'Forecast Health',
    icon: BrainCircuit,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    valueKey: 'forecastAccuracy',
    format: 'percent',
    changeText: 'Prophet + XGBoost',
    changeType: 'neutral',
  },
];

export const MANAGER_KPIS: KPIWidget[] = [
  {
    id: 'low-stock',
    title: 'Low Stock Products',
    icon: AlertTriangle,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    valueKey: 'lowStockCount',
    format: 'number',
    changeText: 'Requires attention',
    changeType: 'negative',
  },
  {
    id: 'active-pos',
    title: 'Active Purchase Orders',
    icon: FileSpreadsheet,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    valueKey: 'activePOs',
    format: 'number',
    changeText: '1 arriving today',
    changeType: 'positive',
  },
  {
    id: 'inventory-value',
    title: 'Inventory Value',
    icon: DollarSign,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    valueKey: 'inventoryValue',
    format: 'currency',
    changeText: '+8.4% MoM',
    changeType: 'positive',
  },
  {
    id: 'forecast-recs',
    title: 'Forecast Recommendations',
    icon: BrainCircuit,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    valueKey: 'forecastRecs',
    format: 'number',
    changeText: 'AI-generated',
    changeType: 'neutral',
  },
  {
    id: 'supplier-perf',
    title: 'Supplier Performance',
    icon: TrendingUp,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    valueKey: 'supplierScore',
    format: 'percent',
    changeText: 'Avg. reliability',
    changeType: 'positive',
  },
  {
    id: 'active-alerts',
    title: 'Active Alerts',
    icon: AlertTriangle,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    valueKey: 'activeAlerts',
    format: 'number',
    changeText: 'Unresolved',
    changeType: 'negative',
  },
];

export const STAFF_KPIS: KPIWidget[] = [
  {
    id: 'stock-movements',
    title: 'Stock Movements',
    icon: ArrowRightLeft,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    valueKey: 'stockMovements',
    format: 'number',
    changeText: 'Today',
    changeType: 'neutral',
  },
  {
    id: 'pending-receipts',
    title: 'Pending Receipts',
    icon: PackageCheck,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    valueKey: 'pendingReceipts',
    format: 'number',
    changeText: 'Awaiting check-in',
    changeType: 'neutral',
  },
  {
    id: 'todays-transfers',
    title: "Today's Transfers",
    icon: ShoppingCart,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    valueKey: 'todaysTransfers',
    format: 'number',
    changeText: 'Completed',
    changeType: 'positive',
  },
  {
    id: 'low-stock-items',
    title: 'Low Stock Items',
    icon: AlertTriangle,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    valueKey: 'lowStockItems',
    format: 'number',
    changeText: 'Needs restock',
    changeType: 'negative',
  },
];

export const ANALYST_KPIS: KPIWidget[] = [
  {
    id: 'revenue-trend',
    title: 'Revenue Trend',
    icon: TrendingUp,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    valueKey: 'revenueTrend',
    format: 'currency',
    changeText: '+12.3% MoM',
    changeType: 'positive',
  },
  {
    id: 'sales-trend',
    title: 'Sales Trend',
    icon: BarChart3,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    valueKey: 'salesTrend',
    format: 'number',
    changeText: '+340 orders this month',
    changeType: 'positive',
  },
  {
    id: 'forecast-accuracy',
    title: 'Forecast Accuracy',
    icon: Gauge,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    valueKey: 'forecastAccuracy',
    format: 'percent',
    changeText: 'Model confidence',
    changeType: 'positive',
  },
  {
    id: 'dead-stock',
    title: 'Dead Stock Analysis',
    icon: Archive,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    valueKey: 'deadStockValue',
    format: 'currency',
    changeText: 'Capital at risk',
    changeType: 'negative',
  },
  {
    id: 'category-perf',
    title: 'Category Performance',
    icon: Layers,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    valueKey: 'categoryPerformance',
    format: 'number',
    changeText: '10 categories tracked',
    changeType: 'neutral',
  },
];

export function getKPIsForRole(role: UserRole): KPIWidget[] {
  switch (role) {
    case 'ADMIN': return ADMIN_KPIS;
    case 'MANAGER': return MANAGER_KPIS;
    case 'STAFF': return STAFF_KPIS;
    case 'ANALYST': return ANALYST_KPIS;
    default: return [];
  }
}
