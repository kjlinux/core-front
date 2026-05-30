import apiClient from './client'
import type { Product, PaginatedResponse } from '@/types'

export interface ProductFilters {
  search?: string
  category?: string
  isActive?: boolean
  stockStatus?: 'out_of_stock' | 'critical' | 'low' | 'normal'
  page?: number
  perPage?: number
}

function toSnakeFilters(params?: ProductFilters): Record<string, unknown> | undefined {
  if (!params) return undefined
  const result: Record<string, unknown> = {}
  if (params.search !== undefined) result.search = params.search
  if (params.category !== undefined) result.category = params.category
  if (params.isActive !== undefined) result.is_active = params.isActive
  if (params.stockStatus !== undefined) result.stock_status = params.stockStatus
  if (params.page !== undefined) result.page = params.page
  if (params.perPage !== undefined) result.per_page = params.perPage
  return result
}

export const marketplaceApi = {
  getProducts(params?: ProductFilters): Promise<PaginatedResponse<Product>> {
    return apiClient.get('/marketplace/products', { params: toSnakeFilters(params) }).then((r) => r.data)
  },

  getProduct(id: string): Promise<Product> {
    return apiClient.get(`/marketplace/products/${id}`).then((r) => r.data)
  },

  createProduct(data: Partial<Product>): Promise<Product> {
    return apiClient.post('/marketplace/products', data).then((r) => r.data)
  },

  updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    return apiClient.put(`/marketplace/products/${id}`, data).then((r) => r.data)
  },

  deleteProduct(id: string): Promise<void> {
    return apiClient.delete(`/marketplace/products/${id}`).then((r) => r.data)
  },

  updateStock(id: string, quantity: number): Promise<Product> {
    return apiClient.patch(`/marketplace/products/${id}/stock`, { stockQuantity: quantity }).then((r) => r.data)
  },
}
