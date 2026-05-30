import { useInventoryStore } from '@/store';
import { formatCurrency } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileSpreadsheet, DollarSign, BrainCircuit, TrendingUp, BellRing } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ManagerDashboard() {
  const products = useInventoryStore((s) => s.products);
  const purchaseOrders = useInventoryStore((s) => s.purchaseOrders);
  const alerts = useInventoryStore((s) => s.alerts);
  const forecasts = useInventoryStore((s) => s.forecasts);
  const analyticsSummary = useInventoryStore((s) => s.analyticsSummary);

  const lowStockCount = products.filter((p) => p.status === 'Low Stock' || p.status === 'Out of Stock').length;
  const activePOs = purchaseOrders.filter((po) => po.status !== 'Received').length;
  const inventoryValue = products.reduce((sum, p) => sum + p.currentStock * p.cost, 0);
  const unreadAlerts = alerts.filter((a) => a.status === 'unread').length;
  const avgReliability = analyticsSummary.supplierPerformance.reduce((sum, s) => sum + s.deliveryRate, 0) / analyticsSummary.supplierPerformance.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Manager Dashboard</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Business operations and procurement overview</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Low Stock Items" value={lowStockCount} icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600" change="Requires attention" changeType="negative" />
        <StatCard title="Active POs" value={activePOs} icon={FileSpreadsheet} iconBg="bg-orange-50" iconColor="text-orange-600" change="1 arriving today" changeType="positive" />
        <StatCard title="Inventory Value" value={formatCurrency(inventoryValue)} icon={DollarSign} iconBg="bg-emerald-50" iconColor="text-emerald-600" change="+8.4% MoM" changeType="positive" />
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
              <BarChart data={analyticsSummary.supplierPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/30 hover:border-slate-200 transition-colors">
                <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'high' ? 'bg-orange-500' : alert.severity === 'medium' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.severity === 'critical' ? 'critical' : alert.severity === 'high' ? 'orange' : 'warning'} className="text-[9px] font-bold">
                      {alert.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-[10px] text-slate-400">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-1">{alert.message}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
