import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mlApi } from '@/lib/apiClient';
import {
  FileText, Table, FileSpreadsheet, Download, Loader2, Clock,
  Brain, TrendingUp, TrendingDown, Minus, Sparkles, AlertTriangle,
  Package, BarChart3, Zap, RefreshCw,
} from 'lucide-react';

const FORMAT_ICONS = { PDF: FileText, CSV: Table, XLSX: FileSpreadsheet };
const CATEGORY_COLORS: Record<string, 'success' | 'info' | 'purple' | 'orange'> = {
  demand: 'success',
  inventory: 'info',
  financial: 'purple',
  performance: 'orange',
};

interface ReportItem {
  id: string;
  title: string;
  description: string;
  category: 'demand' | 'inventory' | 'financial' | 'performance';
  format: 'CSV';
  size: string;
  endpoint: string;
  filename: string;
}

interface ReportInsight {
  headline: string;
  metric: string;
  trend: 'positive' | 'negative' | 'neutral';
}

interface ReportSummary {
  insights: string[];
  report_insights: Record<string, ReportInsight>;
  generated_at: string;
}

const REPORTS_LIST: ReportItem[] = [
  {
    id: 'top-products',
    title: 'Top Products Revenue Report',
    description: 'Detailed analysis of high-performing products based on completed sales order revenue.',
    category: 'financial',
    format: 'CSV',
    size: '12 KB',
    endpoint: '/analytics/top-products',
    filename: 'top_products.csv',
  },
  {
    id: 'category-sales',
    title: 'Category Sales Performance',
    description: 'Revenue distribution, average price, and item volume across all product categories.',
    category: 'performance',
    format: 'CSV',
    size: '8 KB',
    endpoint: '/analytics/category-sales',
    filename: 'category_sales.csv',
  },
  {
    id: 'warehouse-perf',
    title: 'Warehouse Performance Metrics',
    description: 'Total sales contribution, inventory health, and storage utilization by warehouse hub.',
    category: 'performance',
    format: 'CSV',
    size: '9 KB',
    endpoint: '/analytics/warehouse-performance',
    filename: 'warehouse_sales.csv',
  },
  {
    id: 'fast-moving',
    title: 'Fast Moving Products',
    description: 'Identifies inventory lines with the highest turnover rates for storage optimization.',
    category: 'demand',
    format: 'CSV',
    size: '15 KB',
    endpoint: '/analytics/fast-moving',
    filename: 'fast_moving.csv',
  },
  {
    id: 'dead-stock',
    title: 'Dead Stock Analysis',
    description: 'Highlights items with no sales or transaction movement over the last 90 days.',
    category: 'inventory',
    format: 'CSV',
    size: '10 KB',
    endpoint: '/analytics/dead-stock',
    filename: 'dead_stock.csv',
  },
  {
    id: 'anomalies',
    title: 'Inventory Anomaly Report',
    description: 'Log of abnormal stock level drops and unusual transaction patterns flagged by ML.',
    category: 'inventory',
    format: 'CSV',
    size: '14 KB',
    endpoint: '/analytics/anomalies',
    filename: 'anomalies.csv',
  },
];

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === 'positive') return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
  if (trend === 'negative') return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-slate-400" />;
};

export default function Reports() {
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<ReportSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = React.useState(true);
  const [summaryError, setSummaryError] = React.useState(false);

  const fetchSummary = React.useCallback(async () => {
    try {
      setLoadingSummary(true);
      setSummaryError(false);
      const response = await mlApi.get<ReportSummary>('/analytics/report-summary');
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to load report summary:', err);
      setSummaryError(true);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleDownload = async (report: ReportItem) => {
    try {
      setDownloadingId(report.id);
      const response = await mlApi.get(report.endpoint, {
        params: { format: 'csv' },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', report.filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to download report. Ensure the ML service is running on port 8000.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getReportInsight = (reportId: string): ReportInsight | null => {
    if (!summary?.report_insights) return null;
    return (summary.report_insights[reportId] as ReportInsight) || null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Reports</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Generated analytical reports and exports</p>
      </div>

      {/* AI Insights Section */}
      <Card className="border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-100">
                <Brain className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">AI-Powered Insights</h2>
                <p className="text-[10px] text-slate-500">
                  {summary?.generated_at
                    ? `Updated ${new Date(summary.generated_at).toLocaleString()}`
                    : 'Loading analysis...'
                  }
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100/50"
              onClick={fetchSummary}
              disabled={loadingSummary}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loadingSummary ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {loadingSummary && !summary ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-400 mr-2" />
              <span className="text-sm text-slate-500">Analyzing your inventory data...</span>
            </div>
          ) : summaryError ? (
            <div className="flex items-center gap-2 py-4 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Couldn't load insights. Ensure the ML service is running.</span>
            </div>
          ) : summary?.insights && summary.insights.length > 0 ? (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {summary.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/70 border border-slate-100 hover:border-indigo-200/60 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-slate-700 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
              <Sparkles className="h-4 w-4 text-indigo-300" />
              <span>No significant insights detected — analytics are stable.</span>
            </div>
          )}

          {/* Summary Stats */}
          {summary?.report_insights?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-indigo-100/60">
              {[
                { label: 'Total Sales', value: (summary.report_insights.summary as any).total_sales, icon: BarChart3, color: 'text-emerald-600' },
                { label: 'Revenue', value: `₹${((summary.report_insights.summary as any).total_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'text-blue-600' },
                { label: 'Low Stock', value: (summary.report_insights.summary as any).low_stock_count, icon: Package, color: 'text-amber-600' },
                { label: 'Stockouts', value: (summary.report_insights.summary as any).predicted_stockouts, icon: AlertTriangle, color: 'text-red-500' },
                { label: 'Anomalies', value: (summary.report_insights.summary as any).anomaly_count, icon: Zap, color: 'text-orange-500' },
                { label: 'Dead Stock', value: (summary.report_insights.summary as any).dead_stock_count, icon: Package, color: 'text-slate-500' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="text-center p-2 rounded-lg bg-white/60">
                  <Icon className={`h-3.5 w-3.5 mx-auto mb-1 ${color}`} />
                  <p className="text-xs font-bold text-slate-800">{value ?? 0}</p>
                  <p className="text-[9px] text-slate-500 font-medium">{label}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS_LIST.map((report) => {
          const FormatIcon = FORMAT_ICONS[report.format] || FileText;
          const isDownloading = downloadingId === report.id;
          const insight = getReportInsight(report.id);

          return (
            <Card key={report.id} className="hover:shadow-card-hover hover:border-emerald-200/60 transition-all">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <Badge variant={CATEGORY_COLORS[report.category] || 'secondary'} className="text-[10px] font-bold capitalize">
                    {report.category}
                  </Badge>
                  <Badge variant="success" className="text-[10px] font-bold capitalize">
                    Ready
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800 leading-snug">{report.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{report.description}</p>
                </div>

                {/* Per-report AI insight */}
                {insight && (
                  <div className="p-2.5 rounded-lg bg-gradient-to-r from-indigo-50/60 to-purple-50/40 border border-indigo-100/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendIcon trend={insight.trend} />
                      <span className="text-[11px] font-semibold text-slate-700">{insight.headline}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">{insight.metric}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <FormatIcon className="h-3 w-3" />
                      {report.format}
                    </span>
                    {report.size && <span>{report.size}</span>}
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Live Data
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => handleDownload(report)}
                  disabled={downloadingId !== null}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 mr-2" />
                      Download {report.format}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
