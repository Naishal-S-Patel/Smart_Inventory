import * as React from 'react';
import { useInventoryStore } from '@/store';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ROLE_CONFIG } from '@/config/permissions';
import { Select } from '@/components/ui/select';
import type { AuditLogEntry } from '@/types';

export default function AuditLogs() {
  const auditLogs = useInventoryStore((s) => s.auditLogs);
  const [actionFilter, setActionFilter] = React.useState('all');

  const filtered = actionFilter === 'all' ? auditLogs : auditLogs.filter((l) => l.action === actionFilter);

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
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Audit Logs</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Complete activity history across the platform</p>
      </div>

      <DataTable<AuditLogEntry>
        data={filtered}
        searchPlaceholder="Search by user, action, or resource..."
        searchKey={(item) => `${item.userName} ${item.action} ${item.resource} ${item.details}`}
        pageSize={10}
        filterSlot={
          <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} options={[{ value: 'all', label: 'All Actions' }, { value: 'CREATE', label: 'Create' }, { value: 'UPDATE', label: 'Update' }, { value: 'DELETE', label: 'Delete' }, { value: 'APPROVE', label: 'Approve' }, { value: 'LOGIN', label: 'Login' }, { value: 'EXPORT', label: 'Export' }, { value: 'IMPORT', label: 'Import' }]} className="w-36 text-xs" />
        }
        columns={[
          {
            key: 'timestamp', header: 'Time',
            render: (item) => <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">{new Date(item.timestamp).toLocaleString()}</span>,
          },
          {
            key: 'user', header: 'User',
            render: (item) => (
              <div className="flex items-center gap-2">
                <Avatar name={item.userName} size="sm" />
                <div>
                  <span className="text-xs font-semibold text-slate-700 block">{item.userName}</span>
                  <span className={`text-[9px] font-bold ${ROLE_CONFIG[item.userRole].color}`}>{ROLE_CONFIG[item.userRole].label}</span>
                </div>
              </div>
            ),
          },
          {
            key: 'action', header: 'Action',
            render: (item) => <Badge variant={actionColor(item.action)} className="text-[10px] font-bold">{item.action}</Badge>,
          },
          { key: 'resource', header: 'Resource', render: (item) => <span className="text-xs font-medium text-slate-600">{item.resource}</span> },
          { key: 'details', header: 'Details', className: 'min-w-[200px]', render: (item) => <p className="text-[11px] text-slate-500 line-clamp-1">{item.details}</p> },
          { key: 'ip', header: 'IP', render: (item) => <span className="text-[11px] text-slate-400 font-mono">{item.ipAddress}</span> },
        ]}
      />
    </div>
  );
}
