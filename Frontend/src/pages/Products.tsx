import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService, ProductDTO } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

// ─── ProductForm ─────────────────────────────────────────────────────────────
interface ProductFormProps {
  initial?: Partial<ProductDTO>;
  categories: { id: string; name: string }[];
  onSubmit: (payload: Record<string, unknown>) => void;
  loading: boolean;
}

function ProductForm({ initial, categories, onSubmit, loading }: ProductFormProps) {
  const [form, setForm] = React.useState({
    name: initial?.name ?? '',
    sku: initial?.sku ?? '',
    description: initial?.description ?? '',
    categoryId: initial?.category?.id ?? '',
    unitCost: initial?.unitCost?.toString() ?? '',
    sellingPrice: initial?.sellingPrice?.toString() ?? '',
    unitOfMeasure: initial?.unitOfMeasure ?? 'pcs',
    reorderPoint: initial?.reorderPoint?.toString() ?? '10',
    maxStockLevel: initial?.maxStockLevel?.toString() ?? '500',
    barcode: initial?.barcode ?? '',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      unitCost: parseFloat(form.unitCost) || 0,
      sellingPrice: parseFloat(form.sellingPrice) || 0,
      reorderPoint: parseInt(form.reorderPoint) || 0,
      maxStockLevel: parseInt(form.maxStockLevel) || 0,
    });
  };

  const field = (label: string, key: string, type = 'text', placeholder = '') => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <Input
        type={type}
        placeholder={placeholder}
        value={(form as Record<string, string>)[key]}
        onChange={(e) => set(key, e.target.value)}
        required={['name', 'sku', 'unitCost', 'sellingPrice'].includes(key)}
      />
    </div>
  );

  return (
    <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {field('Product Name *', 'name', 'text', 'e.g. Industrial Bolt M8')}
        {field('SKU *', 'sku', 'text', 'e.g. BOLT-M8-001')}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-600">Category</label>
        <select
          value={form.categoryId}
          onChange={(e) => set('categoryId', e.target.value)}
          className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400 transition-colors"
        >
          <option value="">— No Category —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {field('Unit Cost (₹) *', 'unitCost', 'number', '0.00')}
        {field('Selling Price (₹) *', 'sellingPrice', 'number', '0.00')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {field('Reorder Point', 'reorderPoint', 'number', '10')}
        {field('Max Stock Level', 'maxStockLevel', 'number', '500')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {field('Unit of Measure', 'unitOfMeasure', 'text', 'pcs')}
        {field('Barcode', 'barcode', 'text', 'optional')}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-600">Description</label>
        <textarea
          rows={2}
          placeholder="Optional product description..."
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm font-medium text-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400 transition-colors"
        />
      </div>
      <DialogFooter>
        <Button type="submit" form="product-form" loading={loading}>
          {initial ? 'Save Changes' : 'Create Product'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Products() {
  const [page, setPage] = React.useState(0);
  const [categoryId, setCategoryId] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [dialog, setDialog] = React.useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = React.useState<ProductDTO | null>(null);

  const queryClient = useQueryClient();

  const { data: categoriesPage } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll({ size: 100 }),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', page, categoryId, search],
    queryFn: () =>
      productService.getAll({
        page,
        size: 15,
        categoryId: categoryId !== 'all' ? categoryId : undefined,
        search: search || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['products'] });

  const createMutation = useMutation({
    mutationFn: (p: Parameters<typeof productService.create>[0]) => productService.create(p),
    onSuccess: () => { toast.success('Product created'); invalidate(); setDialog(null); },
    onError: () => toast.error('Failed to create product'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      productService.update(id, payload as Parameters<typeof productService.update>[1]),
    onSuccess: () => { toast.success('Product updated'); invalidate(); setDialog(null); },
    onError: () => toast.error('Failed to update product'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: () => { toast.success('Product deleted'); invalidate(); setDialog(null); },
    onError: () => toast.error('Failed to delete product'),
  });

  const categories = categoriesPage?.content ?? [];
  const products = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;

  const openEdit = (item: ProductDTO) => { setSelected(item); setDialog('edit'); };
  const openDelete = (item: ProductDTO) => { setSelected(item); setDialog('delete'); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Product Catalog</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{formatNumber(totalElements)} products</p>
        </div>
        <Button onClick={() => setDialog('create')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Product
        </Button>
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">
          Failed to load products. Make sure the backend is running on port 8080.
        </div>
      )}

      <DataTable
        data={products}
        isLoading={isLoading}
        searchPlaceholder="Search by name or SKU..."
        onSearch={setSearch}
        pageSize={15}
        totalElements={totalElements}
        currentPage={page}
        onPageChange={setPage}
        filterSlot={
          <Select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(0); }}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            className="w-44 text-xs"
          />
        }
        columns={[
          {
            key: 'name',
            header: 'Product',
            className: 'min-w-[220px]',
            render: (item) => (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-slate-50 shrink-0">
                  <Package className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{item.sku}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'category',
            header: 'Category',
            render: (item) => (
              <span className="text-xs font-medium text-slate-600">{item.category?.name ?? '—'}</span>
            ),
          },
          {
            key: 'isActive',
            header: 'Status',
            render: (item) => (
              <Badge variant={item.isActive ? 'success' : 'secondary'} className="text-[10px] font-bold">
                {item.isActive ? 'Active' : 'Inactive'}
              </Badge>
            ),
          },
          {
            key: 'reorderPoint',
            header: 'Reorder Pt.',
            render: (item) => <span className="text-xs font-mono text-slate-600">{item.reorderPoint}</span>,
          },
          {
            key: 'sellingPrice',
            header: 'Price',
            render: (item) => <span className="text-sm font-medium text-slate-700">{formatCurrency(item.sellingPrice)}</span>,
          },
          {
            key: 'unitCost',
            header: 'Cost',
            render: (item) => <span className="text-sm text-slate-400">{formatCurrency(item.unitCost)}</span>,
          },
          {
            key: 'barcode',
            header: 'Barcode',
            render: (item) => <span className="text-[11px] font-mono text-slate-400">{item.barcode ?? '—'}</span>,
          },
          {
            key: 'actions',
            header: '',
            render: (item) => (
              <div className="flex items-center gap-1 justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Edit product"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openDelete(item); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete product"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ),
          },
        ]}
      />

      {/* Create Dialog */}
      <Dialog open={dialog === 'create'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Product</DialogTitle>
            <DialogDescription>Add a new product to the catalog</DialogDescription>
          </DialogHeader>
          <ProductForm
            categories={categories}
            onSubmit={(p) => createMutation.mutate(p as unknown as Parameters<typeof productService.create>[0])}
            loading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={dialog === 'edit'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update details for {selected?.name}</DialogDescription>
          </DialogHeader>
          {selected && (
            <ProductForm
              initial={selected}
              categories={categories}
              onSubmit={(p) => updateMutation.mutate({ id: selected.id, payload: p })}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={dialog === 'delete'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selected?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() => selected && deleteMutation.mutate(selected.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
