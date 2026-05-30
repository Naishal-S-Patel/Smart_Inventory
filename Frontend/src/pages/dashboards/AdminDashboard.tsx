import { useInventoryStore } from '@/store';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Warehouse, Users, FileSpreadsheet, DollarSign, BrainCircuit, Activity, ArrowRightLeft } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4'];

export default function AdminDashboard() {
  const products = useInventoryStore((s) => s.products);
  const warehouses = useInventoryStore((s) => s.warehouses);
  const purchaseOrders = useInventoryStore((s) => s.purchaseOrders);
  const transactions = useInventoryStore((s) => s.transactions);
  const forecasts = useInventoryStore((s) => s.forecasts);
  const analyticsSummary = useInventoryStore((s) => s.analyticsSummary);

  const activePOs = purchaseOrders.filter((po) => po.status !== 'Received').length;
  const inventoryValue = products.reduce((sum, p) => sum + p.currentStock * p.cost, 0);
  const avgAccuracy = forecasts.reduce((sum, f) => sum + f.accuracy, 0) / (forecasts.length || 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground font-medium mt-1">Complete platform overview and system health</p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Products" value={formatNumber(products.length)} icon={Package} iconBg="bg-emerald-50" iconColor="text-emerald-600" change="+12 this month" changeType="positive" />
        <StatCard title="Warehouses" value={warehouses.length} icon={Warehouse} iconBg="bg-blue-50" iconColor="text-blue-600" change="All operational" changeType="neutral" />
        <StatCard title="Active Users" value="24" icon={Users} iconBg="bg-purple-50" iconColor="text-purple-600" change="3 online now" changeType="neutral" />
        <StatCard title="Active POs" value={activePOs} icon={FileSpreadsheet} iconBg="bg-orange-50" iconColor="text-orange-600" change="1 arriving today" changeType="positive" />
        <StatCard title="Inventory Value" value={formatCurrency(inventoryValue)} icon={DollarSign} iconBg="bg-emerald-50" iconColor="text-emerald-600" change="+8.4% MoM" changeType="positive" />
        <StatCard title="Forecast Health" value={`${avgAccuracy.toFixed(1)}%`} icon={BrainCircuit} iconBg="bg-teal-50" iconColor="text-teal-600" change="Prophet + XGBoost" changeType="neutral" />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Revenue & AI Forecast</CardTitle>
              <CardDescription>Monthly revenue vs machine learning predictions</CardDescription>
            </div>
            <Badge variant="success" className="text-[10px] font-bold">MODEL ACTIVE</Badge>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsSummary.revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSalesAdmin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorForecastAdmin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 500 }} />
                <YAxis tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 500 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--foreground)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }} labelStyle={{ color: 'var(--foreground)' }} itemStyle={{ color: 'var(--foreground)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '8px' }} />
                <Area name="Actual Sales" type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSalesAdmin)" />
                <Area name="AI Forecast" type="monotone" dataKey="forecast" stroke="#06b6d4" strokeDasharray="5 5" strokeWidth={2} fillOpacity={1} fill="url(#colorForecastAdmin)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Warehouse Distribution</CardTitle>
            <CardDescription>Stock allocation across logistics hubs</CardDescription>
          </CardHeader>
          <CardContent className="h-56 flex flex-col justify-center">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analyticsSummary.warehouseDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {analyticsSummary.warehouseDistribution.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-1 text-[10px] font-medium text-muted-foreground">
              {analyticsSummary.warehouseDistribution.map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions & AI Suggestions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Live transactions and stock movements</CardDescription>
            </div>
            <Badge variant="info" className="text-[10px] font-bold">
              <Activity className="h-3 w-3 mr-1 animate-pulse-slow" /> LIVE
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-5">Time</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Qty</th>
                    <th className="py-3 px-4">Route</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {transactions.slice(0, 5).map((txn) => (
                    <tr key={txn.id} className="hover:bg-muted/40 font-medium text-foreground">
                      <td className="py-3 px-5 text-[11px] text-muted-foreground font-mono">
                        {new Date(txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={txn.type === 'inbound' ? 'success' : txn.type === 'outbound' ? 'info' : 'secondary'} className="text-[9px] font-bold uppercase">
                          {txn.type === 'transfer' ? <><ArrowRightLeft className="h-2.5 w-2.5 mr-0.5" />Transfer</> : txn.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 truncate max-w-[160px]">{txn.productName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground">{txn.quantity}</td>
                      <td className="py-3 px-4 text-muted-foreground text-[11px] truncate max-w-[180px]">{txn.source} → {txn.destination}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border dark:border-emerald-500/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle>AI Restock Suggestions</CardTitle>
            </div>
            <CardDescription>ML-powered reorder recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {forecasts.slice(0, 3).map((rec) => {
              const prod = products.find(s => s.id === rec.productId);
              return (
                <div key={rec.productId} className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-2 hover:border-emerald-500/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground truncate max-w-[160px]">{rec.name}</span>
                    <Badge variant="default" className="text-[9px]">{rec.accuracy}%</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{rec.recommendation}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Suggested: {rec.recommendedRestockQty} units</span>
                    <span className="text-[10px] text-muted-foreground/80">Stock: {prod?.currentStock || 0}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
