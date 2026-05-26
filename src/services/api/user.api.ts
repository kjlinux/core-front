import apiClient from './client'

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
  company_id?: string
  role?: string
  search?: string
  is_active?: boolean
  page?: number
  perPage?: number
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
}

export interface UpdateUserPayload {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  role?: string
  company_id?: string
}

export const userApi = {
  getAll(params?: UserFilters): Promise<UserData[]> {
    return apiClient.get('/users', { params }).then((r) => r.data?.data ?? r.data)
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
}
