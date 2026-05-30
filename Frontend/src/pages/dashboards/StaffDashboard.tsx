import { useInventoryStore } from '@/store';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, PackageCheck, ShoppingCart, AlertTriangle } from 'lucide-react';

export default function StaffDashboard() {
  const products = useInventoryStore((s) => s.products);
  const transactions = useInventoryStore((s) => s.transactions);
  const purchaseOrders = useInventoryStore((s) => s.purchaseOrders);
  const warehouseTransfers = useInventoryStore((s) => s.warehouseTransfers);

  const todaysMovements = transactions.filter(t => {
    const today = new Date().toDateString();
    return new Date(t.timestamp).toDateString() === today;
  }).length || transactions.length;
  const pendingReceipts = purchaseOrders.filter(po => po.status === 'Sent').length;
  const todaysTransfers = warehouseTransfers.filter(t => t.status === 'completed').length;
  const lowStockItems = products.filter(p => p.status === 'Low Stock').length;

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
            {warehouseTransfers.slice(0, 4).map((transfer) => (
              <div key={transfer.id} className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 bg-slate-50/30 hover:border-slate-200 transition-colors">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">{transfer.transferNumber}</span>
                    <Badge variant={transfer.status === 'completed' ? 'success' : transfer.status === 'in_transit' ? 'info' : transfer.status === 'pending' ? 'warning' : 'secondary'} className="text-[9px] font-bold capitalize">
                      {transfer.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {transfer.sourceWarehouseName} → {transfer.destinationWarehouseName}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600 shrink-0">
                  {transfer.items.reduce((sum, i) => sum + i.quantity, 0)} units
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending PO Receipts</CardTitle>
            <CardDescription>Shipments awaiting warehouse check-in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {purchaseOrders.filter(po => po.status === 'Sent' || po.status === 'Approved').slice(0, 4).map((po) => (
              <div key={po.id} className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 bg-slate-50/30 hover:border-slate-200 transition-colors">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">{po.orderNumber}</span>
                    <Badge variant={po.status === 'Sent' ? 'info' : 'warning'} className="text-[9px] font-bold">
                      {po.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {po.items.length} items · {po.items.reduce((sum, i) => sum + i.quantity, 0)} units total
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {new Date(po.orderDate).toLocaleDateString()}
                </span>
              </div>
            ))}
            {purchaseOrders.filter(po => po.status === 'Sent' || po.status === 'Approved').length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">No pending receipts</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
