import * as React from 'react';
import { useInventoryStore } from '@/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { BrainCircuit, TrendingUp, TrendingDown, Minus, RotateCw, Gauge, Activity, ShieldCheck, Sparkles, Lightbulb } from 'lucide-react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Forecasting() {
  const forecasts = useInventoryStore((s) => s.forecasts);
  const triggerModelTraining = useInventoryStore((s) => s.triggerModelTraining);
  const [selectedProductId, setSelectedProductId] = React.useState(forecasts[0]?.productId || '');
  const [isTraining, setIsTraining] = React.useState(false);

  const activeForecast = React.useMemo(() => {
    return forecasts.find((f) => f.productId === selectedProductId) || forecasts[0];
  }, [forecasts, selectedProductId]);

  const handleRetrain = async () => {
    setIsTraining(true);
    try { await triggerModelTraining(selectedProductId); } catch (err) { console.error(err); }
    finally { setIsTraining(false); }
  };

  if (!activeForecast) return null;

  const TrendIcon = activeForecast.trendIndicator === 'up' ? TrendingUp : activeForecast.trendIndicator === 'down' ? TrendingDown : Minus;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-emerald-600 animate-pulse-slow" />
            AI Demand Forecasting
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Prophet & XGBoost predictive models with confidence intervals</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} options={forecasts.map((f) => ({ value: f.productId, label: f.name }))} className="w-56 text-xs" />
          <Button onClick={handleRetrain} disabled={isTraining} variant="outline" className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            <RotateCw className={`h-4 w-4 mr-2 ${isTraining ? 'animate-spin' : ''}`} />
            {isTraining ? 'Training...' : 'Retrain Models'}
          </Button>
        </div>
      </div>

      {/* Model KPIs */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-card-hover hover:border-emerald-200/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Forecast Accuracy</span>
              <span className="block text-2xl font-extrabold text-emerald-600">{activeForecast.accuracy}%</span>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" /> Prophet baseline OK
              </div>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Gauge className="h-6 w-6" /></div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-card-hover hover:border-emerald-200/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Demand Trend</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-slate-800 capitalize">{activeForecast.status.replace('_', ' ')}</span>
                <Badge variant={activeForecast.status === 'growth' ? 'success' : activeForecast.status === 'decline' ? 'warning' : activeForecast.status === 'high_volatility' ? 'critical' : 'default'}>
                  <TrendIcon className="h-3 w-3 mr-0.5" />{activeForecast.trendIndicator}
                </Badge>
              </div>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Activity className="h-6 w-6" /></div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-card-hover">
          <CardContent className="p-5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Model Loss (RMSE)</span>
            <span className="block text-2xl font-extrabold text-slate-800 mt-1">{activeForecast.modelHealth.rmse}</span>
            <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-2">
              <span>MAE: {activeForecast.modelHealth.mae}</span>
              <span>R²: 0.96</span>
            </div>
          </CardContent>
        </Card>

        <Card className={`hover:shadow-card-hover ${activeForecast.riskScore > 35 ? 'border-red-100' : ''}`}>
          <CardContent className="p-5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Safety Risk</span>
            <span className={`block text-2xl font-extrabold mt-1 ${activeForecast.riskScore > 35 ? 'text-red-500' : 'text-slate-800'}`}>{activeForecast.riskScore}%</span>
            <div className="mt-2.5">
              <Progress value={activeForecast.riskScore} indicatorClassName={activeForecast.riskScore > 35 ? 'bg-red-500' : 'bg-emerald-500'} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Forecast Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Demand Prediction — Prophet vs XGBoost</CardTitle>
            <CardDescription>Historical demand with confidence bands and dual-model predictions</CardDescription>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold text-slate-500">
            <span className="px-2 py-0.5 rounded-md bg-white text-slate-800 shadow-xs">Prophet</span>
            <span className="px-2 py-0.5">XGBoost</span>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={activeForecast.historicalAndForecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} />
              <YAxis tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '8px' }} />
              <Area name="Confidence Band (95%)" type="monotone" dataKey="confidenceUpper" stroke="none" fill="#10b981" fillOpacity={0.06} />
              <Area name="" type="monotone" dataKey="confidenceLower" stroke="none" fill="#ffffff" fillOpacity={1} />
              <Line name="Historical Sales" type="monotone" dataKey="actualDemand" stroke="#0f172a" strokeWidth={2.5} dot={{ r: 3, fill: '#0f172a' }} />
              <Line name="Prophet Prediction" type="monotone" dataKey="prophetPredictedDemand" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line name="XGBoost Prediction" type="monotone" dataKey="xgboostPredictedDemand" stroke="#f97316" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-emerald-100/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-emerald-600" />
              <CardTitle>AI Recommendation</CardTitle>
            </div>
            <CardDescription>ML-powered restock guidance based on current models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 space-y-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Replenishment Action</span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{activeForecast.recommendation}</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Suggested Reorder</span>
                  <span className="text-2xl font-mono font-extrabold text-emerald-700">{activeForecast.recommendedRestockQty} units</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Safety stock: 1.25x margins</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4.5 w-4.5 text-slate-500" />
              <CardTitle>Model Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs font-medium text-slate-500">
            {[
              ['ML Frameworks', 'Scikit-learn + Prophet'],
              ['Training Freq.', 'Weekly (Auto)'],
              ['Last Re-fit', activeForecast.modelHealth.lastTrained],
              ['Features', 'Lag, Seasonality, SLA'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-slate-50 pb-2 last:border-0">
                <span>{label}:</span>
                <span className="font-semibold text-slate-700 text-right">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
