import apiClient from './client'
import type {
  Order,
  PaginatedResponse,
  PaginationParams,
  CreateOrderPayload,
  InitiatePaymentResponse,
} from '@/types'

export const orderApi = {
  create(data: CreateOrderPayload): Promise<Order> {
    return apiClient.post('/orders', data).then((r) => r.data)
  },

  getAll(params?: PaginationParams): Promise<PaginatedResponse<Order>> {
    return apiClient.get('/orders', { params }).then((r) => r.data)
  },

  getById(id: string): Promise<Order> {
    return apiClient.get(`/orders/${id}`).then((r) => r.data)
  },

  cancel(id: string): Promise<Order> {
    return apiClient.patch(`/orders/${id}/cancel`).then((r) => r.data)
  },

  initiatePayment(orderId: string, method: string, phoneNumber?: string): Promise<InitiatePaymentResponse> {
    return apiClient.post(`/orders/${orderId}/payment`, { method, phoneNumber }).then((r) => r.data)
  },

  getAllAdmin(params?: PaginationParams): Promise<PaginatedResponse<Order>> {
    return apiClient.get('/admin/orders', { params }).then((r) => r.data)
  },
}
