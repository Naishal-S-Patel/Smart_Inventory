import { api } from '@/lib/apiClient';

interface ApiResponse<T> { success: boolean; data: T; message: string; }

export interface WarehouseDTO {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  country: string;
  address: string;
  capacity: number;
  isActive: boolean;
}

export interface WarehouseCreatePayload {
  name: string;
  code: string;
  address?: string;
  city: string;
  state?: string;
  country?: string;
  capacity: number;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const warehouseService = {
  async getAll(params?: { page?: number; size?: number; isActive?: boolean }): Promise<PagedResponse<WarehouseDTO>> {
    const { data } = await api.get<ApiResponse<PagedResponse<WarehouseDTO>>>('/warehouses', { params });
    return data.data;
  },

  async getById(id: string): Promise<WarehouseDTO> {
    const { data } = await api.get<ApiResponse<WarehouseDTO>>(`/warehouses/${id}`);
    return data.data;
  },

  async create(payload: WarehouseCreatePayload): Promise<WarehouseDTO> {
    const { data } = await api.post<ApiResponse<WarehouseDTO>>('/warehouses', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<WarehouseCreatePayload>): Promise<WarehouseDTO> {
    const { data } = await api.put<ApiResponse<WarehouseDTO>>(`/warehouses/${id}`, payload);
    return data.data;
  },
};
