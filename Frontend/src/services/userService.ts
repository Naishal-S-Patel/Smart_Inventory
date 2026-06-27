import { api } from '@/lib/apiClient';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  lastLogin: string | null;
}

export const userService = {
  async getAll(): Promise<UserDTO[]> {
    const { data } = await api.get<ApiResponse<UserDTO[]>>('/users');
    return data.data;
  },
};
