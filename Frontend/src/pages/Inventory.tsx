import * as React from 'react';
import { useInventoryStore } from '@/store';
import { formatNumber } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { CategoryIcon } from '@/components/ui/category-icon';
import type { Product } from '@/types';

export default function Inventory() {
  const products = useInventoryStore((s) => s.products);
  const warehouses = useInventoryStore((s) => s.warehouses);
  const [warehouseFilter, setWarehouseFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const categories = [...new Set(products.map((p) => p.category))];

  const filtered = React.useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (warehouseFilter !== 'all' && (!p.warehouseStockMap[warehouseFilter] || p.warehouseStockMap[warehouseFilter] === 0)) return false;
      return true;
    });
  }, [products, warehouseFilter, categoryFilter]);

  const getStockPercentage = (p: Product) => Math.min(100, (p.currentStock / p.maxStock) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Inventory Management</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Real-time stock levels across all warehouses</p>
      </div>

      <DataTable<Product>
        data={filtered}
        searchPlaceholder="Search by product name, SKU..."
        searchKey={(item) => `${item.name} ${item.sku}`}
        pageSize={12}
        filterSlot={
          <>
            <Select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} options={[{ value: 'all', label: 'All Warehouses' }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]} className="w-48 text-xs" />
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} options={[{ value: 'all', label: 'All Categories' }, ...categories.map((c) => ({ value: c, label: c }))]} className="w-40 text-xs" />
          </>
        }
        columns={[
          {
            key: 'product', header: 'Product', className: 'min-w-[220px]',
            render: (item) => (
              <div className="flex items-center gap-3">
                <CategoryIcon category={item.category} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-slate-800 truncate max-w-[180px]">{item.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{item.sku}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'status', header: 'Status',
            render: (item) => (
              <Badge variant={item.status === 'In Stock' ? 'success' : item.status === 'Low Stock' ? 'warning' : item.status === 'Out of Stock' ? 'critical' : 'info'} className="text-[10px] font-bold">
                {item.status}
              </Badge>
            ),
          },
          {
            key: 'currentStock', header: 'Stock Level', sortable: true, className: 'min-w-[180px]',
            render: (item) => (
              <div className="space-y-1.5 w-36">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 font-mono">{formatNumber(item.currentStock)}</span>
                  <span className="text-slate-400">/ {formatNumber(item.maxStock)}</span>
                </div>
                <Progress value={getStockPercentage(item)} indicatorClassName={item.status === 'Low Stock' ? 'bg-amber-500' : item.status === 'Out of Stock' ? 'bg-red-500' : item.status === 'Overstocked' ? 'bg-blue-500' : 'bg-emerald-500'} />
              </div>
            ),
          },
          { key: 'reorderPoint', header: 'Reorder Point', render: (item) => <span className="text-xs font-medium text-slate-500 font-mono">{item.reorderPoint}</span> },
          { key: 'category', header: 'Category', render: (item) => <span className="text-xs font-medium text-slate-600">{item.category}</span> },
          {
            key: 'lastUpdated', header: 'Updated', sortable: true,
            render: (item) => <span className="text-[11px] text-slate-400">{new Date(item.lastUpdated).toLocaleDateString()}</span>,
          },
        ]}
      />
    </div>
  );
}
