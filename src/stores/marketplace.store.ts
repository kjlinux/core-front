import { ref } from 'vue'
import { defineStore } from 'pinia'
import { marketplaceApi } from '@/services/api/marketplace.api'
import type { Product } from '@/types'

export const useMarketplaceStore = defineStore('marketplace', () => {
  const products = ref<Product[]>([])
  const currentProduct = ref<Product | null>(null)
  const isLoading = ref(false)

  async function fetchProducts(params?: Record<string, unknown>) {
    isLoading.value = true
    try {
      const response = await marketplaceApi.getProducts(params)
      products.value = response.data
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProduct(id: string) {
    isLoading.value = true
    try {
      const response = await marketplaceApi.getProduct(id)
      currentProduct.value = response.data
    } finally {
      isLoading.value = false
    }
  }

  async function createProduct(data: Partial<Product>) {
    isLoading.value = true
    try {
      const response = await marketplaceApi.createProduct(data)
      products.value.push(response.data)
      return response.data
    } finally {
      isLoading.value = false
    }
  }

  async function updateProduct(id: string, data: Partial<Product>) {
    isLoading.value = true
    try {
      const response = await marketplaceApi.updateProduct(id, data)
      const updated = response.data
      const index = products.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        products.value[index] = updated
      }
      if (currentProduct.value?.id === id) {
        currentProduct.value = updated
      }
      return updated
    } finally {
      isLoading.value = false
    }
  }

  async function updateStock(id: string, quantity: number) {
    isLoading.value = true
    try {
      const response = await marketplaceApi.updateStock(id, quantity)
      const updated = response.data
      const index = products.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        products.value[index] = updated
      }
      if (currentProduct.value?.id === id) {
        currentProduct.value = updated
      }
      return updated
    } finally {
      isLoading.value = false
    }
  }

  async function deleteProduct(id: string) {
    isLoading.value = true
    try {
      await marketplaceApi.deleteProduct(id)
      products.value = products.value.filter((p) => p.id !== id)
      if (currentProduct.value?.id === id) {
        currentProduct.value = null
      }
    } finally {
      isLoading.value = false
    }
  }

  return { products, currentProduct, isLoading, fetchProducts, fetchProduct, createProduct, updateProduct, updateStock, deleteProduct }
})
