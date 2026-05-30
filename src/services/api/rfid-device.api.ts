import apiClient from './client'
import type { PaginatedResponse } from '@/types'
import type { RfidDevice } from '@/types'

export interface RfidDeviceFilters {
  search?: string
  companyId?: string
  siteId?: string
  status?: 'online' | 'offline' | ''
  page?: number
  perPage?: number
}

function toSnakeFilters(params?: RfidDeviceFilters): Record<string, unknown> | undefined {
  if (!params) return undefined
  const result: Record<string, unknown> = {}
  if (params.search !== undefined) result.search = params.search
  if (params.companyId !== undefined) result.company_id = params.companyId
  if (params.siteId !== undefined) result.site_id = params.siteId
  if (params.status === 'online') result.is_online = true
  else if (params.status === 'offline') result.is_online = false
  if (params.page !== undefined) result.page = params.page
  if (params.perPage !== undefined) result.per_page = params.perPage
  return result
}

export const rfidDeviceApi = {
  getAll(params?: RfidDeviceFilters): Promise<PaginatedResponse<RfidDevice>> {
    return apiClient.get('/rfid/devices', { params: toSnakeFilters(params) }).then((r) => r.data)
  },

  getById(id: string): Promise<RfidDevice> {
    return apiClient.get(`/rfid/devices/${id}`).then((r) => r.data)
  },

  register(data: Partial<RfidDevice>): Promise<RfidDevice> {
    return apiClient.post('/rfid/devices', data).then((r) => r.data)
  },

  update(id: string, data: Partial<RfidDevice>): Promise<RfidDevice> {
    return apiClient.put(`/rfid/devices/${id}`, data).then((r) => r.data)
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`/rfid/devices/${id}`).then((r) => r.data)
  },
}
