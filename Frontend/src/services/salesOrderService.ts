import { api } from '@/lib/apiClient';

export interface SalesOrderItemDTO {
  id: string;
  productId: string;
  product: { id: string; name: string; sku: string } | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SalesOrderDTO {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: { id: string; fullName: string } | null;
  warehouseId: string;
  warehouse: { id: string; name: string } | null;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  items: SalesOrderItemDTO[];
}

export interface SOCreatePayload {
  customerId: string;
  warehouseId: string;
  paymentMethod: string;
  notes?: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const salesOrderService = {
  async getAll(params?: {
    status?: string;
    customerId?: string;
    warehouseId?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<SalesOrderDTO>> {
    const { data } = await api.get<PagedResponse<SalesOrderDTO>>('/sales-orders', { params });
    return data;
  },

  async getById(id: string): Promise<SalesOrderDTO> {
    const { data } = await api.get<SalesOrderDTO>(`/sales-orders/${id}`);
    return data;
  },

  async create(payload: SOCreatePayload): Promise<SalesOrderDTO> {
    const { data } = await api.post<SalesOrderDTO>('/sales-orders', payload);
    return data;
  },

  async confirm(id: string): Promise<SalesOrderDTO> {
    const { data } = await api.put<SalesOrderDTO>(`/sales-orders/${id}/confirm`);
    return data;
  },

  async complete(id: string): Promise<SalesOrderDTO> {
    const { data } = await api.put<SalesOrderDTO>(`/sales-orders/${id}/complete`);
    return data;
  },

  async cancel(id: string): Promise<SalesOrderDTO> {
    const { data } = await api.put<SalesOrderDTO>(`/sales-orders/${id}/cancel`);
    return data;
  },
};
