import apiClient from './client'
import type { Order, ApiResponse, PaginatedResponse, PaginationParams } from '@/types'

export const orderApi = {
  create(data: Record<string, unknown>): Promise<ApiResponse<Order>> {
    return apiClient.post('/orders', data).then((r) => r.data)
  },

  getAll(params?: PaginationParams): Promise<PaginatedResponse<Order>> {
    return apiClient.get('/orders', { params }).then((r) => r.data)
  },

  getById(id: string): Promise<ApiResponse<Order>> {
    return apiClient.get(`/orders/${id}`).then((r) => r.data)
  },

  cancel(id: string): Promise<ApiResponse<Order>> {
    return apiClient.patch(`/orders/${id}/cancel`).then((r) => r.data)
  },

  initiatePayment(orderId: string, method: string): Promise<ApiResponse<Order>> {
    return apiClient.post(`/orders/${orderId}/payment`, { method }).then((r) => r.data)
  },

  getAllAdmin(params?: PaginationParams): Promise<PaginatedResponse<Order>> {
    return apiClient.get('/admin/orders', { params }).then((r) => r.data)
  },
}
