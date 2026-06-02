import apiClient from './client'
import type { PaginatedResponse } from '@/types'

export interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  companyId: string | null
  companyName?: string
  avatar?: string
  isActive: boolean
  createdAt: string
}

export interface UserFilters {
  search?: string
  role?: string
  companyId?: string
  isActive?: boolean
  page?: number
  perPage?: number
}

function toSnakeFilters(params?: UserFilters): Record<string, unknown> | undefined {
  if (!params) return undefined
  const result: Record<string, unknown> = {}
  if (params.search !== undefined) result.search = params.search
  if (params.role !== undefined) result.role = params.role
  if (params.companyId !== undefined) result.company_id = params.companyId
  if (params.isActive !== undefined) result.is_active = params.isActive
  if (params.page !== undefined) result.page = params.page
  if (params.perPage !== undefined) result.per_page = params.perPage
  return result
}

export interface CreateUserPayload {
  first_name: string
  last_name: string
  email: string
  phone?: string
  role: string
  company_id?: string
  password: string
  password_confirmation: string
  is_active?: boolean
}

export interface UpdateUserPayload {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  role?: string
  company_id?: string
  password?: string
  password_confirmation?: string
}

export const userApi = {
  getAll(params?: UserFilters): Promise<PaginatedResponse<UserData>> {
    return apiClient.get('/users', { params: toSnakeFilters(params) }).then((r) => r.data)
  },

  getById(id: string): Promise<UserData> {
    return apiClient.get(`/users/${id}`).then((r) => r.data)
  },

  create(data: CreateUserPayload): Promise<UserData> {
    return apiClient.post('/users', data).then((r) => r.data)
  },

  update(id: string, data: UpdateUserPayload): Promise<UserData> {
    return apiClient.put(`/users/${id}`, data).then((r) => r.data)
  },

  toggleActive(id: string): Promise<UserData> {
    return apiClient.patch(`/users/${id}/toggle-active`).then((r) => r.data)
  },

  resetPassword(id: string): Promise<void> {
    return apiClient.post(`/users/${id}/reset-password`).then((r) => r.data)
  },

  remove(id: string): Promise<void> {
    return apiClient.delete(`/users/${id}`).then((r) => r.data)
  },
}
