// ─── Role System ───────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'ANALYST';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  status?: 'active' | 'inactive';
  lastLogin?: string;
  createdAt?: string;
}

// ─── Product & Inventory ───────────────────────────────────────
export type ProductStatus = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstocked';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  cost: number;
  supplierId: string;
  status: ProductStatus;
  reorderPoint: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitOfMeasure: string;
  barcode: string;
  warehouseStockMap: Record<string, number>;
  tags: string[];
  lastUpdated: string;
}

// ─── Warehouse ─────────────────────────────────────────────────
export type WarehouseStatus = 'active' | 'full' | 'maintenance';

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  usedCapacity: number;
  managerName: string;
  status: WarehouseStatus;
}

// ─── Supplier ──────────────────────────────────────────────────
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
  leadTimeDays: number;
  reliabilityScore: number;
  activeOrders: number;
  productsSuppliedCount: number;
}

// ─── Purchase Orders ───────────────────────────────────────────
export type POStatus = 'Draft' | 'Approved' | 'Sent' | 'Received';

export interface PurchaseOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface POTimelineEvent {
  status: POStatus;
  date: string;
  note?: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  items: PurchaseOrderItem[];
  status: POStatus;
  totalAmount: number;
  orderDate: string;
  deliveryDate?: string;
  timeline: POTimelineEvent[];
  approvedBy?: string;
}

// ─── Alerts ────────────────────────────────────────────────────
export type AlertType = 'low_stock' | 'overstock' | 'anomaly' | 'forecast_drift' | 'expiry';
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'unread' | 'read' | 'investigating' | 'resolved';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  productId?: string;
  productName?: string;
  message: string;
  timestamp: string;
  status: AlertStatus;
  warehouseId?: string;
  notes?: string;
}

// ─── Forecasting ───────────────────────────────────────────────
export interface ForecastPoint {
  date: string;
  actualDemand: number | null;
  prophetPredictedDemand: number;
  xgboostPredictedDemand: number;
  confidenceLower: number;
  confidenceUpper: number;
}

export type ForecastStatus = 'stable' | 'high_volatility' | 'growth' | 'decline';
export type TrendIndicator = 'up' | 'down' | 'flat';

export interface ProductForecast {
  productId: string;
  name: string;
  accuracy: number;
  status: ForecastStatus;
  trendIndicator: TrendIndicator;
  recommendation: string;
  recommendedRestockQty: number;
  riskScore: number;
  modelHealth: {
    rmse: number;
    mae: number;
    lastTrained: string;
  };
  historicalAndForecast: ForecastPoint[];
}

// ─── Transactions ──────────────────────────────────────────────
export type TransactionType = 'inbound' | 'outbound' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  productId: string;
  productName: string;
  quantity: number;
  source: string;
  destination: string;
  timestamp: string;
  performedBy: string;
}

// ─── Analytics ─────────────────────────────────────────────────
export interface AnalyticsSummary {
  revenueTrend: { month: string; sales: number; profit: number; forecast: number }[];
  warehouseDistribution: { name: string; value: number }[];
  supplierPerformance: { name: string; rating: number; deliveryRate: number; orderCount: number }[];
  categoryPerformance: { category: string; revenue: number; units: number; growth: number }[];
  deadStockValue: number;
  turnoverRatio: number;
  totalRevenue: number;
  totalOrders: number;
}

// ─── Audit Logs ────────────────────────────────────────────────
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'APPROVE' | 'EXPORT' | 'IMPORT';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
}

// ─── Warehouse Transfers ───────────────────────────────────────
export type TransferStatus = 'pending' | 'in_transit' | 'completed' | 'cancelled';

export interface WarehouseTransfer {
  id: string;
  transferNumber: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  items: { productId: string; productName: string; quantity: number }[];
  status: TransferStatus;
  createdAt: string;
  completedAt?: string;
  createdBy: string;
  notes?: string;
}

// ─── Reports ───────────────────────────────────────────────────
export type ReportCategory = 'demand' | 'inventory' | 'financial' | 'performance';

export interface Report {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  generatedAt: string;
  generatedBy: string;
  format: 'PDF' | 'CSV' | 'XLSX';
  size: string;
  status: 'ready' | 'generating' | 'failed';
}
