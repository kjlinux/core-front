import apiClient from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  Employee,
  PaginationParams,
} from '@/types'

export interface EmployeeFilters extends PaginationParams {
  companyId?: number
  siteId?: number
  departmentId?: number
  status?: string
  search?: string
}

export const employeeApi = {
  getAll(params?: EmployeeFilters): Promise<PaginatedResponse<Employee>> {
    return apiClient.get('/employees', { params }).then((r) => r.data)
  },

  getById(id: number): Promise<ApiResponse<Employee>> {
    return apiClient.get(`/employees/${id}`).then((r) => r.data)
  },

  create(data: Partial<Employee>): Promise<ApiResponse<Employee>> {
    return apiClient.post('/employees', data).then((r) => r.data)
  },

  update(id: number, data: Partial<Employee>): Promise<ApiResponse<Employee>> {
    return apiClient.put(`/employees/${id}`, data).then((r) => r.data)
  },

  delete(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/employees/${id}`).then((r) => r.data)
  },

  toggleActive(id: number): Promise<ApiResponse<Employee>> {
    return apiClient.patch(`/employees/${id}/toggle-active`).then((r) => r.data)
  },
}
