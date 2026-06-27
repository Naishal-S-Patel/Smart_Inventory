import { api } from '@/lib/apiClient';

interface ApiResponse<T> { success: boolean; data: T; message: string; }

export interface SupplierDTO {
  id: string;
  supplierCode: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  avgLeadDays: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const supplierService = {
  async getAll(params?: { isActive?: boolean; page?: number; size?: number }): Promise<PagedResponse<SupplierDTO>> {
    const { data } = await api.get<ApiResponse<PagedResponse<SupplierDTO>>>('/suppliers', { params });
    return data.data;
  },

  async create(payload: { supplierCode: string; companyName: string; contactPerson?: string; email?: string; phone?: string; avgLeadDays?: number }): Promise<SupplierDTO> {
    const { data } = await api.post<ApiResponse<SupplierDTO>>('/suppliers', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<{ companyName: string; contactPerson: string; email: string; phone: string; avgLeadDays: number }>): Promise<SupplierDTO> {
    const { data } = await api.put<ApiResponse<SupplierDTO>>(`/suppliers/${id}`, payload);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/suppliers/${id}`);
  },
};
