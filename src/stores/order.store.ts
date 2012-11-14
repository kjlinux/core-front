import { ref } from 'vue'
import { defineStore } from 'pinia'
import { orderApi } from '@/services/api/order.api'
import type { Order } from '@/types'
import type { PaymentMethod } from '@/types/enums'

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>([])
  const currentOrder = ref<Order | null>(null)
  const isLoading = ref(false)

  async function createOrder(data: Partial<Order>) {
    isLoading.value = true
    try {
      const response = await orderApi.create(data)
      const created = response.data
      orders.value.unshift(created)
      currentOrder.value = created
      return created
    } finally {
      isLoading.value = false
    }
  }

  async function fetchOrders() {
    isLoading.value = true
    try {
      const response = await orderApi.getAll()
      orders.value = response.data
    } finally {
      isLoading.value = false
    }
  }

  async function fetchOrder(id: string) {
    isLoading.value = true
    try {
      const response = await orderApi.getById(id)
      currentOrder.value = response.data
    } finally {
      isLoading.value = false
    }
  }

  async function cancelOrder(id: string) {
    isLoading.value = true
    try {
      const response = await orderApi.cancel(id)
      const updated = response.data
      const index = orders.value.findIndex((o) => o.id === id)
      if (index !== -1) {
        orders.value[index] = updated
      }
      if (currentOrder.value?.id === id) {
        currentOrder.value = updated
      }
      return updated
    } finally {
      isLoading.value = false
    }
  }

  async function initiatePayment(orderId: string, method: PaymentMethod) {
    isLoading.value = true
    try {
      const response = await orderApi.initiatePayment(orderId, method)
      return response.data
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAllOrders() {
    isLoading.value = true
    try {
      const response = await orderApi.getAllAdmin()
      orders.value = response.data
    } finally {
      isLoading.value = false
    }
  }

  return { orders, currentOrder, isLoading, createOrder, fetchOrders, fetchOrder, cancelOrder, initiatePayment, fetchAllOrders }
})
