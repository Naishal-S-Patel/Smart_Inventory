import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService, SupplierDTO } from '@/services/supplierService';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
import { Mail, Phone, MapPin, Clock, Plus, Pencil, Trash2, Building2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

// ─── Supplier Form ────────────────────────────────────────────────────────────
interface SupplierFormProps {
  initial?: Partial<SupplierDTO>;
  onSubmit: (payload: Record<string, unknown>) => void;
  loading: boolean;
}

function SupplierForm({ initial, onSubmit, loading }: SupplierFormProps) {
  const [form, setForm] = React.useState({
    supplierCode: initial?.supplierCode ?? '',
    companyName: initial?.companyName ?? '',
    contactPerson: initial?.contactPerson ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    address: initial?.address ?? '',
    city: initial?.city ?? '',
    state: initial?.state ?? '',
    country: initial?.country ?? '',
    avgLeadDays: initial?.avgLeadDays?.toString() ?? '',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      avgLeadDays: form.avgLeadDays ? parseInt(form.avgLeadDays) : undefined,
    });
  };

  const field = (label: string, key: string, type = 'text', placeholder = '', required = false) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600">{label}{required ? ' *' : ''}</label>
      <Input
        type={type}
        placeholder={placeholder}
        value={(form as Record<string, string>)[key]}
        onChange={(e) => set(key, e.target.value)}
        required={required}
      />
    </div>
  );

  return (
    <form id="supplier-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {field('Company Name', 'companyName', 'text', 'e.g. Acme Corp Ltd', true)}
        {field('Supplier Code', 'supplierCode', 'text', 'e.g. SUP-001', true)}
      </div>
      {field('Contact Person', 'contactPerson', 'text', 'Primary contact name')}
      <div className="grid grid-cols-2 gap-3">
        {field('Email', 'email', 'email', 'supplier@company.com')}
        {field('Phone', 'phone', 'tel', '+91 98765 43210')}
      </div>
      {field('Address', 'address', 'text', 'Street address')}
      <div className="grid grid-cols-3 gap-3">
        {field('City', 'city', 'text', 'Mumbai')}
        {field('State', 'state', 'text', 'Maharashtra')}
        {field('Country', 'country', 'text', 'India')}
      </div>
      {field('Avg Lead Days', 'avgLeadDays', 'number', '7')}
      <DialogFooter>
        <Button type="submit" form="supplier-form" loading={loading}>
          {initial?.id ? 'Save Changes' : 'Add Supplier'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Suppliers() {
  const [dialog, setDialog] = React.useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = React.useState<SupplierDTO | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierService.getAll({ size: 100, isActive: true }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['suppliers'] });

  const createMutation = useMutation({
    mutationFn: (p: Parameters<typeof supplierService.create>[0]) => supplierService.create(p),
    onSuccess: () => { toast.success('Supplier added'); invalidate(); setDialog(null); },
    onError: () => toast.error('Failed to add supplier'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      supplierService.update(id, payload as Parameters<typeof supplierService.update>[1]),
    onSuccess: () => { toast.success('Supplier updated'); invalidate(); setDialog(null); },
    onError: () => toast.error('Failed to update supplier'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supplierService.delete(id),
    onSuccess: () => { toast.success('Supplier removed'); invalidate(); setDialog(null); },
    onError: () => toast.error('Failed to remove supplier'),
  });

  const suppliers = data?.content ?? [];

  const openEdit = (s: SupplierDTO) => { setSelected(s); setDialog('edit'); };
  const openDelete = (s: SupplierDTO) => { setSelected(s); setDialog('delete'); };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Suppliers</h1>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-52 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Suppliers</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {suppliers.length} active supplier partnership{suppliers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setDialog('create')} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">
          Failed to load suppliers. Make sure the backend is running on port 8080.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-card-hover hover:border-emerald-200/60 transition-all group">
            <CardContent className="p-5 space-y-4">
              {/* Header row */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 shrink-0">
                    <Building2 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{supplier.companyName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{supplier.contactPerson ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(supplier)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                    title="Edit supplier"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => openDelete(supplier)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                    title="Remove supplier"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <Badge variant={supplier.isActive ? 'success' : 'secondary'} className="text-[10px] font-bold">
                    {supplier.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {/* Lead time bar */}
              {supplier.avgLeadDays != null && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500">Avg Lead Time</span>
                    <span className="font-bold text-slate-700">{supplier.avgLeadDays} days</span>
                  </div>
                  <Progress
                    value={Math.min(100, (supplier.avgLeadDays / 30) * 100)}
                    indicatorClassName={
                      supplier.avgLeadDays <= 7 ? 'bg-emerald-500' :
                      supplier.avgLeadDays <= 14 ? 'bg-amber-500' : 'bg-red-500'
                    }
                  />
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-center py-2 border-t border-b border-slate-100">
                <div>
                  <p className="text-base font-extrabold text-slate-700 font-mono">{supplier.supplierCode}</p>
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Code</p>
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-700">
                    {supplier.avgLeadDays ?? '—'}{supplier.avgLeadDays != null && 'd'}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Lead Time</p>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-1.5 text-[11px] text-slate-500">
                {supplier.email && (
                  <a
                    href={`mailto:${supplier.email}`}
                    className="flex items-center gap-2 hover:text-emerald-600 transition-colors group/link"
                  >
                    <Mail className="h-3 w-3 text-slate-400 shrink-0 group-hover/link:text-emerald-500" />
                    <span className="truncate">{supplier.email}</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover/link:opacity-100 shrink-0" />
                  </a>
                )}
                {supplier.phone && (
                  <a
                    href={`tel:${supplier.phone}`}
                    className="flex items-center gap-2 hover:text-emerald-600 transition-colors group/link"
                  >
                    <Phone className="h-3 w-3 text-slate-400 shrink-0 group-hover/link:text-emerald-500" />
                    <span>{supplier.phone}</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover/link:opacity-100 shrink-0" />
                  </a>
                )}
                {(supplier.city || supplier.country) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>{[supplier.city, supplier.state, supplier.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {supplier.avgLeadDays != null && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>{supplier.avgLeadDays} day avg lead time</span>
                  </div>
                )}
              </div>

              {/* Contact button */}
              {supplier.email && (
                <a
                  href={`mailto:${supplier.email}?subject=Purchase Inquiry — ${supplier.companyName}`}
                  className="block w-full text-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg py-2 transition-colors"
                >
                  Contact Supplier
                </a>
              )}
            </CardContent>
          </Card>
        ))}

        {suppliers.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12 text-slate-400 text-sm">
            No suppliers found.
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialog === 'create'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>Register a new supplier partnership</DialogDescription>
          </DialogHeader>
          <SupplierForm
            onSubmit={(p) => createMutation.mutate(p as Parameters<typeof supplierService.create>[0])}
            loading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={dialog === 'edit'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>Update details for {selected?.companyName}</DialogDescription>
          </DialogHeader>
          {selected && (
            <SupplierForm
              initial={selected}
              onSubmit={(p) => updateMutation.mutate({ id: selected.id, payload: p })}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={dialog === 'delete'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{selected?.companyName}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() => selected && deleteMutation.mutate(selected.id)}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
