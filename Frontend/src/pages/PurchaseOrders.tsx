import * as React from 'react';
import { useInventoryStore } from '@/store';
import { formatCurrency } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import type { PurchaseOrder } from '@/types';

export default function PurchaseOrders() {
  const purchaseOrders = useInventoryStore((s) => s.purchaseOrders);
  const suppliers = useInventoryStore((s) => s.suppliers);
  const [statusFilter, setStatusFilter] = React.useState('all');

  const filtered = statusFilter === 'all' ? purchaseOrders : purchaseOrders.filter((po) => po.status === statusFilter);
  const getSupplier = (id: string) => suppliers.find((s) => s.id === id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Purchase Orders</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">{purchaseOrders.length} orders in the procurement pipeline</p>
      </div>

      <DataTable<PurchaseOrder>
        data={filtered}
        searchPlaceholder="Search by order number..."
        searchKey={(item) => `${item.orderNumber} ${getSupplier(item.supplierId)?.name || ''}`}
        pageSize={10}
        filterSlot={
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: 'all', label: 'All Status' }, { value: 'Draft', label: 'Draft' }, { value: 'Approved', label: 'Approved' }, { value: 'Sent', label: 'Sent' }, { value: 'Received', label: 'Received' }]} className="w-36 text-xs" />
        }
        columns={[
          { key: 'orderNumber', header: 'Order #', render: (item) => <span className="text-sm font-bold text-slate-800">{item.orderNumber}</span> },
          { key: 'supplier', header: 'Supplier', render: (item) => <span className="text-xs font-medium text-slate-600">{getSupplier(item.supplierId)?.name || '—'}</span> },
          { key: 'status', header: 'Status', render: (item) => <Badge variant={item.status === 'Received' ? 'success' : item.status === 'Sent' ? 'info' : item.status === 'Approved' ? 'purple' : 'secondary'} className="text-[10px] font-bold">{item.status}</Badge> },
          { key: 'items', header: 'Items', render: (item) => <span className="text-xs text-slate-500">{item.items.length} items ({item.items.reduce((s, i) => s + i.quantity, 0)} units)</span> },
          { key: 'totalAmount', header: 'Total', sortable: true, render: (item) => <span className="text-sm font-bold text-slate-700">{formatCurrency(item.totalAmount)}</span> },
          { key: 'orderDate', header: 'Date', sortable: true, render: (item) => <span className="text-[11px] text-slate-400">{new Date(item.orderDate).toLocaleDateString()}</span> },
        ]}
      />
    </div>
  );
}
