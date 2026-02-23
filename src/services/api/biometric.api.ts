import apiClient from './client'
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types'
import type { BiometricDevice, FingerprintEnrollment, BiometricAuditEntry } from '@/types'

export const biometricApi = {
  getDevices(params?: PaginationParams): Promise<PaginatedResponse<BiometricDevice>> {
    return apiClient.get('/biometric/devices', { params }).then((r) => r.data)
  },

  getDevice(id: string): Promise<ApiResponse<BiometricDevice>> {
    return apiClient.get(`/biometric/devices/${id}`).then((r) => r.data)
  },

  createDevice(data: Partial<BiometricDevice>): Promise<ApiResponse<BiometricDevice>> {
    return apiClient.post('/biometric/devices', data).then((r) => r.data)
  },

  deleteDevice(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/biometric/devices/${id}`).then((r) => r.data)
  },

  syncDevice(id: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/biometric/devices/${id}/sync`).then((r) => r.data)
  },

  getEnrollments(params?: PaginationParams): Promise<PaginatedResponse<FingerprintEnrollment>> {
    return apiClient.get('/biometric/enrollments', { params }).then((r) => r.data)
  },

  startEnrollment(data: Partial<FingerprintEnrollment>): Promise<ApiResponse<FingerprintEnrollment>> {
    return apiClient.post('/biometric/enrollments', data).then((r) => r.data)
  },

  deleteEnrollment(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/biometric/enrollments/${id}`).then((r) => r.data)
  },

  getInconsistencies(params?: PaginationParams): Promise<PaginatedResponse<Record<string, unknown>>> {
    return apiClient.get('/biometric/inconsistencies', { params }).then((r) => r.data)
  },

  getAuditLog(params?: PaginationParams): Promise<PaginatedResponse<BiometricAuditEntry>> {
    return apiClient.get('/biometric/audit-log', { params }).then((r) => r.data)
  },
}
