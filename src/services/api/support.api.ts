import apiClient from './client'
import type {
  DeviceAlert,
  DeviceKind,
  DevicesOverview,
  PaginatedResponse,
  SupportDevice,
  SystemHealth,
  User,
} from '@/types'

export interface DevicesFilter {
  companyId?: string
  siteId?: string
  type?: DeviceKind
  status?: 'online' | 'offline'
  witness?: boolean
  search?: string
  page?: number
  perPage?: number
}

export interface AlertsFilter {
  status?: 'open' | 'acknowledged' | 'resolved'
  severity?: 'low' | 'medium' | 'high' | 'critical'
  type?: string
  companyId?: string
  search?: string
  page?: number
  perPage?: number
}

export interface CompaniesFilter {
  search?: string
  page?: number
  perPage?: number
}

export interface WitnessFilter {
  search?: string
  page?: number
  perPage?: number
}

export interface SupportCompanyRow {
  id: string
  name: string
  email: string | null
  phone: string | null
  isActive: boolean
  devicesTotal: number
  devicesOnline: number
  devicesOffline: number
  oldestOfflineSince: string | null
  openAlerts: number
}

export interface SupportCompanyUser {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  isActive: boolean
}

export interface SupportCompanyDetail {
  company: { id: string; name: string; email: string | null; phone: string | null; address: string | null; isActive: boolean }
  devices: { total: number; online: number; oldestOfflineSince: string | null }
  users: SupportCompanyUser[]
  alerts: DeviceAlert[]
}

export interface ImpersonationResult {
  accessToken: string
  user: User
  impersonator: { id: string; name: string }
}

/** Détail capteur renvoyé par /support/devices/{kind}/{id} (clés snake_case). */
export interface SupportDeviceDetail {
  id: string
  kind: DeviceKind
  name?: string
  serial_number?: string | null
  company_id?: string | null
  company_name?: string | null
  site_id?: string | null
  site_name?: string | null
  is_online?: boolean
  is_witness?: boolean
  firmware_version?: string | null
  last_ping_at?: string | null
  last_sync_at?: string | null
}

export type SupportCommand = 'STATUS' | 'REBOOT' | 'RESET'

export const supportApi = {
  getHealth(): Promise<SystemHealth> {
    return apiClient.get('/support/health').then((r) => r.data)
  },

  getOverview(companyId?: string): Promise<DevicesOverview> {
    return apiClient.get('/support/devices/overview', { params: { company_id: companyId } }).then((r) => r.data)
  },

  getDevices(filter: DevicesFilter = {}): Promise<PaginatedResponse<SupportDevice>> {
    return apiClient.get('/support/devices', { params: filter }).then((r) => r.data)
  },

  getDevice(kind: DeviceKind, id: string): Promise<{ device: SupportDeviceDetail; kind: DeviceKind; alerts: DeviceAlert[] }> {
    return apiClient.get(`/support/devices/${kind}/${id}`).then((r) => r.data)
  },

  pingDevice(kind: DeviceKind, id: string): Promise<{ topic: string; command: string }> {
    return apiClient.post(`/support/devices/${kind}/${id}/ping`).then((r) => r.data)
  },

  listWitnesses(filter: WitnessFilter = {}): Promise<PaginatedResponse<SupportDevice>> {
    return apiClient.get('/support/witnesses', { params: filter }).then((r) => r.data)
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

  getCompanies(filter: CompaniesFilter = {}): Promise<PaginatedResponse<SupportCompanyRow>> {
    return apiClient.get('/support/companies', { params: filter }).then((r) => r.data)
  },

  getCompanyDetail(id: string): Promise<SupportCompanyDetail> {
    return apiClient.get(`/support/companies/${id}`).then((r) => r.data)
  },

  sendCommand(kind: DeviceKind, id: string, command: SupportCommand): Promise<{ topic: string; command: string }> {
    return apiClient.post(`/support/devices/${kind}/${id}/command`, { command }).then((r) => r.data)
  },

  resetUserPassword(userId: string): Promise<{ userId: string; tempPassword: string }> {
    return apiClient.post(`/support/users/${userId}/reset-password`).then((r) => r.data)
  },

  /** Prise de contrôle : émet un token agissant comme l'admin de l'entreprise. */
  impersonateCompany(companyId: string): Promise<ImpersonationResult> {
    return apiClient.post(`/support/companies/${companyId}/impersonate`).then((r) => r.data)
  },

  /** Prise de contrôle d'un utilisateur précis. */
  impersonateUser(userId: string): Promise<ImpersonationResult> {
    return apiClient.post(`/support/users/${userId}/impersonate`).then((r) => r.data)
  },
}
