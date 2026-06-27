import { api } from '@/lib/apiClient';

interface ApiResponse<T> { success: boolean; data: T; message: string; }

export interface PurchaseOrderItemDTO {
  id: string;
  productId: string;
  product: { id: string; name: string; sku: string } | null;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity: number;
}

export interface PurchaseOrderDTO {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier: { id: string; companyName: string } | null;
  warehouseId: string;
  warehouse: { id: string; name: string } | null;
  status: string;
  totalAmount: number;
  expectedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  createdBy: string | null;
  approvedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: PurchaseOrderItemDTO[];
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const purchaseOrderService = {
  async getAll(params?: { status?: string; supplierId?: string; warehouseId?: string; page?: number; size?: number }): Promise<PagedResponse<PurchaseOrderDTO>> {
    const { data } = await api.get<ApiResponse<PagedResponse<PurchaseOrderDTO>>>('/purchase-orders', { params });
    return data.data;
  },

  async getById(id: string): Promise<PurchaseOrderDTO> {
    const { data } = await api.get<ApiResponse<PurchaseOrderDTO>>(`/purchase-orders/${id}`);
    return data.data;
  },

  async create(payload: { supplierId: string; warehouseId: string; expectedDeliveryDate?: string; notes?: string; items: { productId: string; quantity: number; unitCost: number }[] }): Promise<PurchaseOrderDTO> {
    const { data } = await api.post<ApiResponse<PurchaseOrderDTO>>('/purchase-orders', payload);
    return data.data;
  },

  async approve(id: string, notes?: string): Promise<PurchaseOrderDTO> {
    const { data } = await api.put<ApiResponse<PurchaseOrderDTO>>(`/purchase-orders/${id}/approve`, { notes });
    return data.data;
  },

  async send(id: string): Promise<PurchaseOrderDTO> {
    const { data } = await api.put<ApiResponse<PurchaseOrderDTO>>(`/purchase-orders/${id}/send`);
    return data.data;
  },

  async receive(id: string, items?: { productId: string; receivedQuantity: number }[], notes?: string): Promise<PurchaseOrderDTO> {
    const { data } = await api.put<ApiResponse<PurchaseOrderDTO>>(`/purchase-orders/${id}/receive`, { items: items ?? [], notes });
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/purchase-orders/${id}`);
  },
};
