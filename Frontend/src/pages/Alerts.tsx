import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { mlService } from '@/services/mlService';
import { productService } from '@/services/productService';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { AlertTriangle, TrendingDown, Package } from 'lucide-react';

interface AlertRow {
  id: string;
  productId: string;
  productName: string;
  category: string | null;
  alertType: string;
  message: string;
  currentStock: number;
  predictedStockoutDate: string | null;
  severity: string;
}

function deriveSeverity(alertType: string, currentStock: number): string {
  if (alertType === 'predicted_stockout') return 'critical';
  if (alertType === 'low_stock' && currentStock === 0) return 'critical';
  if (alertType === 'low_stock') return 'high';
  if (alertType === 'demand_spike') return 'medium';
  return 'low';
}

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export default function Alerts() {
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [severityFilter, setSeverityFilter] = React.useState('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ml-low-stock-alerts'],
    queryFn: () => mlService.getLowStockAlerts(200),
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  const { data: anomalyData } = useQuery({
    queryKey: ['ml-anomalies'],
    queryFn: () => mlService.getAnomalies(),
    staleTime: 5 * 60 * 1000,
  });

  // Load product list to resolve UUIDs → names
  const { data: productsPage } = useQuery({
    queryKey: ['products', 0, 'all', ''],
    queryFn: () => productService.getAll({ size: 500 }),
    staleTime: 5 * 60 * 1000,
  });

  const productsMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    (productsPage?.content ?? []).forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [productsPage]);

  const resolveProductName = (productId: string | undefined, productName: string | undefined): string => {
    if (!productId && !productName) return 'Unknown Product';
    // If productName is missing or is itself a UUID, look up from the products map
    if (!productName || isUUID(productName)) {
      if (productId && productsMap[productId]) return productsMap[productId];
      if (productId) return `Product ${productId.substring(0, 8)}…`;
    }
    return productName ?? 'Unknown Product';
  };

  // Combine low-stock alerts + anomalies into unified rows
  const rows: AlertRow[] = React.useMemo(() => {
    const stockAlerts: AlertRow[] = (data?.alerts ?? []).map((a, i) => ({
      id: `stock-${a.productId}-${i}`,
      productId: a.productId,
      productName: resolveProductName(a.productId, a.productName),
      category: a.category ?? null,
      alertType: a.alertType,
      message: a.message,
      currentStock: a.currentStock,
      predictedStockoutDate: a.predictedStockoutDate,
      severity: deriveSeverity(a.alertType, a.currentStock),
    }));

    const anomalyAlerts: AlertRow[] = (anomalyData?.items ?? []).map((a, i) => ({
      id: `anomaly-${i}`,
      productId: a.product_id ?? '',
      productName: resolveProductName(a.product_id, a.product_name),
      category: null,
      alertType: 'anomaly',
      message: a.reason ?? 'Anomaly detected in inventory transaction pattern.',
      currentStock: a.quantity ?? 0,
      predictedStockoutDate: null,
      severity: a.severity?.toLowerCase() ?? 'medium',
    }));

    return [...stockAlerts, ...anomalyAlerts].sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity as keyof typeof order] ?? 4) -
             (order[b.severity as keyof typeof order] ?? 4);
    });
  }, [data, anomalyData, productsMap]);

  const filtered = rows.filter((a) => {
    if (typeFilter !== 'all' && a.alertType !== typeFilter) return false;
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    return true;
  });

  const criticalCount = rows.filter((r) => r.severity === 'critical').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Alert Center</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          {rows.length} active alert{rows.length !== 1 ? 's' : ''}
          {criticalCount > 0 && (
            <span className="ml-2 text-red-600 font-semibold">· {criticalCount} critical</span>
          )}
        </p>
      </div>

      {isError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 font-medium">
          ML service is offline. Alerts require the FastAPI service on port 8000.
        </div>
      )}

      <DataTable
        data={filtered}
        isLoading={isLoading}
        searchPlaceholder="Search alerts by product or message..."
        searchKey={(item) => `${item.productName} ${item.message}`}
        pageSize={15}
        filterSlot={
          <>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'low_stock', label: 'Low Stock' },
                { value: 'predicted_stockout', label: 'Stockout Risk' },
                { value: 'demand_spike', label: 'Demand Spike' },
                { value: 'anomaly', label: 'Anomaly' },
              ]}
              className="w-44 text-xs"
            />
            <Select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Severity' },
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
              className="w-36 text-xs"
            />
          </>
        }
        columns={[
          {
            key: 'severity',
            header: 'Severity',
            render: (item) => (
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    item.severity === 'critical' ? 'bg-red-500 animate-pulse' :
                    item.severity === 'high' ? 'bg-orange-500' :
                    item.severity === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                  }`}
                />
                <Badge
                  variant={
                    item.severity === 'critical' ? 'critical' :
                    item.severity === 'high' ? 'orange' :
                    item.severity === 'medium' ? 'warning' : 'secondary'
                  }
                  className="text-[10px] font-bold capitalize"
                >
                  {item.severity}
                </Badge>
              </div>
            ),
          },
          {
            key: 'alertType',
            header: 'Type',
            render: (item) => (
              <div className="flex items-center gap-1.5">
                {item.alertType === 'anomaly' ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                ) : item.alertType === 'predicted_stockout' ? (
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                ) : (
                  <Package className="h-3.5 w-3.5 text-amber-500" />
                )}
                <span className="text-xs font-medium text-slate-600 capitalize">
                  {item.alertType.replace(/_/g, ' ')}
                </span>
              </div>
            ),
          },
          {
            key: 'productName',
            header: 'Product',
            className: 'min-w-[180px]',
            render: (item) => (
              <div>
                <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">
                  {item.productName}
                </p>
                {item.category && (
                  <p className="text-[10px] text-slate-400">{item.category}</p>
                )}
                {item.productId && isUUID(item.productId) && (
                  <p className="text-[10px] text-slate-300 font-mono truncate max-w-[180px]">
                    {item.productId}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: 'message',
            header: 'Message',
            className: 'min-w-[280px]',
            render: (item) => (
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{item.message}</p>
            ),
          },
          {
            key: 'currentStock',
            header: 'Stock',
            render: (item) => (
              <span className="text-xs font-mono font-bold text-slate-700">{item.currentStock}</span>
            ),
          },
          {
            key: 'predictedStockoutDate',
            header: 'Stockout By',
            render: (item) =>
              item.predictedStockoutDate ? (
                <span className="text-xs text-red-600 font-semibold">
                  {new Date(item.predictedStockoutDate).toLocaleDateString()}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">—</span>
              ),
          },
        ]}
      />
    </div>
  );
}
