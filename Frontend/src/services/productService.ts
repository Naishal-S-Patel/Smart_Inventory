import { api } from '@/lib/apiClient';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface ProductDTO {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: { id: string; name: string } | null;
  unitCost: number;
  sellingPrice: number;
  unitOfMeasure: string;
  reorderPoint: number;
  maxStockLevel: number;
  barcode: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreatePayload {
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  unitCost: number;
  sellingPrice: number;
  unitOfMeasure?: string;
  reorderPoint?: number;
  maxStockLevel?: number;
  barcode?: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const productService = {
  async getAll(params?: {
    page?: number;
    size?: number;
    search?: string;
    categoryId?: string;
    isActive?: boolean;
  }): Promise<PagedResponse<ProductDTO>> {
    const { data } = await api.get<ApiResponse<PagedResponse<ProductDTO>>>('/products', {
      params: { q: params?.search, categoryId: params?.categoryId, page: params?.page, size: params?.size },
    });
    return data.data;
  },

  async getById(id: string): Promise<ProductDTO> {
    const { data } = await api.get<ApiResponse<ProductDTO>>(`/products/${id}`);
    return data.data;
  },

  async create(payload: ProductCreatePayload): Promise<ProductDTO> {
    const { data } = await api.post<ApiResponse<ProductDTO>>('/products', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<ProductCreatePayload>): Promise<ProductDTO> {
    const { data } = await api.put<ApiResponse<ProductDTO>>(`/products/${id}`, payload);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};
