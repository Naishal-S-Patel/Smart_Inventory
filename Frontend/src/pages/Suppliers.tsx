import { useInventoryStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Star, Mail, Phone, MapPin } from 'lucide-react';

export default function Suppliers() {
  const suppliers = useInventoryStore((s) => s.suppliers);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Suppliers</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">{suppliers.length} active supplier partnerships</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-card-hover hover:border-emerald-200/60 transition-all">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{supplier.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{supplier.contactPerson}</p>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-bold text-amber-700">{supplier.rating}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-500">Reliability Score</span>
                  <span className={`font-bold ${supplier.reliabilityScore >= 90 ? 'text-emerald-600' : supplier.reliabilityScore >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                    {supplier.reliabilityScore}%
                  </span>
                </div>
                <Progress value={supplier.reliabilityScore} indicatorClassName={supplier.reliabilityScore >= 90 ? 'bg-emerald-500' : supplier.reliabilityScore >= 80 ? 'bg-amber-500' : 'bg-red-500'} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-2 border-t border-b border-slate-100">
                <div>
                  <p className="text-lg font-extrabold text-slate-700">{supplier.activeOrders}</p>
                  <p className="text-[9px] text-slate-400 font-medium">Active POs</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-slate-700">{supplier.productsSuppliedCount}</p>
                  <p className="text-[9px] text-slate-400 font-medium">Products</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-slate-700">{supplier.leadTimeDays}d</p>
                  <p className="text-[9px] text-slate-400 font-medium">Lead Time</p>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-500">
                <div className="flex items-center gap-2"><Mail className="h-3 w-3 text-slate-400" />{supplier.email}</div>
                <div className="flex items-center gap-2"><Phone className="h-3 w-3 text-slate-400" />{supplier.phone}</div>
                <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-slate-400" />{supplier.address}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
