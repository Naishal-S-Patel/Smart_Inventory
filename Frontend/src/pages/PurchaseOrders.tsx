import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrderService, PurchaseOrderDTO } from '@/services/purchaseOrderService';
import { supplierService } from '@/services/supplierService';
import { warehouseService } from '@/services/warehouseService';
import { productService } from '@/services/productService';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, CheckCircle, Eye, Trash2, Package, X } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'SENT', label: 'Sent' },
  { value: 'PARTIALLY_RECEIVED', label: 'Partial' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const statusVariant = (status: string) => {
  switch (status) {
    case 'RECEIVED': return 'success' as const;
    case 'SENT': return 'info' as const;
    case 'APPROVED': return 'purple' as const;
    case 'CANCELLED': return 'critical' as const;
    default: return 'secondary' as const;
  }
};

// ─── Line Item Row ────────────────────────────────────────────────────────────
interface LineItem { productId: string; productName: string; quantity: number; unitCost: number; }

interface LineItemRowProps {
  item: LineItem;
  products: { id: string; name: string; unitCost: number }[];
  onUpdate: (updated: LineItem) => void;
  onRemove: () => void;
}

function LineItemRow({ item, products, onUpdate, onRemove }: LineItemRowProps) {
  const handleProductChange = (productId: string) => {
    const p = products.find((pr) => pr.id === productId);
    onUpdate({ ...item, productId, productName: p?.name ?? '', unitCost: p?.unitCost ?? 0 });
  };

  return (
    <div className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-center">
      <select
        value={item.productId}
        onChange={(e) => handleProductChange(e.target.value)}
        required
        className="h-9 px-2.5 rounded-lg border border-input bg-background text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400 transition-colors"
      >
        <option value="">— Select product —</option>
        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <Input
        type="number"
        min="1"
        value={item.quantity}
        onChange={(e) => onUpdate({ ...item, quantity: parseInt(e.target.value) || 1 })}
        className="h-9 text-xs text-center"
        placeholder="Qty"
        required
      />
      <Input
        type="number"
        min="0"
        step="0.01"
        value={item.unitCost}
        onChange={(e) => onUpdate({ ...item, unitCost: parseFloat(e.target.value) || 0 })}
        className="h-9 text-xs text-right"
        placeholder="Unit cost"
      />
      <button
        type="button"
        onClick={onRemove}
        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Create PO Dialog ─────────────────────────────────────────────────────────
interface CreatePODialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: Parameters<typeof purchaseOrderService.create>[0]) => void;
  loading: boolean;
}

function CreatePODialog({ open, onClose, onSubmit, loading }: CreatePODialogProps) {
  const [supplierId, setSupplierId] = React.useState('');
  const [warehouseId, setWarehouseId] = React.useState('');
  const [expectedDelivery, setExpectedDelivery] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [items, setItems] = React.useState<LineItem[]>([
    { productId: '', productName: '', quantity: 1, unitCost: 0 }
  ]);

  const { data: suppliersPage } = useQuery({ queryKey: ['suppliers'], queryFn: () => supplierService.getAll({ size: 100 }) });
  const { data: warehousesPage } = useQuery({ queryKey: ['warehouses'], queryFn: () => warehouseService.getAll({ size: 100 }) });
  const { data: productsPage } = useQuery({ queryKey: ['products', 0, 'all', ''], queryFn: () => productService.getAll({ size: 200 }) });

  const suppliers = suppliersPage?.content ?? [];
  const warehouses = warehousesPage?.content ?? [];
  const products = productsPage?.content ?? [];

  const totalAmount = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);

  const addItem = () => setItems((prev) => [...prev, { productId: '', productName: '', quantity: 1, unitCost: 0 }]);
  const updateItem = (idx: number, updated: LineItem) => setItems((prev) => prev.map((it, i) => i === idx ? updated : it));
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !warehouseId) { toast.error('Please select a supplier and warehouse'); return; }
    if (items.some((it) => !it.productId)) { toast.error('Please select a product for each line item'); return; }
    onSubmit({
      supplierId,
      warehouseId,
      expectedDeliveryDate: expectedDelivery || undefined,
      notes: notes || undefined,
      items: items.map((it) => ({ productId: it.productId, quantity: it.quantity, unitCost: it.unitCost })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>Place a new order with a supplier</DialogDescription>
        </DialogHeader>
        <form id="po-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400 transition-colors"
              >
                <option value="">— Select supplier —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.companyName}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Destination Warehouse *</label>
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Expected Delivery</label>
              <Input type="date" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Notes</label>
              <Input placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600">Line Items *</label>
              <button
                type="button"
                onClick={addItem}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
              >
                <Plus className="h-3 w-3" /> Add Item
              </button>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50/30">
              <div className="grid grid-cols-[1fr_80px_100px_32px] gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-0.5">
                <span>Product</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Unit Cost</span>
                <span />
              </div>
              {items.map((item, idx) => (
                <LineItemRow
                  key={idx}
                  item={item}
                  products={products}
                  onUpdate={(u) => updateItem(idx, u)}
                  onRemove={() => removeItem(idx)}
                />
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 text-sm font-bold text-slate-700">
              <span className="text-xs text-slate-400 font-medium">Total:</span>
              <span className="text-emerald-600">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="po-form" loading={loading}>Create Order</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────
function PODetailDialog({ po, open, onClose }: { po: PurchaseOrderDTO | null; open: boolean; onClose: () => void }) {
  if (!po) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono">{po.orderNumber}</span>
            <Badge variant={statusVariant(po.status)} className="text-[10px] font-bold capitalize">
              {po.status.toLowerCase().replace('_', ' ')}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {po.supplier?.companyName ?? po.supplierId} → {po.warehouse?.name ?? po.warehouseId}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-slate-400">Created</span><p className="font-semibold mt-0.5">{new Date(po.createdAt).toLocaleDateString()}</p></div>
            <div><span className="text-slate-400">Expected Delivery</span><p className="font-semibold mt-0.5">{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : '—'}</p></div>
            {po.approvedBy && <div><span className="text-slate-400">Approved By</span><p className="font-semibold mt-0.5">{po.approvedBy}</p></div>}
            {po.notes && <div className="col-span-2"><span className="text-slate-400">Notes</span><p className="font-semibold mt-0.5">{po.notes}</p></div>}
          </div>
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Line Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/50">
                  <tr>
                    <th className="text-left py-2 px-4 text-[10px] font-semibold text-slate-400 uppercase">Product</th>
                    <th className="text-right py-2 px-4 text-[10px] font-semibold text-slate-400 uppercase">Qty</th>
                    <th className="text-right py-2 px-4 text-[10px] font-semibold text-slate-400 uppercase">Unit Cost</th>
                    <th className="text-right py-2 px-4 text-[10px] font-semibold text-slate-400 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {po.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-4 font-medium text-slate-700">{item.product?.name ?? item.productId}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{item.quantity}</td>
                      <td className="py-2.5 px-4 text-right text-slate-500">{formatCurrency(item.unitCost)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-700">{formatCurrency(item.totalCost)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/50 border-t border-slate-200">
                    <td colSpan={3} className="py-2.5 px-4 text-right font-semibold text-slate-500 text-[11px] uppercase tracking-wide">Total</td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-emerald-600">{formatCurrency(po.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PurchaseOrders() {
  const [page, setPage] = React.useState(0);
  const [status, setStatus] = React.useState('all');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detailPO, setDetailPO] = React.useState<PurchaseOrderDTO | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['purchase-orders', page, status],
    queryFn: () =>
      purchaseOrderService.getAll({
        page,
        size: 10,
        status: status !== 'all' ? status : undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });

  const createMutation = useMutation({
    mutationFn: (p: Parameters<typeof purchaseOrderService.create>[0]) => purchaseOrderService.create(p),
    onSuccess: () => { toast.success('Purchase order created'); invalidate(); setCreateOpen(false); },
    onError: () => toast.error('Failed to create purchase order'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => purchaseOrderService.approve(id),
    onSuccess: () => { toast.success('Purchase order approved'); invalidate(); },
    onError: () => toast.error('Failed to approve purchase order'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => purchaseOrderService.delete(id),
    onSuccess: () => { toast.success('Purchase order deleted'); invalidate(); },
    onError: () => toast.error('Failed to delete purchase order'),
  });

  const orders = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Purchase Orders</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {formatNumber(totalElements)} orders in the procurement pipeline
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create PO
        </Button>
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">
          Failed to load purchase orders. Make sure the backend is running on port 8080.
        </div>
      )}

      <DataTable
        data={orders}
        isLoading={isLoading}
        searchPlaceholder="Search by order number..."
        searchKey={(item) => `${item.orderNumber} ${item.supplier?.companyName ?? ''}`}
        pageSize={10}
        totalElements={totalElements}
        currentPage={page}
        onPageChange={setPage}
        filterSlot={
          <Select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            options={STATUS_OPTIONS}
            className="w-36 text-xs"
          />
        }
        columns={[
          {
            key: 'orderNumber',
            header: 'Order #',
            render: (item) => (
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-50">
                  <Package className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <span className="text-sm font-bold text-slate-800 font-mono">{item.orderNumber}</span>
              </div>
            ),
          },
          {
            key: 'supplier',
            header: 'Supplier',
            render: (item) => (
              <span className="text-xs font-medium text-slate-600">{item.supplier?.companyName ?? item.supplierId}</span>
            ),
          },
          {
            key: 'warehouse',
            header: 'Warehouse',
            render: (item) => (
              <span className="text-xs font-medium text-slate-500">{item.warehouse?.name ?? item.warehouseId}</span>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (item) => (
              <Badge variant={statusVariant(item.status)} className="text-[10px] font-bold capitalize">
                {item.status.toLowerCase().replace('_', ' ')}
              </Badge>
            ),
          },
          {
            key: 'items',
            header: 'Items',
            render: (item) => (
              <span className="text-xs text-slate-500">
                {item.items.length} item{item.items.length !== 1 ? 's' : ''} · {item.items.reduce((s, i) => s + i.quantity, 0)} units
              </span>
            ),
          },
          {
            key: 'totalAmount',
            header: 'Total',
            render: (item) => (
              <span className="text-sm font-bold text-slate-700">{formatCurrency(item.totalAmount)}</span>
            ),
          },
          {
            key: 'createdAt',
            header: 'Date',
            render: (item) => (
              <span className="text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
            ),
          },
          {
            key: 'actions',
            header: '',
            render: (item) => (
              <div className="flex items-center gap-1 justify-end">
                {item.status === 'PENDING' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); approveMutation.mutate(item.id); }}
                    disabled={approveMutation.isPending}
                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                    title="Approve PO"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setDetailPO(item); }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  title="View details"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                {['PENDING', 'CANCELLED'].includes(item.status) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete this purchase order?')) deleteMutation.mutate(item.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete PO"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Create PO Dialog */}
      <CreatePODialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={createMutation.mutate}
        loading={createMutation.isPending}
      />

      {/* Detail Dialog */}
      <PODetailDialog
        po={detailPO}
        open={!!detailPO}
        onClose={() => setDetailPO(null)}
      />
    </div>
  );
}
