import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseService, WarehouseDTO } from '@/services/warehouseService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { MapPin, Package, Hash, Plus, Pencil, Warehouse } from 'lucide-react';
import { toast } from 'sonner';

// ─── Warehouse Form ───────────────────────────────────────────────────────────
interface WhFormProps {
  initial?: Partial<WarehouseDTO>;
  onSubmit: (payload: Record<string, unknown>) => void;
  loading: boolean;
}

function WarehouseForm({ initial, onSubmit, loading }: WhFormProps) {
  const [form, setForm] = React.useState({
    name: initial?.name ?? '',
    code: initial?.code ?? '',
    address: initial?.address ?? '',
    city: initial?.city ?? '',
    state: initial?.state ?? '',
    country: initial?.country ?? '',
    capacity: initial?.capacity?.toString() ?? '',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, capacity: parseInt(form.capacity) || 0 });
  };

  const field = (label: string, key: string, placeholder = '', required = false) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600">{label}{required ? ' *' : ''}</label>
      <Input
        placeholder={placeholder}
        value={(form as Record<string, string>)[key]}
        onChange={(e) => set(key, e.target.value)}
        required={required}
      />
    </div>
  );

  return (
    <form id="wh-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {field('Warehouse Name', 'name', 'e.g. Mumbai Central Hub', true)}
        {field('Code', 'code', 'e.g. MUM-01', true)}
      </div>
      {field('Address', 'address', 'Street address')}
      <div className="grid grid-cols-2 gap-3">
        {field('City', 'city', 'e.g. Mumbai', true)}
        {field('State', 'state', 'e.g. Maharashtra')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {field('Country', 'country', 'e.g. India')}
        {field('Capacity (units)', 'capacity', '1000', true)}
      </div>
      <DialogFooter>
        <Button type="submit" form="wh-form" loading={loading}>
          {initial?.id ? 'Save Changes' : 'Create Warehouse'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Warehouses() {
  const [dialog, setDialog] = React.useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = React.useState<WarehouseDTO | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehouseService.getAll({ size: 100 }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['warehouses'] });

  const createMutation = useMutation({
    mutationFn: (p: Parameters<typeof warehouseService.create>[0]) => warehouseService.create(p),
    onSuccess: () => { toast.success('Warehouse created'); invalidate(); setDialog(null); },
    onError: () => toast.error('Failed to create warehouse'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      warehouseService.update(id, payload as Parameters<typeof warehouseService.update>[1]),
    onSuccess: () => { toast.success('Warehouse updated'); invalidate(); setDialog(null); },
    onError: () => toast.error('Failed to update warehouse'),
  });

  const warehouses = data?.content ?? [];

  const openEdit = (wh: WarehouseDTO) => { setSelected(wh); setDialog('edit'); };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Warehouses</h1>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Warehouses</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {warehouses.length} distribution center{warehouses.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setDialog('create')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Warehouse
        </Button>
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">
          Failed to load warehouses. Make sure the backend is running on port 8080.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((wh) => (
          <Card key={wh.id} className="hover:shadow-card-hover hover:border-emerald-200/60 transition-all group">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 shrink-0 mt-0.5">
                    <Warehouse className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{wh.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      <span>{wh.city}{wh.state ? `, ${wh.state}` : ''}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(wh)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                    title="Edit warehouse"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <Badge
                    variant={wh.isActive ? 'success' : 'secondary'}
                    className="text-[10px] font-bold capitalize"
                  >
                    {wh.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-500">Capacity</span>
                  <span className="font-bold text-slate-700">{wh.capacity.toLocaleString()} units max</span>
                </div>
                <Progress value={50} indicatorClassName="bg-emerald-500" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-slate-400" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Code</p>
                    <p className="text-xs font-semibold text-slate-700 font-mono">{wh.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-slate-400" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Max Capacity</p>
                    <p className="text-xs font-semibold text-slate-700">{wh.capacity.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {warehouses.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12 text-slate-400 text-sm">
            No warehouses found.
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialog === 'create'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Warehouse</DialogTitle>
            <DialogDescription>Add a new distribution center to the network</DialogDescription>
          </DialogHeader>
          <WarehouseForm
            onSubmit={(p) => createMutation.mutate(p as unknown as Parameters<typeof warehouseService.create>[0])}
            loading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={dialog === 'edit'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Warehouse</DialogTitle>
            <DialogDescription>Update details for {selected?.name}</DialogDescription>
          </DialogHeader>
          {selected && (
            <WarehouseForm
              initial={selected}
              onSubmit={(p) => updateMutation.mutate({ id: selected.id, payload: p })}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
