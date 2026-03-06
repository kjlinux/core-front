import apiClient from './client'
import type { Product, PaginatedResponse, PaginationParams } from '@/types'

export const marketplaceApi = {
  getProducts(params?: PaginationParams): Promise<PaginatedResponse<Product>> {
    return apiClient.get('/marketplace/products', { params }).then((r) => r.data)
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
