import { mlApi } from '@/lib/apiClient';

// ─── Forecast ─────────────────────────────────────────────────
export interface ForecastPoint {
  date: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

export interface ForecastResponse {
  productId: string;
  productName?: string;
  category?: string;
  warehouse?: string;
  forecast: ForecastPoint[];
  recommendedOrderQty: number | null;
  predictedStockoutDate: string | null;
  confidence?: number;
}

export interface LowStockAlert {
  productId: string;
  productName?: string;
  category?: string;
  warehouseName?: string;
  alertType: string;
  message: string;
  currentStock: number;
  predictedStockoutDate: string | null;
}

export interface LowStockAlertsResponse {
  alerts: LowStockAlert[];
}

// ─── Analytics ────────────────────────────────────────────────
export interface SalesAnalyticsResponse {
  items: Record<string, unknown>[];
  chart: { labels: string[]; values: number[] };
  generated_at: string;
}

export interface InventoryAnalyticsResponse {
  items: Record<string, unknown>[];
  generated_at: string;
}

export interface AnomalyItem {
  product_id?: string;
  product_name?: string;
  warehouse_name?: string;
  severity?: string;
  reason?: string;
  anomaly_score?: number;
  detected_at?: string;
  quantity?: number;
}

export interface AnomalyResponse {
  items: AnomalyItem[];
  generated_at: string;
}

export interface InsightItem {
  title: string;
  description: string;
  severity: string;
  category: string;
}

export interface InsightResponse {
  items: InsightItem[];
  generated_at: string;
}

export interface DashboardSummaryResponse {
  total_sales: number;
  total_revenue: number;
  low_stock_count: number;
  predicted_stockouts: number;
  pending_purchase_orders: number;
  generated_at: string;
}

export const mlService = {
  // Forecast
  async getForecast(productId: string): Promise<ForecastResponse> {
    const { data } = await mlApi.get<ForecastResponse>(`/forecast/${productId}`);
    return data;
  },

  async getReorderRecommendation(
    productId: string,
    params?: { lead_time_days?: number; safety_stock?: number; current_stock?: number },
  ): Promise<ForecastResponse> {
    const { data } = await mlApi.get<ForecastResponse>(`/forecast/${productId}/reorder`, { params });
    return data;
  },

  async getLowStockAlerts(limit = 50): Promise<LowStockAlertsResponse> {
    const { data } = await mlApi.get<LowStockAlertsResponse>('/forecast/low-stock-alerts', {
      params: { limit },
    });
    return data;
  },

  async getForecastModels(): Promise<any[]> {
    const { data } = await mlApi.get<any[]>('/forecast/models');
    return data;
  },

  // Analytics
  async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    const { data } = await mlApi.get<DashboardSummaryResponse>('/analytics/dashboard-summary');
    return data;
  },

  async getTopProducts(): Promise<SalesAnalyticsResponse> {
    const { data } = await mlApi.get<SalesAnalyticsResponse>('/analytics/top-products');
    return data;
  },

  async getCategorySales(): Promise<SalesAnalyticsResponse> {
    const { data } = await mlApi.get<SalesAnalyticsResponse>('/analytics/category-sales');
    return data;
  },

  async getWarehousePerformance(): Promise<SalesAnalyticsResponse> {
    const { data } = await mlApi.get<SalesAnalyticsResponse>('/analytics/warehouse-performance');
    return data;
  },

  async getFastMoving(): Promise<InventoryAnalyticsResponse> {
    const { data } = await mlApi.get<InventoryAnalyticsResponse>('/analytics/fast-moving');
    return data;
  },

  async getDeadStock(): Promise<InventoryAnalyticsResponse> {
    const { data } = await mlApi.get<InventoryAnalyticsResponse>('/analytics/dead-stock');
    return data;
  },

  async getAnomalies(): Promise<AnomalyResponse> {
    const { data } = await mlApi.get<AnomalyResponse>('/analytics/anomalies');
    return data;
  },

  async getInsights(): Promise<InsightResponse> {
    const { data } = await mlApi.get<InsightResponse>('/analytics/insights');
    return data;
  },
};
