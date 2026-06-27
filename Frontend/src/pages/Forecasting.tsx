import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mlService } from '@/services/mlService';
import { productService } from '@/services/productService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { BrainCircuit, TrendingDown, Package, AlertTriangle, Calendar, RefreshCw, Clock } from 'lucide-react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export default function Forecasting() {
  const [selectedProductId, setSelectedProductId] = React.useState('');
  const queryClient = useQueryClient();

  // Load product list for the selector
  const { data: productsPage } = useQuery({
    queryKey: ['products-forecast-list'],
    queryFn: () => productService.getAll({ size: 100 }),
    staleTime: STALE_TIME,
  });

  const products = productsPage?.content ?? [];

  // Set default product once loaded
  React.useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  // Fetch forecast for selected product — cached for 5 minutes
  const { data: forecast, isLoading: forecastLoading, isError: forecastError, dataUpdatedAt } = useQuery({
    queryKey: ['forecast', selectedProductId],
    queryFn: () => mlService.getForecast(selectedProductId),
    enabled: !!selectedProductId,
    staleTime: STALE_TIME,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch low-stock alerts — cached for 5 minutes
  const { data: lowStockData } = useQuery({
    queryKey: ['low-stock-alerts-forecast'],
    queryFn: () => mlService.getLowStockAlerts(20),
    staleTime: STALE_TIME,
    gcTime: 10 * 60 * 1000,
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['forecast', selectedProductId] });
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
  };

  // Build chart data from forecast points
  const chartData = React.useMemo(() => {
    if (!forecast?.forecast) return [];
    return forecast.forecast.map((pt) => ({
      date: pt.date,
      predicted: Math.round(pt.yhat),
      lower: Math.round(pt.yhat_lower),
      upper: Math.round(pt.yhat_upper),
    }));
  }, [forecast]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const cacheAge = dataUpdatedAt
    ? Math.floor((Date.now() - dataUpdatedAt) / 60000)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-emerald-600" />
            AI Demand Forecasting
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Prophet-based 30-day demand predictions with confidence intervals
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedProductId}
            onChange={(e) => handleProductChange(e.target.value)}
            options={products.map((p) => ({ value: p.id, label: p.name }))}
            className="w-64 text-xs"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={forecastLoading || !selectedProductId}
            className="gap-1.5 shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${forecastLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Cache status banner */}
      {forecast && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          {cacheAge === 0
            ? 'Forecast loaded just now'
            : cacheAge !== null
            ? `Forecast cached ${cacheAge} min ago — click Refresh to re-run model`
            : 'Forecast loaded'}
          <span className="text-slate-200">·</span>
          <span className="text-emerald-600 font-semibold">Results cached for 5 min to avoid re-running the model</span>
        </div>
      )}

      {forecastError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 font-medium">
          ML service is offline. Forecasting requires the FastAPI service running on port 8000.
        </div>
      )}

      {/* Forecast summary cards */}
      {forecast && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Product
                </span>
                <span className="text-sm font-bold text-slate-800 line-clamp-2">
                  {forecast.productName ?? selectedProduct?.name ?? '—'}
                </span>
                {forecast.category && (
                  <span className="text-[11px] text-slate-400">{forecast.category}</span>
                )}
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Package className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Recommended Order
                </span>
                <span className="text-2xl font-extrabold text-emerald-600 font-mono">
                  {forecast.recommendedOrderQty ?? '—'}
                </span>
                <span className="text-[11px] text-slate-400">units</span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <BrainCircuit className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Predicted Stockout
                </span>
                <span
                  className={`text-sm font-bold ${
                    forecast.predictedStockoutDate ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {forecast.predictedStockoutDate
                    ? new Date(forecast.predictedStockoutDate).toLocaleDateString()
                    : 'No stockout risk'}
                </span>
              </div>
              <div
                className={`p-3 rounded-xl ${
                  forecast.predictedStockoutDate ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                <TrendingDown className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Forecast Horizon
                </span>
                <span className="text-2xl font-extrabold text-slate-800 font-mono">
                  {forecast.forecast.length}
                </span>
                <span className="text-[11px] text-slate-400">days ahead</span>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Calendar className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Forecast Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>30-Day Demand Forecast</CardTitle>
            <CardDescription>
              Prophet prediction with 95% confidence interval
              {selectedProduct ? ` — ${selectedProduct.name}` : ''}
            </CardDescription>
          </div>
          {forecast && (
            <Badge variant="success" className="text-[10px] font-bold gap-1">
              <BrainCircuit className="h-3 w-3" />
              PROPHET MODEL
            </Badge>
          )}
        </CardHeader>
        <CardContent className="h-80">
          {forecastLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400 text-sm">
              <BrainCircuit className="h-8 w-8 animate-pulse text-emerald-400" />
              <span>Running Prophet model… this may take a moment</span>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              {selectedProductId ? 'No forecast data available for this product.' : 'Select a product to view forecast'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                  interval="preserveStartEnd"
                />
                <YAxis tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '8px' }}
                />
                {/* Confidence band */}
                <Area
                  name="Confidence Band (95%)"
                  type="monotone"
                  dataKey="upper"
                  stroke="none"
                  fill="#10b981"
                  fillOpacity={0.08}
                />
                <Area
                  name=""
                  type="monotone"
                  dataKey="lower"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                />
                <Line
                  name="Predicted Demand (Prophet)"
                  type="monotone"
                  dataKey="predicted"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alerts from ML */}
      {(lowStockData?.alerts?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
              <CardTitle>Predicted Low Stock Alerts</CardTitle>
            </div>
            <CardDescription>Products at risk of stockout within the forecast horizon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(lowStockData?.alerts ?? []).slice(0, 8).map((alert, i) => (
                <div
                  key={`${alert.productId}-${i}`}
                  className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {alert.productName ?? alert.productId}
                    </p>
                    {alert.category && (
                      <p className="text-[10px] text-slate-400">{alert.category}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="text-xs font-mono font-bold text-slate-700">
                        {alert.currentStock} units
                      </p>
                      {alert.predictedStockoutDate && (
                        <p className="text-[10px] text-red-500 font-semibold">
                          Stockout: {new Date(alert.predictedStockoutDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={alert.alertType === 'predicted_stockout' ? 'critical' : 'warning'}
                      className="text-[10px] font-bold capitalize"
                    >
                      {alert.alertType.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
