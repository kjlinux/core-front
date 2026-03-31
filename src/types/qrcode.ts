import type { AttendanceStatus } from './enums'

export interface QrCode {
  id: string
  employeeId: string
  employeeName?: string
  companyId: string
  token: string
  isActive: boolean
  generatedAt: string
  expiresAt?: string
  createdAt: string
}

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
  scannedByDeviceId?: string
  notes?: string
  createdAt: string
}

export interface QrCodeStats {
  totalQrCodes: number
  activeQrCodes: number
  scansToday: number
  attendanceRate: number
}

export interface QrCodeFilters {
  employeeId?: string
  isActive?: boolean
  page?: number
  perPage?: number
}
