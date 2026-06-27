import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventoryService';
import { purchaseOrderService } from '@/services/purchaseOrderService';
import { useWebSocket } from '@/hooks/useWebSocket';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, PackageCheck, ShoppingCart, AlertTriangle } from 'lucide-react';

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

export default function StaffDashboard() {
  const queryClient = useQueryClient();

  // Invalidate and refresh queries on any WebSocket event
  useWebSocket('/topic/alerts', () => {
    queryClient.invalidateQueries();
  });

  const { data: transactionsPage } = useQuery({
    queryKey: ['staff-transactions'],
    queryFn: () => inventoryService.getTransactions({ size: 50 }),
  });

  const { data: purchaseOrdersPage } = useQuery({
    queryKey: ['staff-pos'],
    queryFn: () => purchaseOrderService.getAll({ size: 50 }),
  });

  const { data: transfersPage } = useQuery({
    queryKey: ['staff-transfers'],
    queryFn: () => inventoryService.getTransactions({ transactionType: 'TRANSFER_OUT', size: 50 }),
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['staff-low-stock'],
    queryFn: () => inventoryService.getLowStock({ size: 50 }),
  });

  const transactions = transactionsPage?.content ?? [];
  const purchaseOrders = purchaseOrdersPage?.content ?? [];
  const rawTransfers = transfersPage?.content ?? [];
  const lowStockItems = lowStockData?.totalElements ?? 0;

  const todaysMovements = React.useMemo(() => {
    const todayStr = new Date().toDateString();
    return transactions.filter(t => new Date(t.createdAt).toDateString() === todayStr).length;
  }, [transactions]);

  const pendingReceipts = React.useMemo(() => {
    return purchaseOrders.filter(po => {
      const s = po.status.toUpperCase();
      return s === 'SENT' || s === 'APPROVED';
    }).length;
  }, [purchaseOrders]);

  const todaysTransfers = React.useMemo(() => {
    const todayStr = new Date().toDateString();
    return rawTransfers.filter(t => new Date(t.createdAt).toDateString() === todayStr).length;
  }, [rawTransfers]);

  const transfers = React.useMemo(() => {
    return rawTransfers.map((tx) => {
      const { destination } = parseTransferNotes(tx.notes);
      return {
        id: tx.id,
        transferNumber: tx.referenceId || `TR-${tx.id.substring(0, 8).toUpperCase()}`,
        sourceWarehouseName: tx.warehouseName || 'Source Warehouse',
        destinationWarehouseName: destination,
        quantity: Math.abs(tx.quantity),
        status: 'completed',
      };
    });
  }, [rawTransfers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Staff Dashboard</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Warehouse operations and daily tasks</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Stock Movements" value={todaysMovements} icon={ArrowRightLeft} iconBg="bg-blue-50" iconColor="text-blue-600" change="Today" changeType="neutral" />
        <StatCard title="Pending Receipts" value={pendingReceipts} icon={PackageCheck} iconBg="bg-orange-50" iconColor="text-orange-600" change="Awaiting check-in" changeType="neutral" />
        <StatCard title="Completed Transfers" value={todaysTransfers} icon={ShoppingCart} iconBg="bg-purple-50" iconColor="text-purple-600" change="Today" changeType="positive" />
        <StatCard title="Low Stock Items" value={lowStockItems} icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600" change="Needs restock" changeType="negative" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transfers</CardTitle>
            <CardDescription>Warehouse-to-warehouse stock movements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {transfers.slice(0, 4).map((transfer) => (
              <div key={transfer.id} className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 bg-slate-50/30 hover:border-slate-200 transition-colors">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">{transfer.transferNumber}</span>
                    <Badge variant="success" className="text-[9px] font-bold capitalize">
                      {transfer.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {transfer.sourceWarehouseName} → {transfer.destinationWarehouseName}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600 shrink-0">
                  {transfer.quantity} units
                </span>
              </div>
            ))}
            {transfers.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">No transfers recorded</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending PO Receipts</CardTitle>
            <CardDescription>Shipments awaiting warehouse check-in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {purchaseOrders.filter(po => {
              const s = po.status.toUpperCase();
              return s === 'SENT' || s === 'APPROVED';
            }).slice(0, 4).map((po) => (
              <div key={po.id} className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 bg-slate-50/30 hover:border-slate-200 transition-colors">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">{po.orderNumber}</span>
                    <Badge variant={po.status.toUpperCase() === 'SENT' ? 'info' : 'warning'} className="text-[9px] font-bold">
                      {po.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {po.items.length} items · {po.items.reduce((sum, i) => sum + i.quantity, 0)} units total
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                  {new Date(po.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
            {purchaseOrders.filter(po => {
              const s = po.status.toUpperCase();
              return s === 'SENT' || s === 'APPROVED';
            }).length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">No pending receipts</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
