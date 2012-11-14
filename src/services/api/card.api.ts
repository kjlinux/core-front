import apiClient from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  RfidCard,
  PaginationParams,
} from '@/types'

export const cardApi = {
  getAll(params?: PaginationParams): Promise<PaginatedResponse<RfidCard>> {
    return apiClient.get('/cards', { params }).then((r) => r.data)
  },

  getById(id: number): Promise<ApiResponse<RfidCard>> {
    return apiClient.get(`/cards/${id}`).then((r) => r.data)
  },

  register(data: Partial<RfidCard>): Promise<ApiResponse<RfidCard>> {
    return apiClient.post('/cards', data).then((r) => r.data)
  },

  assignToEmployee(cardId: number, employeeId: number): Promise<ApiResponse<RfidCard>> {
    return apiClient.patch(`/cards/${cardId}/assign`, { employeeId }).then((r) => r.data)
  },

  unassign(cardId: number): Promise<ApiResponse<RfidCard>> {
    return apiClient.patch(`/cards/${cardId}/unassign`).then((r) => r.data)
  },

  block(cardId: number): Promise<ApiResponse<RfidCard>> {
    return apiClient.patch(`/cards/${cardId}/block`).then((r) => r.data)
  },

  unblock(cardId: number): Promise<ApiResponse<RfidCard>> {
    return apiClient.patch(`/cards/${cardId}/unblock`).then((r) => r.data)
  },

  getHistory(cardId: number, params?: PaginationParams): Promise<PaginatedResponse<unknown>> {
    return apiClient.get(`/cards/${cardId}/history`, { params }).then((r) => r.data)
  },
}
