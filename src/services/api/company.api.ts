import apiClient from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  Company,
  Site,
  Department,
  PaginationParams,
} from '@/types'

export const companyApi = {
  getAll(params?: PaginationParams): Promise<PaginatedResponse<Company>> {
    return apiClient.get('/companies', { params }).then((r) => r.data)
  },

  getById(id: number): Promise<ApiResponse<Company>> {
    return apiClient.get(`/companies/${id}`).then((r) => r.data)
  },

  create(data: Partial<Company>): Promise<ApiResponse<Company>> {
    return apiClient.post('/companies', data).then((r) => r.data)
  },

  update(id: number, data: Partial<Company>): Promise<ApiResponse<Company>> {
    return apiClient.put(`/companies/${id}`, data).then((r) => r.data)
  },

  toggleActive(id: number): Promise<ApiResponse<Company>> {
    return apiClient.patch(`/companies/${id}/toggle-active`).then((r) => r.data)
  },

  getSites(companyId: number): Promise<ApiResponse<Site[]>> {
    return apiClient.get(`/companies/${companyId}/sites`).then((r) => r.data)
  },

  getDepartments(siteId: number): Promise<ApiResponse<Department[]>> {
    return apiClient.get(`/sites/${siteId}/departments`).then((r) => r.data)
  },
}
