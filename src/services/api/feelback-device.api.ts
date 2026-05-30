import apiClient from './client'
import type { PaginatedResponse } from '@/types'
import type { FeelbackDevice } from '@/types'

export interface FeelbackDeviceFilters {
  companyId?: string
  siteId?: string
  isOnline?: boolean
  search?: string
  page?: number
  perPage?: number
}

function toSnakeFilters(params?: FeelbackDeviceFilters): Record<string, unknown> | undefined {
  if (!params) return undefined
  const result: Record<string, unknown> = {}
  if (params.companyId !== undefined) result.company_id = params.companyId
  if (params.siteId !== undefined) result.site_id = params.siteId
  if (params.isOnline !== undefined) result.is_online = params.isOnline
  if (params.search !== undefined) result.search = params.search
  if (params.page !== undefined) result.page = params.page
  if (params.perPage !== undefined) result.per_page = params.perPage
  return result
}

export const feelbackDeviceApi = {
  getAll(params?: FeelbackDeviceFilters): Promise<PaginatedResponse<FeelbackDevice>> {
    return apiClient.get('/feelback/devices', { params: toSnakeFilters(params) }).then((r) => r.data)
  },

  getById(id: string): Promise<FeelbackDevice> {
    return apiClient.get(`/feelback/devices/${id}`).then((r) => r.data)
  },

  register(data: Partial<FeelbackDevice>): Promise<FeelbackDevice> {
    return apiClient.post('/feelback/devices', data).then((r) => r.data)
  },

  update(id: string, data: Partial<FeelbackDevice>): Promise<FeelbackDevice> {
    return apiClient.put(`/feelback/devices/${id}`, data).then((r) => r.data)
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`/feelback/devices/${id}`).then((r) => r.data)
  },

  setOnline(id: string, isOnline: boolean): Promise<FeelbackDevice> {
    return apiClient.put(`/feelback/devices/${id}`, { isOnline }).then((r) => r.data)
  },

}
