import apiClient from './client'
import { useAuthStore } from '@/stores/auth.store'
import { useActiveCompanyStore } from '@/stores/active-company.store'
import type {
  QrCode,
  QrAttendanceRecord,
  QrCodeStats,
  QrCodeFilters,
  QrScanPayload,
  DeviceIdentifyResponse,
} from '@/types'
import type { PaginatedResponse } from '@/types'

function toSnakeFilters(params?: QrCodeFilters): Record<string, unknown> | undefined {
  if (!params) return undefined
  const result: Record<string, unknown> = {}
  if (params.siteId !== undefined) result.site_id = params.siteId
  if (params.isActive !== undefined) result.is_active = params.isActive
  if (params.search !== undefined) result.search = params.search
  if (params.page !== undefined) result.page = params.page
  if (params.perPage !== undefined) result.per_page = params.perPage
  return result
}

export const qrcodeApi = {
  getAll(params?: QrCodeFilters): Promise<PaginatedResponse<QrCode>> {
    return apiClient.get('/qr-codes', { params: toSnakeFilters(params) }).then((r) => r.data)
  },

  getById(id: string): Promise<QrCode> {
    return apiClient.get(`/qr-codes/${id}`).then((r) => r.data)
  },

  /** Génère un QR Code pour un site (remplace l'ancien) */
  generate(siteId: string, label?: string): Promise<QrCode> {
    // Pour un super_admin, le back exige company_id ; on l'envoie depuis
    // l'entreprise active. Pour les autres roles, le back l'infere depuis l'auth.
    const payload: Record<string, unknown> = { siteId, label }
    try {
      const auth = useAuthStore()
      if (auth.isSuperAdmin) {
        const activeCompanyId = useActiveCompanyStore().activeCompanyId
        if (activeCompanyId) {
          payload.companyId = activeCompanyId
        }
      }
    } catch { /* stores hors contexte Pinia (ex: tests) */ }
    return apiClient.post('/qr-codes/generate', payload).then((r) => r.data)
  },

  revoke(id: string): Promise<void> {
    return apiClient.delete(`/qr-codes/${id}`).then((r) => r.data)
  },

  getStats(): Promise<QrCodeStats> {
    return apiClient.get('/qr-codes/stats').then((r) => r.data)
  },

  getAttendance(params?: {
    date?: string
    startDate?: string
    endDate?: string
    employeeId?: string
    status?: string
    gpsVerified?: boolean
    page?: number
    perPage?: number
  }): Promise<PaginatedResponse<QrAttendanceRecord>> {
    return apiClient.get('/qr-attendance', { params }).then((r) => r.data)
  },

  /** Scan depuis le téléphone de l'employé - token du site + fingerprint + GPS */
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

  /** Crée une session d'enrôlement QR (admin) */
  createEnrollSession(employeeId: string): Promise<{
    sessionToken: string
    employeeId: string
    employeeName: string
    expiresIn: number
  }> {
    return apiClient.post('/enroll-session', { employeeId }).then((r) => r.data)
  },

  /** Poll le statut d'une session d'enrôlement (admin) */
  getEnrollSession(sessionToken: string): Promise<{
    status: 'pending' | 'completed'
    employeeName: string
    fingerprint: string | null
    deviceInfo: string | null
  }> {
    return apiClient.get(`/enroll-session/${sessionToken}`).then((r) => r.data)
  },

  /** Soumet le fingerprint depuis le téléphone de l'employé (sans auth) */
  submitEnrollSession(sessionToken: string, deviceFingerprint: string, deviceInfo?: string): Promise<void> {
    return apiClient.post(`/enroll-session/${sessionToken}/submit`, { deviceFingerprint, deviceInfo }).then((r) => r.data)
  },
}
