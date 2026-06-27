import { api } from '@/lib/apiClient';

interface ApiResponse<T> { success: boolean; data: T; message: string; }

export interface InventoryDTO {
  productId: string;
  warehouseId: string;
  product: { id: string; name: string; sku: string } | null;
  warehouse: { id: string; name: string; code: string } | null;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastUpdatedAt: string;
}

export interface InventoryTransactionDTO {
  id: string;
  productId: string;
  productName: string | null;
  sku: string | null;
  warehouseId: string;
  warehouseName: string | null;
  transactionType: string;
  quantity: number;
  createdAt: string;
  referenceId: string | null;
  referenceType: string | null;
  notes: string | null;
  createdBy: string | null;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const inventoryService = {
  async getAll(params?: { productId?: string; warehouseId?: string; page?: number; size?: number }): Promise<PagedResponse<InventoryDTO>> {
    const { data } = await api.get<ApiResponse<PagedResponse<InventoryDTO>>>('/inventory', { params });
    return data.data;
  },

  async getLowStock(params?: { warehouseId?: string; page?: number; size?: number }): Promise<PagedResponse<InventoryDTO>> {
    const { data } = await api.get<ApiResponse<PagedResponse<InventoryDTO>>>('/inventory/low-stock', { params });
    return data.data;
  },

  async getTransactions(params?: { productId?: string; warehouseId?: string; transactionType?: string; page?: number; size?: number }): Promise<PagedResponse<InventoryTransactionDTO>> {
    const { data } = await api.get<ApiResponse<PagedResponse<InventoryTransactionDTO>>>('/inventory/transactions', { params });
    return data.data;
  },

  async adjust(payload: { productId: string; warehouseId: string; quantity: number; transactionType: string; notes?: string }): Promise<InventoryDTO> {
    const { data } = await api.post<ApiResponse<InventoryDTO>>('/inventory/adjust', payload);
    return data.data;
  },

  async transfer(payload: { productId: string; sourceWarehouseId: string; destinationWarehouseId: string; quantity: number; notes?: string }): Promise<void> {
    await api.post('/inventory/transfer', payload);
  },
};
