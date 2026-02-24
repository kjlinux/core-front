import apiClient from './client'
import type { Employee } from '@/types'

export interface EmployeeFilters {
  companyId?: string
  siteId?: string
  departmentId?: string
  status?: string
  search?: string
  isActive?: boolean
  page?: number
  perPage?: number
}

export const employeeApi = {
  getAll(params?: EmployeeFilters): Promise<Employee[]> {
    return apiClient.get('/employees', { params }).then((r) => r.data?.data ?? r.data)
  },

  getById(id: string): Promise<Employee> {
    return apiClient.get(`/employees/${id}`).then((r) => r.data?.data ?? r.data)
  },

  create(data: Partial<Employee>): Promise<Employee> {
    return apiClient.post('/employees', data).then((r) => r.data?.data ?? r.data)
  },

  update(id: string, data: Partial<Employee>): Promise<Employee> {
    return apiClient.put(`/employees/${id}`, data).then((r) => r.data?.data ?? r.data)
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`/employees/${id}`).then((r) => r.data)
  },

  toggleActive(id: string): Promise<Employee> {
    return apiClient.patch(`/employees/${id}/toggle-active`).then((r) => r.data?.data ?? r.data)
  },
}
