import { useInventoryStore } from '@/store';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import type { WarehouseTransfer } from '@/types';

export default function WarehouseTransfers() {
  const warehouseTransfers = useInventoryStore((s) => s.warehouseTransfers);

  const statusVariant = (status: WarehouseTransfer['status']): 'success' | 'info' | 'warning' | 'secondary' => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_transit': return 'info';
      case 'pending': return 'warning';
      case 'cancelled': return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Warehouse Transfers</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Inter-warehouse stock movement tracking</p>
      </div>

      <DataTable<WarehouseTransfer>
        data={warehouseTransfers}
        searchPlaceholder="Search by transfer number or warehouse..."
        searchKey={(item) => `${item.transferNumber} ${item.sourceWarehouseName} ${item.destinationWarehouseName}`}
        pageSize={10}
        columns={[
          { key: 'transferNumber', header: 'Transfer #', render: (item) => <span className="text-sm font-bold text-slate-800">{item.transferNumber}</span> },
          {
            key: 'route', header: 'Route', className: 'min-w-[220px]',
            render: (item) => (
              <div className="text-xs text-slate-600">
                <span className="font-semibold">{item.sourceWarehouseName}</span>
                <span className="text-slate-400 mx-1.5">→</span>
                <span className="font-semibold">{item.destinationWarehouseName}</span>
              </div>
            ),
          },
          {
            key: 'items', header: 'Items',
            render: (item) => <span className="text-xs text-slate-500">{item.items.length} products · {item.items.reduce((s, i) => s + i.quantity, 0)} units</span>,
          },
          {
            key: 'status', header: 'Status',
            render: (item) => <Badge variant={statusVariant(item.status)} className="text-[10px] font-bold capitalize">{item.status.replace('_', ' ')}</Badge>,
          },
          {
            key: 'createdBy', header: 'Created By',
            render: (item) => <span className="text-xs text-slate-500">{item.createdBy}</span>,
          },
          {
            key: 'createdAt', header: 'Date',
            render: (item) => <span className="text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>,
          },
        ]}
      />
    </div>
  );
}
