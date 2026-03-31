import apiClient from './client'
import type { FirmwareVersion, DeviceFirmwareStatus, OtaUpdateLog, FirmwareFilters, OtaLogFilters, CompanyUpdateProgress } from '@/types'
import type { PaginatedResponse } from '@/types'

export const firmwareApi = {
  getVersions(params?: FirmwareFilters): Promise<PaginatedResponse<FirmwareVersion>> {
    return apiClient.get('/firmware/versions', { params }).then((r) => r.data)
  },

  getVersion(id: string): Promise<FirmwareVersion> {
    return apiClient.get(`/firmware/versions/${id}`).then((r) => r.data)
  },

  uploadVersion(formData: FormData): Promise<FirmwareVersion> {
    return apiClient
      .post('/firmware/versions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  deleteVersion(id: string): Promise<void> {
    return apiClient.delete(`/firmware/versions/${id}`).then((r) => r.data)
  },

  setAutoUpdate(id: string, isAutoUpdate: boolean): Promise<FirmwareVersion> {
    return apiClient
      .patch(`/firmware/versions/${id}/auto-update`, { is_auto_update: isAutoUpdate })
      .then((r) => r.data)
  },

  getDeviceStatuses(params?: { deviceKind?: string }): Promise<DeviceFirmwareStatus[]> {
    return apiClient.get('/firmware/devices/status', { params }).then((r) => r.data)
  },

  triggerUpdate(deviceId: string, firmwareVersionId: string): Promise<OtaUpdateLog> {
    return apiClient
      .post('/firmware/update', { device_id: deviceId, firmware_version_id: firmwareVersionId })
      .then((r) => r.data)
  },

  getLogs(params?: OtaLogFilters): Promise<PaginatedResponse<OtaUpdateLog>> {
    return apiClient.get('/firmware/logs', { params }).then((r) => r.data)
  },

  publishVersion(id: string): Promise<FirmwareVersion> {
    return apiClient.patch(`/firmware/versions/${id}/publish`).then((r) => r.data)
  },

  triggerCompanyUpdate(firmwareVersionId: string): Promise<{ triggered: number; logs: OtaUpdateLog[] }> {
    return apiClient
      .post('/firmware/trigger-company-update', { firmware_version_id: firmwareVersionId })
      .then((r) => r.data)
  },

  getCompanyUpdateProgress(firmwareVersionId: string): Promise<CompanyUpdateProgress> {
    return apiClient
      .get('/firmware/company-update-progress', { params: { firmware_version_id: firmwareVersionId } })
      .then((r) => r.data)
  },

  retryFailed(firmwareVersionId: string): Promise<{ triggered: number }> {
    return apiClient
      .post('/firmware/retry-failed', { firmware_version_id: firmwareVersionId })
      .then((r) => r.data)
  },
}
