import apiClient from './client'
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types'

export const biometricApi = {
  getDevices(params?: PaginationParams): Promise<PaginatedResponse<unknown>> {
    return apiClient.get('/biometric/devices', { params }).then((r) => r.data)
  },

  getDevice(id: number): Promise<ApiResponse<unknown>> {
    return apiClient.get(`/biometric/devices/${id}`).then((r) => r.data)
  },

  getEnrollments(params?: PaginationParams): Promise<PaginatedResponse<unknown>> {
    return apiClient.get('/biometric/enrollments', { params }).then((r) => r.data)
  },

  startEnrollment(data: { employeeId: number; deviceId: number }): Promise<ApiResponse<unknown>> {
    return apiClient.post('/biometric/enrollments', data).then((r) => r.data)
  },

  getHistory(params?: PaginationParams): Promise<PaginatedResponse<unknown>> {
    return apiClient.get('/biometric/history', { params }).then((r) => r.data)
  },

  getInconsistencies(params?: PaginationParams): Promise<PaginatedResponse<unknown>> {
    return apiClient.get('/biometric/inconsistencies', { params }).then((r) => r.data)
  },

  getAuditLog(params?: PaginationParams): Promise<PaginatedResponse<unknown>> {
    return apiClient.get('/biometric/audit-log', { params }).then((r) => r.data)
  },
}
