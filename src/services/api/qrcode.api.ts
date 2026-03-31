import apiClient from './client'
import type {
  QrCode,
  QrAttendanceRecord,
  QrCodeStats,
  QrCodeFilters,
  QrScanPayload,
  DeviceIdentifyResponse,
} from '@/types'
import type { PaginatedResponse } from '@/types'

export const qrcodeApi = {
  getAll(params?: QrCodeFilters): Promise<PaginatedResponse<QrCode>> {
    return apiClient.get('/qr-codes', { params }).then((r) => r.data)
  },

  getById(id: string): Promise<QrCode> {
    return apiClient.get(`/qr-codes/${id}`).then((r) => r.data)
  },

  /** Génère un QR Code pour un site (remplace l'ancien) */
  generate(siteId: string, label?: string): Promise<QrCode> {
    return apiClient.post('/qr-codes/generate', { siteId, label }).then((r) => r.data)
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
    gpsVerified?: boolean
    page?: number
    perPage?: number
  }): Promise<PaginatedResponse<QrAttendanceRecord>> {
    return apiClient.get('/qr-attendance', { params }).then((r) => r.data)
  },

  /** Scan depuis le téléphone de l'employé — token du site + fingerprint + GPS */
  scan(payload: QrScanPayload): Promise<QrAttendanceRecord> {
    return apiClient.post('/qr-attendance/scan', payload).then((r) => r.data)
  },

  /** Vérifie si un appareil (fingerprint) est enrôlé */
  identifyDevice(deviceFingerprint: string, deviceInfo?: string): Promise<DeviceIdentifyResponse> {
    return apiClient
      .post('/employees/device/identify', { deviceFingerprint, deviceInfo })
      .then((r) => r.data)
  },

  /** Enrôle le téléphone d'un employé (admin/technicien) */
  enrollDevice(employeeId: string, deviceFingerprint: string, deviceInfo?: string): Promise<void> {
    return apiClient
      .post('/employees/device/enroll', { employeeId, deviceFingerprint, deviceInfo })
      .then((r) => r.data)
  },

  /** Révoque l'enrôlement du téléphone d'un employé */
  revokeDevice(employeeId: string): Promise<void> {
    return apiClient.delete(`/employees/${employeeId}/device`).then((r) => r.data)
  },
}
