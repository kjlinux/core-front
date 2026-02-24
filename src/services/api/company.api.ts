import apiClient from './client'
import type {
  Company,
  Site,
  Department,
} from '@/types'

export const companyApi = {
  getAll(params?: Record<string, unknown>): Promise<Company[]> {
    return apiClient.get('/companies', { params }).then((r) => r.data?.data ?? r.data)
  },

  getById(id: string): Promise<Company> {
    return apiClient.get(`/companies/${id}`).then((r) => r.data?.data ?? r.data)
  },

  create(data: Partial<Company>): Promise<Company> {
    return apiClient.post('/companies', data).then((r) => r.data?.data ?? r.data)
  },

  update(id: string, data: Partial<Company>): Promise<Company> {
    return apiClient.put(`/companies/${id}`, data).then((r) => r.data?.data ?? r.data)
  },

  toggleActive(id: string): Promise<Company> {
    return apiClient.patch(`/companies/${id}/toggle-active`).then((r) => r.data?.data ?? r.data)
  },

  getSites(companyId: string): Promise<Site[]> {
    return apiClient.get(`/companies/${companyId}/sites`).then((r) => r.data?.data ?? r.data)
  },

  getDepartments(siteId: string): Promise<Department[]> {
    return apiClient.get(`/sites/${siteId}/departments`).then((r) => r.data?.data ?? r.data)
  },
}
