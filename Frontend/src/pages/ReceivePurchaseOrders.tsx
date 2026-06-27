import { useQuery } from '@tanstack/react-query';
import { purchaseOrderService, PurchaseOrderDTO } from '@/services/purchaseOrderService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PackageCheck, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ReceivePurchaseOrders() {
  const { data: purchaseOrdersPage, isLoading, refetch } = useQuery({
    queryKey: ['purchase-orders-pending'],
    queryFn: () => purchaseOrderService.getAll({ size: 100 }),
  });

  const pendingPOs = (purchaseOrdersPage?.content ?? []).filter(
    (po) => po.status === 'Sent' || po.status === 'Approved'
  );

  const handleReceive = async (po: PurchaseOrderDTO) => {
    try {
      const itemsPayload = po.items.map((item) => ({
        productId: item.productId,
        receivedQuantity: item.quantity - item.receivedQuantity,
      }));
      await purchaseOrderService.receive(po.id, itemsPayload, 'Received entire shipment');
      toast.success(`Purchase order ${po.orderNumber} received successfully`);
      refetch();
    } catch (error) {
      console.error(error);
      toast.error(`Failed to receive purchase order ${po.orderNumber}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Receive Orders</h1>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Receive Orders</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Check-in incoming shipments and update inventory</p>
      </div>

      {pendingPOs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-50 mb-4">
              <Check className="h-7 w-7 text-emerald-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">All caught up!</h3>
            <p className="text-xs text-slate-400 mt-1">No pending shipments to receive right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pendingPOs.map((po) => {
            return (
              <Card key={po.id} className="hover:shadow-card-hover hover:border-emerald-200/60 transition-all">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{po.orderNumber}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">{po.supplier?.companyName || 'Unknown Supplier'}</p>
                    </div>
                    <Badge variant={po.status === 'Sent' ? 'info' : 'warning'} className="text-[10px] font-bold">
                      {po.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 border-t border-b border-slate-100 py-3">
                    {po.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 truncate max-w-[160px]">
                          {item.product?.name || `Product ID: ${item.productId.substring(0, 8)}`}
                        </span>
                        <span className="font-mono font-bold text-slate-700">
                          {item.quantity - item.receivedQuantity} / {item.quantity} units
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>{po.items.reduce((s, i) => s + (i.quantity - i.receivedQuantity), 0)} units to receive</span>
                    <span>{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : '—'}</span>
                  </div>

                  {po.status === 'Sent' && (
                    <Button
                      onClick={() => handleReceive(po)}
                      className="w-full text-xs"
                    >
                      <PackageCheck className="h-4 w-4 mr-2" />
                      Receive Shipment
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
