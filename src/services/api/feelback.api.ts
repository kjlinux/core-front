import apiClient from './client'
import type { PaginatedResponse, PaginationParams, FeelbackEntry, FeelbackDevice, FeelbackAlert, SatisfactionStats } from '@/types'

export interface FeelbackParams extends PaginationParams {
  startDate?: string
  endDate?: string
  agencyId?: string
  deviceId?: string
}

export const feelbackApi = {
  getStats(params?: FeelbackParams): Promise<SatisfactionStats> {
    return apiClient.get('/feelback/stats', { params }).then((r) => r.data)
  },

  getEntries(params?: FeelbackParams): Promise<PaginatedResponse<FeelbackEntry>> {
    return apiClient.get('/feelback/entries', { params }).then((r) => r.data)
  },

  getDevices(params?: PaginationParams): Promise<PaginatedResponse<FeelbackDevice>> {
    return apiClient.get('/feelback/devices', { params }).then((r) => r.data)
  },

  getDevice(id: string): Promise<FeelbackDevice> {
    return apiClient.get(`/feelback/devices/${id}`).then((r) => r.data)
  },

  registerDevice(data: Partial<FeelbackDevice>): Promise<FeelbackDevice> {
    return apiClient.post('/feelback/devices', data).then((r) => r.data)
  },

  getAlerts(params?: PaginationParams): Promise<PaginatedResponse<FeelbackAlert>> {
    return apiClient.get('/feelback/alerts', { params }).then((r) => r.data)
  },

  updateAlertSettings(data: Record<string, unknown>): Promise<void> {
    return apiClient.put('/feelback/alerts/settings', data).then((r) => r.data)
  },

  getStatsByAgency(agencyId: string, params?: FeelbackParams): Promise<SatisfactionStats> {
    return apiClient.get(`/feelback/stats/agency/${agencyId}`, { params }).then((r) => r.data)
  },

  getComparison(params?: FeelbackParams): Promise<SatisfactionStats[]> {
    return apiClient.get('/feelback/comparison', { params }).then((r) => r.data)
  },
}
