import * as React from 'react';
import { useInventoryStore } from '@/store';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import type { Alert } from '@/types';

export default function Alerts() {
  const alerts = useInventoryStore((s) => s.alerts);
  const updateAlertStatus = useInventoryStore((s) => s.updateAlertStatus);
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [severityFilter, setSeverityFilter] = React.useState('all');

  const filtered = alerts.filter((a) => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Alert Center</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">{alerts.filter(a => a.status === 'unread').length} unread alerts requiring attention</p>
      </div>

      <DataTable<Alert>
        data={filtered}
        searchPlaceholder="Search alerts..."
        searchKey={(item) => `${item.message} ${item.productName || ''}`}
        pageSize={10}
        filterSlot={
          <>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={[{ value: 'all', label: 'All Types' }, { value: 'low_stock', label: 'Low Stock' }, { value: 'overstock', label: 'Overstock' }, { value: 'anomaly', label: 'Anomaly' }, { value: 'forecast_drift', label: 'Forecast Drift' }, { value: 'expiry', label: 'Expiry' }]} className="w-40 text-xs" />
            <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} options={[{ value: 'all', label: 'All Severity' }, { value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} className="w-36 text-xs" />
          </>
        }
        columns={[
          {
            key: 'severity', header: 'Severity',
            render: (item) => (
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full shrink-0 ${item.severity === 'critical' ? 'bg-red-500 animate-pulse' : item.severity === 'high' ? 'bg-orange-500' : item.severity === 'medium' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                <Badge variant={item.severity === 'critical' ? 'critical' : item.severity === 'high' ? 'orange' : item.severity === 'medium' ? 'warning' : 'secondary'} className="text-[10px] font-bold capitalize">
                  {item.severity}
                </Badge>
              </div>
            ),
          },
          {
            key: 'type', header: 'Type',
            render: (item) => <span className="text-xs font-medium text-slate-600 capitalize">{item.type.replace('_', ' ')}</span>,
          },
          {
            key: 'message', header: 'Message', className: 'min-w-[300px]',
            render: (item) => <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{item.message}</p>,
          },
          {
            key: 'status', header: 'Status',
            render: (item) => <Badge variant={item.status === 'resolved' ? 'success' : item.status === 'investigating' ? 'info' : item.status === 'read' ? 'secondary' : 'warning'} className="text-[10px] font-bold capitalize">{item.status}</Badge>,
          },
          {
            key: 'timestamp', header: 'Time',
            render: (item) => <span className="text-[11px] text-slate-400 whitespace-nowrap">{new Date(item.timestamp).toLocaleString()}</span>,
          },
          {
            key: 'actions', header: '',
            render: (item) => item.status !== 'resolved' ? (
              <Button size="sm" variant="ghost" className="text-[11px] text-emerald-600 hover:text-emerald-700" onClick={() => updateAlertStatus(item.id, 'resolved', 'Resolved by user')}>
                Resolve
              </Button>
            ) : null,
          },
        ]}
      />
    </div>
  );
}
