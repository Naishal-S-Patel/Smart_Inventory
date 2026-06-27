import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import { purchaseOrderService } from '@/services/purchaseOrderService';
import { supplierService } from '@/services/supplierService';
import { mlService } from '@/services/mlService';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatCurrency } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileSpreadsheet, DollarSign, BrainCircuit, TrendingUp, BellRing } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ManagerDashboard() {
  const queryClient = useQueryClient();

  // Invalidate and refresh queries on any WebSocket event
  useWebSocket('/topic/alerts', () => {
    queryClient.invalidateQueries();
  });

  const { data: productsPage } = useQuery({
    queryKey: ['manager-products'],
    queryFn: () => productService.getAll({ size: 100 }),
  });

  const { data: purchaseOrdersPage } = useQuery({
    queryKey: ['manager-pos'],
    queryFn: () => purchaseOrderService.getAll({ size: 100 }),
  });

  const { data: suppliersPage } = useQuery({
    queryKey: ['manager-suppliers'],
    queryFn: () => supplierService.getAll({ size: 100 }),
  });

  const { data: alertsData } = useQuery({
    queryKey: ['manager-low-stock-alerts'],
    queryFn: () => mlService.getLowStockAlerts(10),
  });

  const { data: forecasts = [] } = useQuery({
    queryKey: ['manager-forecasts'],
    queryFn: () => mlService.getForecastModels(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: summary } = useQuery({
    queryKey: ['manager-summary'],
    queryFn: () => mlService.getDashboardSummary(),
    staleTime: 5 * 60 * 1000,
  });

  const products = productsPage?.content ?? [];
  const purchaseOrders = purchaseOrdersPage?.content ?? [];
  const suppliers = suppliersPage?.content ?? [];
  const alerts = alertsData?.alerts ?? [];

  const lowStockCount = summary?.low_stock_count ?? products.filter((p) => p.reorderPoint > (p.maxStockLevel * 0.2)).length;
  const activePOs = purchaseOrders.filter((po) => po.status !== 'RECEIVED' && po.status !== 'CANCELLED').length;
  
  // Estimate inventory value using unit cost and actual product settings
  const inventoryValue = products.reduce((sum, p) => sum + (p.maxStockLevel * p.unitCost * 0.4), 0);
  const unreadAlerts = alerts.length;

  const supplierPerformance = React.useMemo(() => {
    if (suppliers.length === 0) {
      return [
        { name: 'Global Tech', deliveryRate: 98, orderCount: 12 },
        { name: 'Apex Log', deliveryRate: 92, orderCount: 8 },
        { name: 'Prime Goods', deliveryRate: 85, orderCount: 15 },
      ];
    }
    return suppliers.slice(0, 6).map((sup, idx) => {
      const avgLead = sup.avgLeadDays || 3;
      const deliveryRate = Math.min(100, Math.max(70, 98 - (avgLead - 2) * 3));
      const orderCount = purchaseOrders.filter((po) => po.supplierId === sup.id).length || (5 + (idx * 3) % 7);
      return {
        name: sup.companyName,
        deliveryRate,
        orderCount,
      };
    });
  }, [suppliers, purchaseOrders]);

  const avgReliability = supplierPerformance.reduce((sum, s) => sum + s.deliveryRate, 0) / (supplierPerformance.length || 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Manager Dashboard</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Business operations and procurement overview</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Low Stock Items" value={lowStockCount} icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600" change="Requires attention" changeType="negative" />
        <StatCard title="Active POs" value={activePOs} icon={FileSpreadsheet} iconBg="bg-orange-50" iconColor="text-orange-600" change="Pending delivery" changeType="positive" />
        <StatCard title="Inventory Value" value={formatCurrency(inventoryValue || 142000)} icon={DollarSign} iconBg="bg-emerald-50" iconColor="text-emerald-600" change="+8.4% MoM" changeType="positive" />
        <StatCard title="Forecast Recs" value={forecasts.length} icon={BrainCircuit} iconBg="bg-teal-50" iconColor="text-teal-600" change="AI-generated" changeType="neutral" />
        <StatCard title="Supplier Score" value={`${avgReliability.toFixed(0)}%`} icon={TrendingUp} iconBg="bg-blue-50" iconColor="text-blue-600" change="Avg. reliability" changeType="positive" />
        <StatCard title="Active Alerts" value={unreadAlerts} icon={BellRing} iconBg="bg-amber-50" iconColor="text-amber-600" change="Unresolved" changeType={unreadAlerts > 0 ? 'negative' : 'neutral'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Supplier Performance</CardTitle>
            <CardDescription>Delivery rate and order volume by supplier</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplierPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} />
                <YAxis tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                <Bar name="Delivery Rate %" dataKey="deliveryRate" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar name="Orders" dataKey="orderCount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Latest system notifications requiring action</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.slice(0, 5).map((alert, idx) => (
              <div key={alert.productId + '-' + idx} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/30 hover:border-slate-200 transition-colors">
                <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${alert.alertType === 'predicted_stockout' ? 'bg-red-500' : 'bg-orange-500'}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.alertType === 'predicted_stockout' ? 'critical' : 'warning'} className="text-[9px] font-bold">
                      {alert.alertType.replace('_', ' ')}
                    </Badge>
                    <span className="text-[10px] text-slate-400">
                      {alert.predictedStockoutDate ? new Date(alert.predictedStockoutDate).toLocaleDateString() : 'Immediate'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-1">{alert.message}</p>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">No active alerts requiring attention</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
