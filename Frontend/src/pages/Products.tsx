import * as React from 'react';
import { useInventoryStore } from '@/store';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { CategoryIcon } from '@/components/ui/category-icon';
import { Select } from '@/components/ui/select';
import type { Product } from '@/types';

export default function Products() {
  const products = useInventoryStore((s) => s.products);
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const categories = [...new Set(products.map((p) => p.category))];

  const filtered = React.useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      return true;
    });
  }, [products, categoryFilter, statusFilter]);

  const statusVariant = (status: Product['status']) => {
    switch (status) {
      case 'In Stock': return 'success';
      case 'Low Stock': return 'warning';
      case 'Out of Stock': return 'critical';
      case 'Overstocked': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Product Catalog</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">{formatNumber(products.length)} products across {categories.length} categories</p>
      </div>

      <DataTable<Product>
        data={filtered}
        searchPlaceholder="Search products by name, SKU, or category..."
        searchKey={(item) => `${item.name} ${item.sku} ${item.category}`}
        pageSize={12}
        filterSlot={
          <>
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} options={[{ value: 'all', label: 'All Categories' }, ...categories.map((c) => ({ value: c, label: c }))]} className="w-40 text-xs" />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: 'all', label: 'All Status' }, { value: 'In Stock', label: 'In Stock' }, { value: 'Low Stock', label: 'Low Stock' }, { value: 'Out of Stock', label: 'Out of Stock' }, { value: 'Overstocked', label: 'Overstocked' }]} className="w-36 text-xs" />
          </>
        }
        columns={[
          {
            key: 'product', header: 'Product', className: 'min-w-[240px]',
            render: (item) => (
              <div className="flex items-center gap-3">
                <CategoryIcon category={item.category} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{item.sku}</p>
                </div>
              </div>
            ),
          },
          { key: 'category', header: 'Category', render: (item) => <span className="text-xs font-medium text-slate-600">{item.category}</span> },
          {
            key: 'status', header: 'Status',
            render: (item) => <Badge variant={statusVariant(item.status)} className="text-[10px] font-bold">{item.status}</Badge>,
          },
          { key: 'currentStock', header: 'Stock', sortable: true, render: (item) => <span className="text-sm font-bold text-slate-700 font-mono">{formatNumber(item.currentStock)}</span> },
          { key: 'price', header: 'Price', sortable: true, render: (item) => <span className="text-sm font-medium text-slate-600">{formatCurrency(item.price)}</span> },
          { key: 'cost', header: 'Cost', render: (item) => <span className="text-sm font-medium text-slate-400">{formatCurrency(item.cost)}</span> },
        ]}
      />
    </div>
  );
}
