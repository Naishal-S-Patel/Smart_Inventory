import { api } from '@/lib/apiClient';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface AuditLogDTO {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  entityId: string;
  details: string;
  ipAddress: string;
  oldValue: string | null;
  newValue: string | null;
}

export const auditLogService = {
  async getAll(): Promise<AuditLogDTO[]> {
    const { data } = await api.get<ApiResponse<AuditLogDTO[]>>('/audit-logs');
    return data.data;
  },
};
