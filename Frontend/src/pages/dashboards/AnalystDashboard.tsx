import { useInventoryStore } from '@/store';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3, Gauge, Archive, Layers } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function AnalystDashboard() {
  const forecasts = useInventoryStore((s) => s.forecasts);
  const analyticsSummary = useInventoryStore((s) => s.analyticsSummary);

  const avgAccuracy = forecasts.reduce((sum, f) => sum + f.accuracy, 0) / (forecasts.length || 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Analyst Dashboard</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Business intelligence and demand forecasting insights</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Revenue Trend" value={formatCurrency(analyticsSummary.totalRevenue)} icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" change="+12.3% MoM" changeType="positive" />
        <StatCard title="Total Orders" value={formatNumber(analyticsSummary.totalOrders)} icon={BarChart3} iconBg="bg-blue-50" iconColor="text-blue-600" change="+340 this month" changeType="positive" />
        <StatCard title="Forecast Accuracy" value={`${avgAccuracy.toFixed(1)}%`} icon={Gauge} iconBg="bg-teal-50" iconColor="text-teal-600" change="Model confidence" changeType="positive" />
        <StatCard title="Dead Stock" value={formatCurrency(analyticsSummary.deadStockValue)} icon={Archive} iconBg="bg-red-50" iconColor="text-red-600" change="Capital at risk" changeType="negative" />
        <StatCard title="Categories" value={analyticsSummary.categoryPerformance.length} icon={Layers} iconBg="bg-purple-50" iconColor="text-purple-600" change="Tracked" changeType="neutral" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Profit Trend</CardTitle>
            <CardDescription>Monthly financial performance over 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsSummary.revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevAnalyst" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfitAnalyst" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} />
                <YAxis tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                <Area name="Revenue" type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevAnalyst)" />
                <Area name="Profit" type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorProfitAnalyst)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>Revenue by product category</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsSummary.categoryPerformance.slice(0, 6)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} />
                <YAxis type="category" dataKey="category" tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Bar name="Revenue" dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Model Summary */}
      <Card>
        <CardHeader>
          <CardTitle>AI Model Health Summary</CardTitle>
          <CardDescription>Performance metrics across all forecasting models</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forecasts.map((f) => (
              <div key={f.productId} className="rounded-lg border border-slate-100 p-4 hover:border-emerald-200 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{f.name}</span>
                  <Badge variant={f.status === 'growth' ? 'success' : f.status === 'decline' ? 'warning' : f.status === 'high_volatility' ? 'critical' : 'default'} className="text-[9px] capitalize">
                    {f.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-extrabold text-emerald-600">{f.accuracy}%</p>
                    <p className="text-[9px] text-slate-400 font-medium">Accuracy</p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-slate-700">{f.modelHealth.rmse}</p>
                    <p className="text-[9px] text-slate-400 font-medium">RMSE</p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-slate-700">{f.riskScore}%</p>
                    <p className="text-[9px] text-slate-400 font-medium">Risk</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
