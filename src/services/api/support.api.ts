import apiClient from './client'
import type {
  DeviceAlert,
  DeviceKind,
  DevicesOverview,
  PaginatedResponse,
  SupportDevice,
  SystemHealth,
} from '@/types'

export interface DevicesFilter {
  company_id?: string
  site_id?: string
  type?: DeviceKind
  status?: 'online' | 'offline'
  witness?: boolean
}

export interface AlertsFilter {
  status?: 'open' | 'acknowledged' | 'resolved'
  severity?: 'low' | 'medium' | 'high' | 'critical'
  type?: string
  company_id?: string
  page?: number
  per_page?: number
}

export const supportApi = {
  getHealth(): Promise<SystemHealth> {
    return apiClient.get('/support/health').then((r) => r.data)
  },

  getOverview(companyId?: string): Promise<DevicesOverview> {
    return apiClient.get('/support/devices/overview', { params: { company_id: companyId } }).then((r) => r.data)
  },

  getDevices(filter: DevicesFilter = {}): Promise<SupportDevice[]> {
    return apiClient.get('/support/devices', { params: filter }).then((r) => r.data)
  },

  getDevice(kind: DeviceKind, id: string): Promise<{ device: any; kind: DeviceKind; alerts: DeviceAlert[] }> {
    return apiClient.get(`/support/devices/${kind}/${id}`).then((r) => r.data)
  },

  pingDevice(kind: DeviceKind, id: string): Promise<{ topic: string; command: string }> {
    return apiClient.post(`/support/devices/${kind}/${id}/ping`).then((r) => r.data)
  },

  listWitnesses(): Promise<SupportDevice[]> {
    return apiClient.get('/support/witnesses').then((r) => r.data)
  },

  markWitness(kind: DeviceKind, id: string): Promise<void> {
    return apiClient.post(`/support/witnesses/${kind}/${id}`).then((r) => r.data)
  },

  unmarkWitness(kind: DeviceKind, id: string): Promise<void> {
    return apiClient.delete(`/support/witnesses/${kind}/${id}`).then((r) => r.data)
  },

  getAlerts(filter: AlertsFilter = {}): Promise<PaginatedResponse<DeviceAlert>> {
    return apiClient.get('/support/alerts', { params: filter }).then((r) => r.data)
  },

  acknowledgeAlert(id: string): Promise<DeviceAlert> {
    return apiClient.post(`/support/alerts/${id}/acknowledge`).then((r) => r.data)
  },

  resolveAlert(id: string): Promise<DeviceAlert> {
    return apiClient.post(`/support/alerts/${id}/resolve`).then((r) => r.data)
  },
}
