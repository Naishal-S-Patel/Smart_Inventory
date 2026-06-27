import { api } from '@/lib/apiClient';

interface ApiResponse<T> { success: boolean; data: T; message: string; }

export interface CategoryDTO {
  id: string;
  name: string;
  description: string | null;
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

export const categoryService = {
  async getAll(params?: { page?: number; size?: number }): Promise<PagedResponse<CategoryDTO>> {
    const { data } = await api.get<ApiResponse<PagedResponse<CategoryDTO>>>('/categories', { params });
    return data.data;
  },

  async create(payload: { name: string; description?: string }): Promise<CategoryDTO> {
    const { data } = await api.post<ApiResponse<CategoryDTO>>('/categories', payload);
    return data.data;
  },

  async update(id: string, payload: { name?: string; description?: string }): Promise<CategoryDTO> {
    const { data } = await api.put<ApiResponse<CategoryDTO>>(`/categories/${id}`, payload);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
