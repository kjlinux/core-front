import apiClient from './client'
import type { QrCode, QrAttendanceRecord, QrCodeStats, QrCodeFilters } from '@/types'
import type { PaginatedResponse } from '@/types'

export const qrcodeApi = {
  getAll(params?: QrCodeFilters): Promise<PaginatedResponse<QrCode>> {
    return apiClient.get('/qr-codes', { params }).then((r) => r.data)
  },

  getById(id: string): Promise<QrCode> {
    return apiClient.get(`/qr-codes/${id}`).then((r) => r.data)
  },

  generate(employeeId: string): Promise<QrCode> {
    return apiClient.post('/qr-codes/generate', { employeeId }).then((r) => r.data)
  },

  revoke(id: string): Promise<void> {
    return apiClient.delete(`/qr-codes/${id}`).then((r) => r.data)
  },

  getStats(): Promise<QrCodeStats> {
    return apiClient.get('/qr-codes/stats').then((r) => r.data)
  },

  getAttendance(params?: {
    date?: string
    employeeId?: string
    status?: string
    page?: number
    perPage?: number
  }): Promise<PaginatedResponse<QrAttendanceRecord>> {
    return apiClient.get('/qr-attendance', { params }).then((r) => r.data)
  },

  simulateScan(token: string): Promise<QrAttendanceRecord> {
    return apiClient.post('/qr-attendance/scan', { token }).then((r) => r.data)
  },
}
