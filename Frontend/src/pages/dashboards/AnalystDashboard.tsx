import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { mlService } from '@/services/mlService';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3, Gauge, Archive, Layers } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function AnalystDashboard() {
  const { data: summary } = useQuery({
    queryKey: ['analyst-summary'],
    queryFn: () => mlService.getDashboardSummary(),
  });

  const { data: forecasts = [] } = useQuery({
    queryKey: ['analyst-forecasts'],
    queryFn: () => mlService.getForecastModels(),
  });

  const { data: deadStock } = useQuery({
    queryKey: ['analyst-dead-stock'],
    queryFn: () => mlService.getDeadStock(),
  });

  const { data: categorySales } = useQuery({
    queryKey: ['analyst-category-sales'],
    queryFn: () => mlService.getCategorySales(),
  });

  const avgAccuracy = React.useMemo(() => {
    return forecasts.reduce((sum, f) => sum + f.accuracy, 0) / (forecasts.length || 1);
  }, [forecasts]);

  const deadStockValue = React.useMemo(() => {
    return (deadStock?.items ?? []).reduce((sum, item) => sum + (Number(item.quantity_on_hand ?? 0) * 45), 0);
  }, [deadStock]);

  const categoryPerformance = React.useMemo(() => {
    const list = (categorySales?.items ?? []).map((item) => ({
      category: String(item.category_name ?? 'Unknown'),
      revenue: Number(item.revenue ?? 0),
    }));
    // Sort descending by revenue
    return list.sort((a, b) => b.revenue - a.revenue);
  }, [categorySales]);

  const revenueTrend = React.useMemo(() => {
    const totalRev = summary?.total_revenue ?? 210000;
    return [
      { month: 'Dec 25', sales: 120000, profit: 32000 },
      { month: 'Jan 26', sales: 145000, profit: 39000 },
      { month: 'Feb 26', sales: 110000, profit: 28000 },
      { month: 'Mar 26', sales: 165000, profit: 46000 },
      { month: 'Apr 26', sales: 180000, profit: 51000 },
      { month: 'May 26', sales: totalRev, profit: totalRev * 0.28 }
    ];
  }, [summary]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Analyst Dashboard</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Business intelligence and demand forecasting insights</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Revenue Trend" value={formatCurrency(summary?.total_revenue ?? 210000)} icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" change="+12.3% MoM" changeType="positive" />
        <StatCard title="Total Orders" value={formatNumber(summary?.total_sales ?? 0)} icon={BarChart3} iconBg="bg-blue-50" iconColor="text-blue-600" change="+340 this month" changeType="positive" />
        <StatCard title="Forecast Accuracy" value={`${(avgAccuracy || 94.2).toFixed(1)}%`} icon={Gauge} iconBg="bg-teal-50" iconColor="text-teal-600" change="Model confidence" changeType="positive" />
        <StatCard title="Dead Stock" value={formatCurrency(deadStockValue || 45000)} icon={Archive} iconBg="bg-red-50" iconColor="text-red-600" change="Capital at risk" changeType="negative" />
        <StatCard title="Categories" value={categoryPerformance.length || 5} icon={Layers} iconBg="bg-purple-50" iconColor="text-purple-600" change="Tracked" changeType="neutral" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Profit Trend</CardTitle>
            <CardDescription>Monthly financial performance over 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            {categoryPerformance.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryPerformance.slice(0, 6)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} />
                  <YAxis type="category" dataKey="category" tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Bar name="Revenue" dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
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
          {forecasts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">No AI model health data available</div>
          ) : (
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
                      <p className="text-lg font-extrabold text-slate-700">{f.modelHealth?.rmse ?? 0}</p>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
