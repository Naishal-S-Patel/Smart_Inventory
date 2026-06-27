import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogService, AuditLogDTO } from '@/services/auditLogService';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ROLE_CONFIG } from '@/config/permissions';
import { Select } from '@/components/ui/select';
import { ScrollText } from 'lucide-react';

export default function AuditLogs() {
  const { data: auditLogs = [], isLoading, isError } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditLogService.getAll(),
    staleTime: 2 * 60 * 1000,
  });

  const [actionFilter, setActionFilter] = React.useState('all');

  const filtered = actionFilter === 'all'
    ? auditLogs
    : auditLogs.filter((l) => l.action === actionFilter);

  const actionColor = (action: string): 'success' | 'info' | 'warning' | 'critical' | 'secondary' | 'purple' | 'orange' => {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'critical';
      case 'APPROVE': return 'purple';
      case 'LOGIN': case 'LOGOUT': return 'secondary';
      case 'EXPORT': case 'IMPORT': return 'orange';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-slate-100">
          <ScrollText className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Audit Logs</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Complete activity history across the platform</p>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">
          Failed to load audit logs. Make sure the backend is running on port 8080.
        </div>
      )}

      <DataTable<AuditLogDTO>
        data={filtered}
        isLoading={isLoading}
        searchPlaceholder="Search by user, action, or resource..."
        searchKey={(item) => `${item.userName} ${item.action} ${item.resource} ${item.details}`}
        pageSize={15}
        filterSlot={
          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Actions' },
              { value: 'CREATE', label: 'Create' },
              { value: 'UPDATE', label: 'Update' },
              { value: 'DELETE', label: 'Delete' },
              { value: 'APPROVE', label: 'Approve' },
              { value: 'LOGIN', label: 'Login' },
              { value: 'EXPORT', label: 'Export' },
              { value: 'IMPORT', label: 'Import' }
            ]}
            className="w-36 text-xs"
          />
        }
        columns={[
          {
            key: 'timestamp', header: 'Time',
            render: (item) => (
              <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                {new Date(item.timestamp).toLocaleString()}
              </span>
            ),
          },
          {
            key: 'user', header: 'User',
            render: (item) => {
              const config = ROLE_CONFIG[item.userRole as keyof typeof ROLE_CONFIG] || {
                label: item.userRole,
                color: 'text-slate-500',
                bgColor: 'bg-slate-50'
              };
              return (
                <div className="flex items-center gap-2">
                  <Avatar name={item.userName} size="sm" />
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block">{item.userName}</span>
                    <span className={`text-[9px] font-bold ${config.color}`}>{config.label}</span>
                  </div>
                </div>
              );
            },
          },
          {
            key: 'action', header: 'Action',
            render: (item) => <Badge variant={actionColor(item.action)} className="text-[10px] font-bold">{item.action}</Badge>,
          },
          {
            key: 'resource', header: 'Resource',
            render: (item) => (
              <div>
                <span className="text-xs font-medium text-slate-600">{item.resource}</span>
                {item.entityId && item.entityId !== 'unknown' && (
                  <span className="block text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                    ID: {item.entityId}
                  </span>
                )}
              </div>
            ),
          },
          {
            key: 'details', header: 'Details', className: 'min-w-[200px]',
            render: (item) => <p className="text-[11px] text-slate-500 line-clamp-2">{item.details}</p>,
          },
          {
            key: 'changes', header: 'Changes',
            render: (item) => {
              if (!item.oldValue && !item.newValue) return <span className="text-[11px] text-slate-300">—</span>;
              return (
                <div className="space-y-0.5">
                  {item.oldValue && (
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-red-400 uppercase">Before</span>
                      <span className="text-[10px] text-slate-500 font-mono truncate max-w-[100px]">{item.oldValue}</span>
                    </div>
                  )}
                  {item.newValue && (
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-emerald-500 uppercase">After</span>
                      <span className="text-[10px] text-slate-500 font-mono truncate max-w-[100px]">{item.newValue}</span>
                    </div>
                  )}
                </div>
              );
            },
          },
        ]}
      />
    </div>
  );
}
