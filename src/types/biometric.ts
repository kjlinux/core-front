export interface BiometricDevice {
  id: string
  serialNumber: string
  companyId: string
  siteId: string
  name: string
  isOnline: boolean
  lastSyncAt: string
  firmwareVersion: string
  enrolledCount: number
}

export interface FingerprintEnrollment {
  id: string
  employeeId: string
  employeeName: string
  deviceId: string
  status: 'pending' | 'enrolled' | 'failed'
  enrolledAt?: string
  templateHash: string
}

export interface BiometricAuditEntry {
  id: string
  userId: string
  userName: string
  action: string
  target: string
  timestamp: string
  details?: string
}
