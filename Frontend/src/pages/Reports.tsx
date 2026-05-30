import { useInventoryStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Table, FileSpreadsheet, Download, Loader2, Clock } from 'lucide-react';

const FORMAT_ICONS = { PDF: FileText, CSV: Table, XLSX: FileSpreadsheet };
const CATEGORY_COLORS: Record<string, 'success' | 'info' | 'purple' | 'orange'> = {
  demand: 'success', inventory: 'info', financial: 'purple', performance: 'orange',
};

export default function Reports() {
  const reports = useInventoryStore((s) => s.reports);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Reports</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Generated analytical reports and exports</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const FormatIcon = FORMAT_ICONS[report.format] || FileText;
          return (
            <Card key={report.id} className="hover:shadow-card-hover hover:border-emerald-200/60 transition-all">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <Badge variant={CATEGORY_COLORS[report.category] || 'secondary'} className="text-[10px] font-bold capitalize">
                    {report.category}
                  </Badge>
                  <Badge variant={report.status === 'ready' ? 'success' : report.status === 'generating' ? 'warning' : 'critical'} className="text-[10px] font-bold capitalize">
                    {report.status === 'generating' && <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />}
                    {report.status}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800 leading-snug">{report.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{report.description}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><FormatIcon className="h-3 w-3" />{report.format}</span>
                    {report.size && <span>{report.size}</span>}
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(report.generatedAt).toLocaleDateString()}
                  </span>
                </div>

                <Button variant="outline" size="sm" className="w-full text-xs" disabled={report.status !== 'ready'}>
                  <Download className="h-3.5 w-3.5 mr-2" />
                  Download {report.format}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
