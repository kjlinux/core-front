import { ref } from 'vue'
import { defineStore } from 'pinia'
import { orderApi } from '@/services/api/order.api'
import { useAuthStore } from '@/stores/auth.store'
import type { Order } from '@/types'
import type { PaymentMethod } from '@/types/enums'

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>([])
  const currentOrder = ref<Order | null>(null)
  const isLoading = ref(false)

  async function createOrder(data: Partial<Order>) {
    isLoading.value = true
    try {
      const created = await orderApi.create(data)
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
      const authStore = useAuthStore()
      const companyId = authStore.userCompanyId ?? undefined
      const response = await orderApi.getAll({ companyId })
      orders.value = response.data
    } finally {
      isLoading.value = false
    }
  }

  async function fetchOrder(id: string) {
    isLoading.value = true
    try {
      currentOrder.value = await orderApi.getById(id)
    } finally {
      isLoading.value = false
    }
  }

  async function cancelOrder(id: string) {
    isLoading.value = true
    try {
      const updated = await orderApi.cancel(id)
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

  async function initiatePayment(orderId: string, method: PaymentMethod, phoneNumber?: string) {
    isLoading.value = true
    try {
      return await orderApi.initiatePayment(orderId, method, phoneNumber)
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
