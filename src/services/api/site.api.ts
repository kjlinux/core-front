import apiClient from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  Site,
  PaginationParams,
} from '@/types'

export interface SiteFilters extends PaginationParams {
  companyId?: string
  search?: string
}

export const siteApi = {
  getAll(params?: SiteFilters): Promise<PaginatedResponse<Site>> {
    return apiClient.get('/sites', { params }).then((r) => r.data)
  },

  getById(id: string): Promise<ApiResponse<Site>> {
    return apiClient.get(`/sites/${id}`).then((r) => r.data)
  },

  create(data: Partial<Site>): Promise<ApiResponse<Site>> {
    return apiClient.post('/sites', data).then((r) => r.data)
  },

  update(id: string, data: Partial<Site>): Promise<ApiResponse<Site>> {
    return apiClient.put(`/sites/${id}`, data).then((r) => r.data)
  },

  delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/sites/${id}`).then((r) => r.data)
  },
}
