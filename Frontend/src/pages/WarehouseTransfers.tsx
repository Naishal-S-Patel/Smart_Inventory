import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventoryService';
import { warehouseService } from '@/services/warehouseService';
import { productService } from '@/services/productService';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TransferDialog } from '@/pages/Inventory';
import { Plus } from 'lucide-react';

function parseTransferNotes(notes: string | null) {
  if (!notes) return { destination: 'Unknown Warehouse', originalNotes: '' };
  const toMatch = notes.match(/^To:\s*([^|]+)(?:\s*\|\s*Notes:\s*(.*))?$/);
  if (toMatch) {
    return {
      destination: toMatch[1].trim(),
      originalNotes: toMatch[2]?.trim() || '',
    };
  }
  return { destination: 'Unknown Warehouse', originalNotes: notes };
}

export default function WarehouseTransfers() {
  const [open, setOpen] = React.useState(false);

  const { data: transactionsPage, isLoading } = useQuery({
    queryKey: ['warehouse-transfers'],
    queryFn: () => inventoryService.getTransactions({ transactionType: 'TRANSFER_OUT', size: 100 }),
  });

  const { data: warehousesPage } = useQuery({
    queryKey: ['warehouses-all'],
    queryFn: () => warehouseService.getAll({ size: 100, isActive: true }),
  });

  const { data: productsPage } = useQuery({
    queryKey: ['products-inventory'],
    queryFn: () => productService.getAll({ size: 500 }),
    staleTime: 5 * 60 * 1000,
  });

  const warehouses = warehousesPage?.content ?? [];
  const products = productsPage?.content ?? [];

  const transfers = (transactionsPage?.content ?? []).map((tx) => {
    const { destination, originalNotes } = parseTransferNotes(tx.notes);
    return {
      id: tx.id,
      transferNumber: tx.referenceId || `TR-${tx.id.substring(0, 8).toUpperCase()}`,
      sourceWarehouseName: tx.warehouseName || 'Source Warehouse',
      destinationWarehouseName: destination,
      items: [
        {
          productId: tx.productId,
          productName: tx.productName || 'Product',
          quantity: Math.abs(tx.quantity),
        },
      ],
      status: 'completed' as const,
      createdBy: tx.createdBy || 'SYSTEM',
      createdAt: tx.createdAt,
      notes: originalNotes,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Warehouse Transfers</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Inter-warehouse stock movement tracking</p>
        </div>
        <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Transfer
        </Button>
      </div>

      <DataTable
        data={transfers}
        isLoading={isLoading}
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
            render: () => <Badge variant="success" className="text-[10px] font-bold capitalize">Completed</Badge>,
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

      <TransferDialog
        open={open}
        onClose={() => setOpen(false)}
        warehouses={warehouses}
        products={products}
      />
    </div>
  );
}
