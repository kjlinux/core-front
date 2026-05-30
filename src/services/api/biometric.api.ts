import apiClient from './client'
import type { PaginatedResponse } from '@/types'
import type { BiometricDevice, FingerprintEnrollment } from '@/types'

export interface BiometricDeviceFilters {
  companyId?: string
  siteId?: string
  isOnline?: boolean
  search?: string
  page?: number
  perPage?: number
}

export interface EnrollmentFilters {
  deviceId?: string
  status?: string
  search?: string
  page?: number
  perPage?: number
}

function toSnakeDeviceFilters(params?: BiometricDeviceFilters): Record<string, unknown> | undefined {
  if (!params) return undefined
  const result: Record<string, unknown> = {}
  if (params.companyId !== undefined) result.company_id = params.companyId
  if (params.siteId !== undefined) result.site_id = params.siteId
  if (params.isOnline !== undefined) result.is_online = params.isOnline
  if (params.search !== undefined) result.search = params.search
  if (params.page !== undefined) result.page = params.page
  if (params.perPage !== undefined) result.per_page = params.perPage
  return result
}

function toSnakeEnrollmentFilters(params?: EnrollmentFilters): Record<string, unknown> | undefined {
  if (!params) return undefined
  const result: Record<string, unknown> = {}
  if (params.deviceId !== undefined) result.device_id = params.deviceId
  if (params.status !== undefined) result.status = params.status
  if (params.search !== undefined) result.search = params.search
  if (params.page !== undefined) result.page = params.page
  if (params.perPage !== undefined) result.per_page = params.perPage
  return result
}

export const biometricApi = {
  getDevices(params?: BiometricDeviceFilters): Promise<PaginatedResponse<BiometricDevice>> {
    return apiClient.get('/biometric/devices', { params: toSnakeDeviceFilters(params) }).then((r) => r.data)
  },

  getDevice(id: string): Promise<BiometricDevice> {
    return apiClient.get(`/biometric/devices/${id}`).then((r) => r.data)
  },

  createDevice(data: Partial<BiometricDevice>): Promise<BiometricDevice> {
    return apiClient.post('/biometric/devices', data).then((r) => r.data)
  },

  deleteDevice(id: string): Promise<void> {
    return apiClient.delete(`/biometric/devices/${id}`).then((r) => r.data)
  },

  setDeviceOnline(id: string, isOnline: boolean): Promise<BiometricDevice> {
    return apiClient.patch(`/biometric/devices/${id}/set-online`, { isOnline }).then((r) => r.data)
  },

  syncDevice(id: string): Promise<void> {
    return apiClient.post(`/biometric/devices/${id}/sync`).then((r) => r.data)
  },

  getEnrollments(params?: EnrollmentFilters): Promise<PaginatedResponse<FingerprintEnrollment>> {
    return apiClient.get('/biometric/enrollments', { params: toSnakeEnrollmentFilters(params) }).then((r) => r.data)
  },

  startEnrollment(data: Partial<FingerprintEnrollment>): Promise<FingerprintEnrollment> {
    return apiClient.post('/biometric/enrollments', data).then((r) => r.data)
  },

  enrollViaDevice(employeeId: string, deviceId: string): Promise<FingerprintEnrollment> {
    return apiClient.post('/biometric/enrollments/enroll', {
      employee_id: employeeId,
      device_id: deviceId,
    }).then((r) => r.data)
  },

  getEnrollment(id: string): Promise<FingerprintEnrollment> {
    return apiClient.get(`/biometric/enrollments/${id}`).then((r) => r.data)
  },

  deleteEnrollment(id: string): Promise<void> {
    return apiClient.delete(`/biometric/enrollments/${id}`).then((r) => r.data)
  },

}
