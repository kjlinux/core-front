import apiClient from './client'
import type {
  Order,
  PaginatedResponse,
  PaginationParams,
  CreateOrderPayload,
  InitiatePaymentResponse,
} from '@/types'

export interface OrderFilters {
  search?: string
  status?: string
  paymentStatus?: string
  companyId?: string
  page?: number
  perPage?: number
}

function toSnakeFilters(params?: OrderFilters): Record<string, unknown> | undefined {
  if (!params) return undefined
  const result: Record<string, unknown> = {}
  if (params.search !== undefined) result.search = params.search
  if (params.status !== undefined) result.status = params.status
  if (params.paymentStatus !== undefined) result.payment_status = params.paymentStatus
  if (params.companyId !== undefined) result.company_id = params.companyId
  if (params.page !== undefined) result.page = params.page
  if (params.perPage !== undefined) result.per_page = params.perPage
  return result
}

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

  getAllAdmin(params?: OrderFilters): Promise<PaginatedResponse<Order>> {
    return apiClient.get('/admin/orders', { params: toSnakeFilters(params) }).then((r) => r.data)
  },
}
