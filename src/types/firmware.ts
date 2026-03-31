export type DeviceKind = 'rfid' | 'biometric'

export type OtaUpdateStatus = 'pending' | 'in_progress' | 'success' | 'failed' | 'skipped'

export interface FirmwareVersion {
  id: string
  version: string
  deviceKind: DeviceKind
  description?: string
  fileUrl?: string
  fileSize?: number
  isAutoUpdate: boolean
  uploadedAt: string
  uploadedBy: string
}

export interface DeviceFirmwareStatus {
  deviceId: string
  deviceName: string
  deviceKind: DeviceKind
  currentVersion: string
  targetVersion: string | null
  updateStatus: OtaUpdateStatus
  lastCheckedAt: string
  lastUpdatedAt?: string
}

export interface OtaUpdateLog {
  id: string
  deviceId: string
  deviceName?: string
  deviceKind: DeviceKind
  firmwareVersionId: string
  firmwareVersion: string
  status: OtaUpdateStatus
  startedAt: string
  completedAt?: string
  errorMessage?: string
  triggeredBy: 'manual' | 'auto'
}

export interface FirmwareFilters {
  deviceKind?: DeviceKind
  page?: number
  perPage?: number
}

export interface OtaLogFilters {
  deviceId?: string
  status?: OtaUpdateStatus
  page?: number
  perPage?: number
}
