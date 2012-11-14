import apiClient from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  Schedule,
  Holiday,
  PaginationParams,
} from '@/types'

export const scheduleApi = {
  // Schedule CRUD
  getAll(params?: PaginationParams): Promise<PaginatedResponse<Schedule>> {
    return apiClient.get('/schedules', { params }).then((r) => r.data)
  },

  getById(id: string): Promise<ApiResponse<Schedule>> {
    return apiClient.get(`/schedules/${id}`).then((r) => r.data)
  },

  create(data: Partial<Schedule>): Promise<ApiResponse<Schedule>> {
    return apiClient.post('/schedules', data).then((r) => r.data)
  },

  update(id: string, data: Partial<Schedule>): Promise<ApiResponse<Schedule>> {
    return apiClient.put(`/schedules/${id}`, data).then((r) => r.data)
  },

  delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/schedules/${id}`).then((r) => r.data)
  },

  // Holiday management
  getHolidays(params?: PaginationParams): Promise<PaginatedResponse<Holiday>> {
    return apiClient.get('/holidays', { params }).then((r) => r.data)
  },

  createHoliday(data: Partial<Holiday>): Promise<ApiResponse<Holiday>> {
    return apiClient.post('/holidays', data).then((r) => r.data)
  },

  updateHoliday(id: string, data: Partial<Holiday>): Promise<ApiResponse<Holiday>> {
    return apiClient.put(`/holidays/${id}`, data).then((r) => r.data)
  },

  deleteHoliday(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/holidays/${id}`).then((r) => r.data)
  },
}
