import { useQuery } from '@tanstack/react-query';
import { mlService } from '@/services/mlService';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DollarSign, Package, Archive, TrendingUp, Lightbulb } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899', '#f59e0b', '#64748b'];

export default function Analytics() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['ml-dashboard-summary'],
    queryFn: () => mlService.getDashboardSummary(),
    refetchInterval: 300_000, // refresh every 5 min
  });

  const { data: topProducts } = useQuery({
    queryKey: ['ml-top-products'],
    queryFn: () => mlService.getTopProducts(),
  });

  const { data: categorySales } = useQuery({
    queryKey: ['ml-category-sales'],
    queryFn: () => mlService.getCategorySales(),
  });

  const { data: warehousePerf } = useQuery({
    queryKey: ['ml-warehouse-performance'],
    queryFn: () => mlService.getWarehousePerformance(),
  });

  const { data: deadStock } = useQuery({
    queryKey: ['ml-dead-stock'],
    queryFn: () => mlService.getDeadStock(),
  });

  const { data: insights } = useQuery({
    queryKey: ['ml-insights'],
    queryFn: () => mlService.getInsights(),
  });

  // Build chart-friendly arrays
  const topProductsChart = (topProducts?.items ?? []).slice(0, 10).map((item) => ({
    name: String((item as Record<string, unknown>).product_name ?? 'Unknown'),
    revenue: Number((item as Record<string, unknown>).revenue ?? 0),
  }));

  const categoryChart = (categorySales?.items ?? []).map((item) => ({
    name: String((item as Record<string, unknown>).category_name ?? 'Unknown'),
    revenue: Number((item as Record<string, unknown>).revenue ?? 0),
  }));

  const warehouseChart = (warehousePerf?.items ?? []).map((item) => ({
    name: String((item as Record<string, unknown>).warehouse_name ?? 'Unknown'),
    revenue: Number((item as Record<string, unknown>).revenue ?? 0),
  }));

  const deadStockItems = (deadStock?.items ?? []).slice(0, 8);

  const mlOffline = !summary && !summaryLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Analytics</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Real-time business intelligence powered by the ML service
        </p>
      </div>

      {mlOffline && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 font-medium">
          ML service is offline. Analytics requires the FastAPI service running on port 8000.
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={summary ? formatCurrency(summary.total_revenue) : '—'}
          icon={DollarSign}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          change={summaryLoading ? 'Loading...' : 'From completed orders'}
          changeType="positive"
        />
        <StatCard
          title="Total Sales"
          value={summary ? formatNumber(summary.total_sales) : '—'}
          icon={TrendingUp}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          change="Confirmed + completed"
          changeType="positive"
        />
        <StatCard
          title="Low Stock Items"
          value={summary ? formatNumber(summary.low_stock_count) : '—'}
          icon={Archive}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          change={summary?.predicted_stockouts ? `${summary.predicted_stockouts} stockout risks` : ''}
          changeType="negative"
        />
        <StatCard
          title="Pending POs"
          value={summary ? formatNumber(summary.pending_purchase_orders) : '—'}
          icon={Package}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          change="Awaiting approval/receipt"
          changeType="neutral"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Revenue</CardTitle>
            <CardDescription>Best performing products from completed sales orders</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {topProductsChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                {summaryLoading ? 'Loading...' : 'No data available'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProductsChart}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                    width={120}
                  />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
            <CardDescription>Sales distribution across product categories</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {categoryChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                {summaryLoading ? 'Loading...' : 'No data available'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChart} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 500 }}
                    angle={-35}
                    textAnchor="end"
                    height={55}
                  />
                  <YAxis tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {categoryChart.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Warehouse Performance</CardTitle>
            <CardDescription>Revenue contribution per warehouse</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {warehouseChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No data available
              </div>
            ) : (
              <div className="flex items-center gap-6 h-full">
                <ResponsiveContainer width="55%" height="100%">
                  <PieChart>
                    <Pie
                      data={warehouseChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="revenue"
                    >
                      {warehouseChart.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                      contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {warehouseChart.map((wh, i) => (
                    <div key={wh.name} className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-slate-700 truncate">{wh.name}</p>
                        <p className="text-[10px] text-slate-400">{formatCurrency(wh.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dead Stock</CardTitle>
            <CardDescription>Products with no movement — capital at risk</CardDescription>
          </CardHeader>
          <CardContent>
            {deadStockItems.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                No dead stock detected
              </div>
            ) : (
              <div className="space-y-2">
                {deadStockItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        {String((item as Record<string, unknown>).product_name ?? 'Unknown')}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {String((item as Record<string, unknown>).warehouse_name ?? '—')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold font-mono text-slate-700">
                        {Number((item as Record<string, unknown>).quantity_on_hand ?? 0)} units
                      </p>
                      <p className="text-[10px] text-red-500 font-medium">
                        {(item as Record<string, unknown>).days_since_last_sale != null
                          ? `${(item as Record<string, unknown>).days_since_last_sale}d no movement`
                          : 'No movement'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {(insights?.items?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4.5 w-4.5 text-amber-500" />
              <CardTitle>AI Insights</CardTitle>
            </div>
            <CardDescription>
              Auto-generated business intelligence — updated every 15 minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {(insights?.items ?? []).slice(0, 6).map((insight, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800">{insight.title}</p>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        insight.severity === 'high'
                          ? 'bg-red-100 text-red-600'
                          : insight.severity === 'medium'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      {insight.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
