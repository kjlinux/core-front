import type { AttendanceStatus } from './enums'

/** QR Code affiché physiquement sur un site (un seul actif par site) */
export interface QrCode {
  id: string
  companyId: string
  siteId?: string
  siteName?: string
  label?: string
  token: string
  isActive: boolean
  generatedAt: string
  expiresAt?: string
  createdAt: string
}

/** Enregistrement de pointage QR — lié à un employé via son device_fingerprint */
export interface QrAttendanceRecord {
  id: string
  employeeId: string
  employeeName?: string
  qrCodeId: string
  companyId: string
  date: string
  entryTime?: string
  exitTime?: string
  status: AttendanceStatus
  scannedAt: string
  notes?: string
  gpsVerified: boolean
  distanceMeters?: number
  scanLatitude?: number
  scanLongitude?: number
  createdAt: string
}

export interface QrCodeStats {
  totalQrCodes: number
  activeQrCodes: number
  enrolledDevices: number
  totalEmployees: number
  scansToday: number
  attendanceRate: number
}

export interface QrCodeFilters {
  siteId?: string
  isActive?: boolean
  page?: number
  perPage?: number
}

/** Payload envoyé lors d'un scan depuis le téléphone */
export interface QrScanPayload {
  token: string
  deviceFingerprint: string
  latitude?: number
  longitude?: number
}

/** Réponse de l'endpoint d'identification d'appareil */
export interface DeviceIdentifyResponse {
  enrolled: boolean
  employeeId?: string
  employeeName?: string
}
