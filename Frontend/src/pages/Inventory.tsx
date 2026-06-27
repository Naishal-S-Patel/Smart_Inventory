import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService, InventoryDTO } from '@/services/inventoryService';
import { warehouseService } from '@/services/warehouseService';
import { productService } from '@/services/productService';
import { formatNumber } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { SlidersHorizontal, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useInventoryWebSocket } from '@/hooks/useWebSocket';

// ─── Adjust Stock Dialog ──────────────────────────────────────────────────────
interface AdjustDialogProps {
  open: boolean;
  onClose: () => void;
  item?: InventoryDTO & { id: string };
  warehouses: { id: string; name: string }[];
  products: { id: string; name: string }[];
}

function AdjustDialog({ open, onClose, item, warehouses, products }: AdjustDialogProps) {
  const queryClient = useQueryClient();
  const [productId, setProductId] = React.useState(item?.productId ?? '');
  const [warehouseId, setWarehouseId] = React.useState(item?.warehouseId ?? '');
  const [quantity, setQuantity] = React.useState('');
  const [txType, setTxType] = React.useState('ADJUSTMENT_IN');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (item) { setProductId(item.productId); setWarehouseId(item.warehouseId); }
  }, [item]);

  const adjustMutation = useMutation({
    mutationFn: (p: Parameters<typeof inventoryService.adjust>[0]) => inventoryService.adjust(p),
    onSuccess: () => {
      toast.success('Stock adjusted successfully');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onClose();
    },
    onError: () => toast.error('Failed to adjust stock'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !warehouseId || !quantity) { toast.error('Fill in all required fields'); return; }
    adjustMutation.mutate({ productId, warehouseId, quantity: parseInt(quantity), transactionType: txType, notes: notes || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>Manually adjust inventory quantity</DialogDescription>
        </DialogHeader>
        <form id="adjust-form" onSubmit={handleSubmit} className="space-y-4">
          {!item && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Product *</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  required
                  className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400 transition-colors"
                >
                  <option value="">— Select product —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Warehouse *</label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  required
                  className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400 transition-colors"
                >
                  <option value="">— Select warehouse —</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </>
          )}
          {item && (
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 space-y-0.5">
              <p><span className="font-semibold">Product:</span> {item.product?.name ?? item.productId}</p>
              <p><span className="font-semibold">Warehouse:</span> {item.warehouse?.name ?? item.warehouseId}</p>
              <p><span className="font-semibold">Current On Hand:</span> {item.quantityOnHand} units</p>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Transaction Type *</label>
            <select
              value={txType}
              onChange={(e) => setTxType(e.target.value)}
              className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400 transition-colors"
            >
              <option value="ADJUSTMENT_IN">Adjustment In (+)</option>
              <option value="ADJUSTMENT_OUT">Adjustment Out (−)</option>
              <option value="DAMAGE">Damage / Write-off</option>
              <option value="RETURN">Customer Return</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Quantity *</label>
            <Input type="number" min="1" placeholder="Units" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Notes</label>
            <Input placeholder="Reason for adjustment..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="adjust-form" loading={adjustMutation.isPending}>Apply Adjustment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Transfer Dialog ──────────────────────────────────────────────────────────
export interface TransferDialogProps {
  open: boolean;
  onClose: () => void;
  warehouses: { id: string; name: string }[];
  products: { id: string; name: string }[];
}

export function TransferDialog({ open, onClose, warehouses, products }: TransferDialogProps) {
  const queryClient = useQueryClient();
  const [productId, setProductId] = React.useState('');
  const [fromId, setFromId] = React.useState('');
  const [toId, setToId] = React.useState('');
  const [quantity, setQuantity] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const transferMutation = useMutation({
    mutationFn: (p: Parameters<typeof inventoryService.transfer>[0]) => inventoryService.transfer(p),
    onSuccess: () => {
      toast.success('Transfer initiated');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] });
      onClose();
    },
    onError: () => toast.error('Failed to initiate transfer'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromId === toId) { toast.error('Source and destination warehouses must be different'); return; }
    transferMutation.mutate({ productId, sourceWarehouseId: fromId, destinationWarehouseId: toId, quantity: parseInt(quantity), notes: notes || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Stock</DialogTitle>
          <DialogDescription>Move inventory between warehouses</DialogDescription>
        </DialogHeader>
        <form id="transfer-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Product *</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} required className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400 transition-colors">
              <option value="">— Select product —</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">From Warehouse *</label>
              <select value={fromId} onChange={(e) => setFromId(e.target.value)} required className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400 transition-colors">
                <option value="">— Source —</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">To Warehouse *</label>
              <select value={toId} onChange={(e) => setToId(e.target.value)} required className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400 transition-colors">
                <option value="">— Destination —</option>
                {warehouses.filter((w) => w.id !== fromId).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Quantity *</label>
            <Input type="number" min="1" placeholder="Units to transfer" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Notes</label>
            <Input placeholder="Transfer reason..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="transfer-form" loading={transferMutation.isPending}>Initiate Transfer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Inventory() {
  const [page, setPage] = React.useState(0);
  const [warehouseId, setWarehouseId] = React.useState('all');
  const [adjustTarget, setAdjustTarget] = React.useState<(InventoryDTO & { id: string }) | undefined>(undefined);
  const [dialog, setDialog] = React.useState<'adjust' | 'transfer' | null>(null);

  const { data: warehousesPage } = useQuery({
    queryKey: ['warehouses-all'],
    queryFn: () => warehouseService.getAll({ size: 100, isActive: true }),
  });

  const { data: productsPage } = useQuery({
    queryKey: ['products-inventory'],
    queryFn: () => productService.getAll({ size: 500 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['inventory', page, warehouseId],
    queryFn: () =>
      inventoryService.getAll({
        page,
        size: 15,
        warehouseId: warehouseId !== 'all' ? warehouseId : undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['inventory-low-stock'],
    queryFn: () => inventoryService.getLowStock({ size: 200 }),
  });

  const warehouses = warehousesPage?.content ?? [];
  const products = productsPage?.content ?? [];

  const queryClient = useQueryClient();

  useInventoryWebSocket(
    warehouseId !== 'all' ? warehouseId : undefined,
    (event) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-low-stock'] });
      const productName = products.find((p) => p.id === event.productId)?.name || 'Product';
      toast.info(`Stock updated: ${productName}`, {
        description: `Quantity in warehouse changed from ${event.oldQuantity} to ${event.newQuantity} units.`,
        duration: 4000,
      });
    }
  );

  const items = React.useMemo(() => {
    return (data?.content ?? []).map((item) => ({
      ...item,
      id: `${item.productId}-${item.warehouseId}`,
    }));
  }, [data]);

  const totalElements = data?.totalElements ?? 0;
  const lowStockCount = lowStockData?.totalElements ?? 0;

  const getStatus = (qty: number, reserved: number) => {
    const available = qty - reserved;
    if (available <= 0) return 'Out of Stock';
    if (available <= 10) return 'Low Stock';
    return 'In Stock';
  };

  const openAdjust = (item: InventoryDTO & { id: string }) => { setAdjustTarget(item); setDialog('adjust'); };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Inventory</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {formatNumber(totalElements)} inventory records
            {lowStockCount > 0 && (
              <span className="ml-2 text-amber-600 font-semibold">· {lowStockCount} low stock</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setAdjustTarget(undefined); setDialog('transfer'); }} className="gap-1.5">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Transfer
          </Button>
          <Button size="sm" onClick={() => { setAdjustTarget(undefined); setDialog('adjust'); }} className="gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Adjust Stock
          </Button>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">
          Failed to load inventory. Make sure the backend is running on port 8080.
        </div>
      )}

      <DataTable
        data={items}
        isLoading={isLoading}
        searchPlaceholder="Search by product name..."
        pageSize={15}
        totalElements={totalElements}
        currentPage={page}
        onPageChange={setPage}
        filterSlot={
          <Select
            value={warehouseId}
            onChange={(e) => { setWarehouseId(e.target.value); setPage(0); }}
            options={[
              { value: 'all', label: 'All Warehouses' },
              ...warehouses.map((w) => ({ value: w.id, label: w.name })),
            ]}
            className="w-48 text-xs"
          />
        }
        columns={[
          {
            key: 'product',
            header: 'Product',
            className: 'min-w-[220px]',
            render: (item) => (
              <div>
                <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">
                  {item.product?.name ?? item.productId}
                </p>
                <p className="text-[11px] font-mono text-slate-400">{item.product?.sku ?? '—'}</p>
              </div>
            ),
          },
          {
            key: 'warehouse',
            header: 'Warehouse',
            render: (item) => (
              <span className="text-xs font-medium text-slate-600">{item.warehouse?.name ?? item.warehouseId}</span>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (item) => {
              const status = getStatus(item.quantityOnHand, item.reservedQuantity);
              return (
                <Badge
                  variant={
                    status === 'In Stock' ? 'success' :
                    status === 'Low Stock' ? 'warning' : 'critical'
                  }
                  className="text-[10px] font-bold"
                >
                  {status}
                </Badge>
              );
            },
          },
          {
            key: 'quantityOnHand',
            header: 'On Hand',
            render: (item) => (
              <span className="text-sm font-bold text-slate-700 font-mono">{formatNumber(item.quantityOnHand)}</span>
            ),
          },
          {
            key: 'reservedQuantity',
            header: 'Reserved',
            render: (item) => <span className="text-xs text-slate-500 font-mono">{item.reservedQuantity}</span>,
          },
          {
            key: 'availableQuantity',
            header: 'Available',
            className: 'min-w-[160px]',
            render: (item) => (
              <div className="space-y-1 w-32">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700 font-mono">{formatNumber(item.availableQuantity)}</span>
                </div>
                <Progress
                  value={Math.min(100, (item.availableQuantity / Math.max(item.quantityOnHand, 1)) * 100)}
                  indicatorClassName={item.availableQuantity <= 0 ? 'bg-red-500' : 'bg-emerald-500'}
                />
              </div>
            ),
          },
          {
            key: 'lastUpdatedAt',
            header: 'Updated',
            render: (item) => (
              <span className="text-[11px] text-slate-400">{new Date(item.lastUpdatedAt).toLocaleDateString()}</span>
            ),
          },
          {
            key: 'actions',
            header: '',
            render: (item) => (
              <button
                onClick={(e) => { e.stopPropagation(); openAdjust(item); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Adjust stock"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </button>
            ),
          },
        ]}
      />

      <AdjustDialog
        open={dialog === 'adjust'}
        onClose={() => setDialog(null)}
        item={adjustTarget}
        warehouses={warehouses}
        products={products}
      />

      <TransferDialog
        open={dialog === 'transfer'}
        onClose={() => setDialog(null)}
        warehouses={warehouses}
        products={products}
      />
    </div>
  );
}
