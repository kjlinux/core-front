import apiClient from './client'
import type { PaginatedResponse, PaginationParams } from '@/types'
import type { BiometricDevice, FingerprintEnrollment } from '@/types'

export const biometricApi = {
  getDevices(params?: PaginationParams): Promise<PaginatedResponse<BiometricDevice>> {
    return apiClient.get('/biometric/devices', { params }).then((r) => r.data)
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

  getEnrollments(params?: PaginationParams): Promise<PaginatedResponse<FingerprintEnrollment>> {
    return apiClient.get('/biometric/enrollments', { params }).then((r) => r.data)
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
