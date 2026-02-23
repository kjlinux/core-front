import apiClient from './client'
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types'
import type { FeelbackDevice } from '@/types'

export const feelbackDeviceApi = {
  getAll(params?: PaginationParams): Promise<PaginatedResponse<FeelbackDevice>> {
    return apiClient.get('/feelback/devices', { params }).then((r) => r.data)
  },

  getById(id: string): Promise<ApiResponse<FeelbackDevice>> {
    return apiClient.get(`/feelback/devices/${id}`).then((r) => r.data)
  },

  register(data: Partial<FeelbackDevice>): Promise<ApiResponse<FeelbackDevice>> {
    return apiClient.post('/feelback/devices', data).then((r) => r.data)
  },

  update(id: string, data: Partial<FeelbackDevice>): Promise<ApiResponse<FeelbackDevice>> {
    return apiClient.put(`/feelback/devices/${id}`, data).then((r) => r.data)
  },

  delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/feelback/devices/${id}`).then((r) => r.data)
  },

  restart(id: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/feelback/devices/${id}/restart`).then((r) => r.data)
  },
}
