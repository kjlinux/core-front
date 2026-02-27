import apiClient from './client'
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types'
import type { RfidDevice } from '@/types'

export const rfidDeviceApi = {
  getAll(params?: PaginationParams): Promise<PaginatedResponse<RfidDevice>> {
    return apiClient.get('/rfid/devices', { params }).then((r) => r.data)
  },

  getById(id: string): Promise<ApiResponse<RfidDevice>> {
    return apiClient.get(`/rfid/devices/${id}`).then((r) => r.data)
  },

  register(data: Partial<RfidDevice>): Promise<ApiResponse<RfidDevice>> {
    return apiClient.post('/rfid/devices', data).then((r) => r.data)
  },

  update(id: string, data: Partial<RfidDevice>): Promise<ApiResponse<RfidDevice>> {
    return apiClient.put(`/rfid/devices/${id}`, data).then((r) => r.data)
  },

  delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/rfid/devices/${id}`).then((r) => r.data)
  },
}
