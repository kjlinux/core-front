import apiClient from './client'
import type {
  PaginatedResponse,
  Site,
  PaginationParams,
} from '@/types'

export interface SiteFilters extends PaginationParams {
  companyId?: string
  search?: string
}

function toSnakeFilters(params?: SiteFilters): Record<string, unknown> | undefined {
  if (!params) return undefined
  const result: Record<string, unknown> = {}
  if (params.companyId !== undefined) result.company_id = params.companyId
  if (params.search !== undefined) result.search = params.search
  if (params.page !== undefined) result.page = params.page
  if (params.perPage !== undefined) result.per_page = params.perPage
  return result
}

export const siteApi = {
  getAll(params?: SiteFilters): Promise<PaginatedResponse<Site>> {
    return apiClient.get('/sites', { params: toSnakeFilters(params) }).then((r) => r.data)
  },

  getById(id: string): Promise<Site> {
    return apiClient.get(`/sites/${id}`).then((r) => r.data)
  },

  create(data: Partial<Site>): Promise<Site> {
    const payload: Record<string, unknown> = { ...data }
    if ('companyId' in data) { payload.company_id = data.companyId; delete payload.companyId }
    return apiClient.post('/sites', payload).then((r) => r.data)
  },

  update(id: string, data: Partial<Site>): Promise<Site> {
    const payload: Record<string, unknown> = { ...data }
    if ('companyId' in data) { payload.company_id = data.companyId; delete payload.companyId }
    return apiClient.put(`/sites/${id}`, payload).then((r) => r.data)
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`/sites/${id}`).then((r) => r.data)
  },
}
