import apiClient from './client'
import type {
  Company,
  Site,
  Department,
  PaginatedResponse,
} from '@/types'

export interface CompanyFilters {
  search?: string
  isActive?: boolean
  page?: number
  perPage?: number
}

function toSnakeFilters(params?: CompanyFilters): Record<string, unknown> | undefined {
  if (!params) return undefined
  const result: Record<string, unknown> = {}
  if (params.search !== undefined) result.search = params.search
  if (params.isActive !== undefined) result.is_active = params.isActive
  if (params.page !== undefined) result.page = params.page
  if (params.perPage !== undefined) result.per_page = params.perPage
  return result
}

export const companyApi = {
  getAll(params?: CompanyFilters): Promise<PaginatedResponse<Company>> {
    return apiClient.get('/companies', { params: toSnakeFilters(params) }).then((r) => r.data)
  },

  getById(id: string): Promise<Company> {
    return apiClient.get(`/companies/${id}`).then((r) => r.data)
  },

  create(data: Partial<Company>): Promise<Company> {
    return apiClient.post('/companies', data).then((r) => r.data)
  },

  update(id: string, data: Partial<Company>): Promise<Company> {
    return apiClient.put(`/companies/${id}`, data).then((r) => r.data)
  },

  toggleActive(id: string): Promise<Company> {
    return apiClient.patch(`/companies/${id}/toggle-active`).then((r) => r.data)
  },

  activateWarranty(id: string): Promise<Company> {
    return apiClient.post(`/companies/${id}/warranty`).then((r) => r.data)
  },

  stopWarranty(id: string): Promise<Company> {
    return apiClient.delete(`/companies/${id}/warranty`).then((r) => r.data)
  },

  getSites(companyId: string): Promise<Site[]> {
    return apiClient.get(`/companies/${companyId}/sites`).then((r) => r.data)
  },

  getDepartments(siteId: string): Promise<Department[]> {
    return apiClient.get(`/sites/${siteId}/departments`).then((r) => r.data)
  },
}
