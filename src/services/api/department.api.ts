import apiClient from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  Department,
  PaginationParams,
} from '@/types'

export interface DepartmentFilters extends PaginationParams {
  companyId?: string
  siteId?: string
  search?: string
}

export const departmentApi = {
  getAll(params?: DepartmentFilters): Promise<PaginatedResponse<Department>> {
    return apiClient.get('/departments', { params }).then((r) => r.data)
  },

  getById(id: string): Promise<ApiResponse<Department>> {
    return apiClient.get(`/departments/${id}`).then((r) => r.data)
  },

  create(data: Partial<Department>): Promise<ApiResponse<Department>> {
    return apiClient.post('/departments', data).then((r) => r.data)
  },

  update(id: string, data: Partial<Department>): Promise<ApiResponse<Department>> {
    return apiClient.put(`/departments/${id}`, data).then((r) => r.data)
  },

  delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/departments/${id}`).then((r) => r.data)
  },
}
