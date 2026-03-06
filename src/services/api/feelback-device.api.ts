import apiClient from './client'
import type { PaginatedResponse, PaginationParams } from '@/types'
import type { FeelbackDevice } from '@/types'

export const feelbackDeviceApi = {
  getAll(params?: PaginationParams): Promise<PaginatedResponse<FeelbackDevice>> {
    return apiClient.get('/feelback/devices', { params }).then((r) => r.data)
  },

  getById(id: string): Promise<FeelbackDevice> {
    return apiClient.get(`/feelback/devices/${id}`).then((r) => r.data)
  },

  register(data: Partial<FeelbackDevice>): Promise<FeelbackDevice> {
    return apiClient.post('/feelback/devices', data).then((r) => r.data)
  },

  update(id: string, data: Partial<FeelbackDevice>): Promise<FeelbackDevice> {
    return apiClient.put(`/feelback/devices/${id}`, data).then((r) => r.data)
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`/feelback/devices/${id}`).then((r) => r.data)
  },

}
