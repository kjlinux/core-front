import apiClient from './client'
import type { Product, ApiResponse, PaginatedResponse, PaginationParams } from '@/types'

export const marketplaceApi = {
  getProducts(params?: PaginationParams): Promise<PaginatedResponse<Product>> {
    return apiClient.get('/marketplace/products', { params }).then((r) => r.data)
  },

  getProduct(id: string): Promise<ApiResponse<Product>> {
    return apiClient.get(`/marketplace/products/${id}`).then((r) => r.data)
  },

  createProduct(data: Partial<Product>): Promise<ApiResponse<Product>> {
    return apiClient.post('/marketplace/products', data).then((r) => r.data)
  },

  updateProduct(id: string, data: Partial<Product>): Promise<ApiResponse<Product>> {
    return apiClient.put(`/marketplace/products/${id}`, data).then((r) => r.data)
  },

  updateStock(id: string, quantity: number): Promise<ApiResponse<Product>> {
    return apiClient.patch(`/marketplace/products/${id}/stock`, { quantity }).then((r) => r.data)
  },
}
