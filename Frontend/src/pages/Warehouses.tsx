import { useInventoryStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, User, Package } from 'lucide-react';

export default function Warehouses() {
  const warehouses = useInventoryStore((s) => s.warehouses);
  const products = useInventoryStore((s) => s.products);

  const getProductCount = (whId: string) => products.filter((p) => (p.warehouseStockMap[whId] || 0) > 0).length;
  const getUtilization = (wh: typeof warehouses[0]) => Math.round((wh.usedCapacity / wh.capacity) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Warehouses</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">{warehouses.length} distribution centers across the network</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((wh) => {
          const util = getUtilization(wh);
          return (
            <Card key={wh.id} className="hover:shadow-card-hover hover:border-emerald-200/60 transition-all">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{wh.name}</h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      <span>{wh.location}</span>
                    </div>
                  </div>
                  <Badge variant={wh.status === 'active' ? 'success' : wh.status === 'full' ? 'critical' : 'warning'} className="text-[10px] font-bold capitalize">
                    {wh.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500">Capacity Utilization</span>
                    <span className={`font-bold ${util >= 90 ? 'text-red-600' : util >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>{util}%</span>
                  </div>
                  <Progress value={util} indicatorClassName={util >= 90 ? 'bg-red-500' : util >= 70 ? 'bg-amber-500' : 'bg-emerald-500'} />
                  <p className="text-[11px] text-slate-400">{wh.usedCapacity.toLocaleString()} / {wh.capacity.toLocaleString()} units</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Manager</p>
                      <p className="text-xs font-semibold text-slate-700">{wh.managerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-slate-400" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Products</p>
                      <p className="text-xs font-semibold text-slate-700">{getProductCount(wh.id)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
