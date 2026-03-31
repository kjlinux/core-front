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
  isPublished: boolean
  publishedAt?: string
  uploadedAt: string
  uploadedBy: string
}

export interface DeviceUpdateProgress {
  deviceId: string
  deviceName: string
  deviceKind: DeviceKind
  status: OtaUpdateStatus
  errorMessage?: string
  completedAt?: string
}

export interface CompanyUpdateProgress {
  total: number
  pending: number
  inProgress: number
  success: number
  failed: number
  devices: DeviceUpdateProgress[]
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
