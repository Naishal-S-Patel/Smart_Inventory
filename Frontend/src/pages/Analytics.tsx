import { useInventoryStore } from '@/store';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DollarSign, Package, Archive, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899', '#f59e0b', '#64748b', '#14b8a6', '#6366f1'];

export default function Analytics() {
  const analyticsSummary = useInventoryStore((s) => s.analyticsSummary);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Analytics</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Comprehensive business intelligence and performance metrics</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={formatCurrency(analyticsSummary.totalRevenue)} icon={DollarSign} iconBg="bg-emerald-50" iconColor="text-emerald-600" change="+12.3% MoM" changeType="positive" />
        <StatCard title="Inventory Turnover" value={`${analyticsSummary.turnoverRatio}x`} icon={RefreshCw} iconBg="bg-blue-50" iconColor="text-blue-600" change="Healthy ratio" changeType="positive" />
        <StatCard title="Dead Stock Value" value={formatCurrency(analyticsSummary.deadStockValue)} icon={Archive} iconBg="bg-red-50" iconColor="text-red-600" change="Capital at risk" changeType="negative" />
        <StatCard title="Total Orders" value={formatNumber(analyticsSummary.totalOrders)} icon={Package} iconBg="bg-purple-50" iconColor="text-purple-600" change="+340 this month" changeType="positive" />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly sales, profit, and AI forecast comparison</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsSummary.revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} />
              <YAxis tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
              <Area name="Revenue" type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" />
              <Area name="Profit" type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={2} fillOpacity={0} />
              <Area name="Forecast" type="monotone" dataKey="forecast" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1.5} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Category Analysis</CardTitle>
            <CardDescription>Revenue and growth by product category</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsSummary.categoryPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 500 }} angle={-30} textAnchor="end" height={50} />
                <YAxis tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Warehouse Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Warehouse Comparison</CardTitle>
            <CardDescription>Stock distribution across logistics hubs</CardDescription>
          </CardHeader>
          <CardContent className="h-72 flex flex-col items-center justify-center">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analyticsSummary.warehouseDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {analyticsSummary.warehouseDistribution.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-[10px] font-medium text-slate-500 w-full">
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

      {/* Top Products & Supplier Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Categories by Growth</CardTitle>
            <CardDescription>Year-over-year growth rate by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsSummary.categoryPerformance
                .sort((a, b) => b.growth - a.growth)
                .slice(0, 6)
                .map((cat, i) => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-5">{i + 1}.</span>
                      <span className="text-xs font-semibold text-slate-700">{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{formatCurrency(cat.revenue)}</span>
                      <span className={`text-xs font-bold ${cat.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {cat.growth >= 0 ? '+' : ''}{cat.growth}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supplier Performance</CardTitle>
            <CardDescription>Delivery rate and order volume metrics</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsSummary.supplierPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 500 }} />
                <YAxis tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 600 }} />
                <Bar name="Delivery %" dataKey="deliveryRate" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar name="Orders" dataKey="orderCount" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
