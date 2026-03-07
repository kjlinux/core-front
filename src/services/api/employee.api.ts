import apiClient from './client'
import type { Employee, PaginatedResponse } from '@/types'

export interface EmployeeFilters {
  companyId?: string
  siteId?: string
  departmentId?: string
  search?: string
  isActive?: boolean
  page?: number
  perPage?: number
}

function toSnakeCase(data: Partial<Employee>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  if (data.companyId !== undefined) result.company_id = data.companyId
  if (data.siteId !== undefined) result.site_id = data.siteId
  if (data.departmentId !== undefined) result.department_id = data.departmentId
  if (data.firstName !== undefined) result.first_name = data.firstName
  if (data.lastName !== undefined) result.last_name = data.lastName
  if (data.email !== undefined) result.email = data.email
  if (data.phone !== undefined) result.phone = data.phone
  if (data.position !== undefined) result.position = data.position
  if (data.employeeNumber !== undefined) result.employee_number = data.employeeNumber
  if (data.hireDate !== undefined) result.hire_date = data.hireDate
  if (data.isActive !== undefined) result.is_active = data.isActive
  if (data.avatar !== undefined) result.avatar = data.avatar
  return result
}

function toSnakeFilters(params?: EmployeeFilters): Record<string, unknown> | undefined {
  if (!params) return undefined
  const result: Record<string, unknown> = {}
  if (params.companyId !== undefined) result.company_id = params.companyId
  if (params.siteId !== undefined) result.site_id = params.siteId
  if (params.departmentId !== undefined) result.department_id = params.departmentId
  if (params.search !== undefined) result.search = params.search
  if (params.isActive !== undefined) result.is_active = params.isActive
  if (params.page !== undefined) result.page = params.page
  if (params.perPage !== undefined) result.per_page = params.perPage
  return result
}

export const employeeApi = {
  getAll(params?: EmployeeFilters): Promise<PaginatedResponse<Employee>> {
    return apiClient.get('/employees', { params: toSnakeFilters(params) }).then((r) => r.data)
  },

  getById(id: string): Promise<Employee> {
    return apiClient.get(`/employees/${id}`).then((r) => r.data)
  },

  create(data: Partial<Employee>): Promise<Employee> {
    return apiClient.post('/employees', toSnakeCase(data)).then((r) => r.data)
  },

  update(id: string, data: Partial<Employee>): Promise<Employee> {
    return apiClient.put(`/employees/${id}`, toSnakeCase(data)).then((r) => r.data)
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`/employees/${id}`).then((r) => r.data)
  },

  toggleActive(id: string): Promise<Employee> {
    return apiClient.patch(`/employees/${id}/toggle-active`).then((r) => r.data)
  },
}
