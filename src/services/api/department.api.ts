import apiClient from './client'
import type {
  PaginatedResponse,
  Department,
  PaginationParams,
} from '@/types'

export interface DepartmentFilters extends PaginationParams {
  companyId?: string
  siteId?: string
  search?: string
}

function toSnakeFilters(params?: DepartmentFilters): Record<string, unknown> | undefined {
  if (!params) return undefined
  const result: Record<string, unknown> = {}
  if (params.companyId !== undefined) result.company_id = params.companyId
  if (params.siteId !== undefined) result.site_id = params.siteId
  if (params.search !== undefined) result.search = params.search
  if (params.page !== undefined) result.page = params.page
  if (params.perPage !== undefined) result.per_page = params.perPage
  return result
}

export const departmentApi = {
  getAll(params?: DepartmentFilters): Promise<PaginatedResponse<Department>> {
    return apiClient.get('/departments', { params: toSnakeFilters(params) }).then((r) => r.data)
  },

  getById(id: string): Promise<Department> {
    return apiClient.get(`/departments/${id}`).then((r) => r.data)
  },

  create(data: Partial<Department>): Promise<Department> {
    const payload: Record<string, unknown> = { ...data }
    if ('companyId' in data) { payload.company_id = data.companyId; delete payload.companyId }
    if ('siteId' in data) { payload.site_id = data.siteId; delete payload.siteId }
    if ('managerId' in data) { payload.manager_id = data.managerId; delete payload.managerId }
    if ('employeeCount' in data) delete payload.employeeCount
    return apiClient.post('/departments', payload).then((r) => r.data)
  },

  update(id: string, data: Partial<Department>): Promise<Department> {
    const payload: Record<string, unknown> = { ...data }
    if ('companyId' in data) { payload.company_id = data.companyId; delete payload.companyId }
    if ('siteId' in data) { payload.site_id = data.siteId; delete payload.siteId }
    if ('managerId' in data) { payload.manager_id = data.managerId; delete payload.managerId }
    if ('employeeCount' in data) delete payload.employeeCount
    return apiClient.put(`/departments/${id}`, payload).then((r) => r.data)
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`/departments/${id}`).then((r) => r.data)
  },
}
