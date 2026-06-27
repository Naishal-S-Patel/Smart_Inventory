import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ─── Token Storage ─────────────────────────────────────────────
export const TOKEN_KEY = 'si_access_token';
export const REFRESH_KEY = 'si_refresh_token';

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);
export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
};
export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

// ─── Backend API Client (Spring Boot :8080) ────────────────────
export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── ML API Client (FastAPI :8000) ────────────────────────────
export const mlApi = axios.create({
  baseURL: '/ml',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ─── Request interceptor — attach Bearer token ────────────────
const attachToken = (config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(attachToken);
mlApi.interceptors.request.use(attachToken);

// ─── Response interceptor — auto-refresh on 401 ───────────────
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }
    original._retry = true;
    isRefreshing = true;
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');
      const { data } = await axios.post<{ success: boolean; data: { accessToken: string; refreshToken: string } }>(
        '/api/v1/auth/refresh',
        { refreshToken },
      );
      setTokens(data.data.accessToken, data.data.refreshToken);
      processQueue(null, data.data.accessToken);
      original.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearTokens();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
