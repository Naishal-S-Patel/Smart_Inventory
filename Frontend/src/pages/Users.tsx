import { useInventoryStore } from '@/store';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ROLE_CONFIG } from '@/config/permissions';
import type { User } from '@/types';

export default function Users() {
  const users = useInventoryStore((s) => s.users);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">User Management</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">{users.length} registered users across the platform</p>
      </div>

      <DataTable<User>
        data={users}
        searchPlaceholder="Search users by name or email..."
        searchKey={(item) => `${item.name} ${item.email} ${item.role}`}
        pageSize={10}
        columns={[
          {
            key: 'user', header: 'User', className: 'min-w-[220px]',
            render: (item) => (
              <div className="flex items-center gap-3">
                <Avatar name={item.name} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                  <p className="text-[11px] text-slate-400">{item.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'role', header: 'Role',
            render: (item) => {
              const config = ROLE_CONFIG[item.role];
              return <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${config.bgColor} ${config.color}`}>{config.label}</span>;
            },
          },
          { key: 'department', header: 'Department', render: (item) => <span className="text-xs font-medium text-slate-600">{item.department || '—'}</span> },
          {
            key: 'status', header: 'Status',
            render: (item) => <Badge variant={item.status === 'active' ? 'success' : 'secondary'} className="text-[10px] font-bold capitalize">{item.status || 'active'}</Badge>,
          },
          {
            key: 'lastLogin', header: 'Last Active',
            render: (item) => <span className="text-[11px] text-slate-400">{item.lastLogin ? new Date(item.lastLogin).toLocaleDateString() : '—'}</span>,
          },
        ]}
      />
    </div>
  );
}
