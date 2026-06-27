import { api, setTokens, clearTokens } from '@/lib/apiClient';

// Backend wraps all responses in ApiResponse<T>
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
    setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data;
  },

  async logout(refreshToken: string) {
    try {
      await api.post('/auth/logout', { refreshToken });
    } finally {
      clearTokens();
    }
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { data } = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', { refreshToken });
    setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data;
  },
};
