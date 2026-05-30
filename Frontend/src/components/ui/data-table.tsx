import * as React from 'react';
import { cn } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKey?: (item: T) => string;
  pageSize?: number;
  className?: string;
  filterSlot?: React.ReactNode;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { id?: string }>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  searchKey,
  pageSize = 10,
  className,
  filterSlot,
  onRowClick,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  // Filter
  const filtered = React.useMemo(() => {
    if (!search || !searchKey) return data;
    const q = search.toLowerCase();
    return data.filter((item) => searchKey(item).toLowerCase().includes(q));
  }, [data, search, searchKey]);

  // Sort (simple string/number comparison)
  const sorted = React.useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || '');
      const bStr = String(bVal || '');
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
          />
        </div>
        {filterSlot && <div className="flex items-center gap-2 shrink-0">{filterSlot}</div>}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-enterprise">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={cn(
                      'py-3 px-5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider select-none',
                      col.sortable && 'cursor-pointer hover:text-slate-700',
                      col.className
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && sortKey === col.key && (
                        <span className="text-emerald-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-sm text-slate-400 font-medium">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginated.map((item, idx) => (
                  <tr
                    key={(item as any).id || idx}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      'hover:bg-slate-50/60 transition-colors text-sm',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={cn('py-3.5 px-5', col.className)}>
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 bg-slate-50/30">
            <p className="text-xs font-medium text-slate-500">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)} of {sorted.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'flex items-center justify-center h-8 w-8 rounded-lg text-xs font-semibold transition-colors',
                      page === currentPage
                        ? 'bg-emerald-500 text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
