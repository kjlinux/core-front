import { ref } from 'vue'
import { defineStore } from 'pinia'
import { feelbackDeviceApi, type FeelbackDeviceFilters } from '@/services/api/feelback-device.api'
import type { FeelbackDevice } from '@/types'

export const useFeelbackDeviceStore = defineStore('feelback-device', () => {
  const devices = ref<FeelbackDevice[]>([])
  const currentDevice = ref<FeelbackDevice | null>(null)
  const isLoading = ref(false)
  const filters = ref<FeelbackDeviceFilters>({
    page: 1,
    perPage: 15,
  })
  const pagination = ref({
    currentPage: 1,
    perPage: 15,
    total: 0,
    totalPages: 0,
  })

  async function fetchDevices(newFilters?: Partial<FeelbackDeviceFilters>) {
    if (newFilters) {
      filters.value = { page: 1, perPage: filters.value.perPage, ...newFilters }
    }
    isLoading.value = true
    try {
      const response = await feelbackDeviceApi.getAll(filters.value)
      devices.value = response.data
      pagination.value = response.meta
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDevice(id: string) {
    isLoading.value = true
    try {
      const device = await feelbackDeviceApi.getById(id)
      currentDevice.value = device
      return device
    } finally {
      isLoading.value = false
    }
  }

  async function registerDevice(data: Partial<FeelbackDevice>) {
    isLoading.value = true
    try {
      const device = await feelbackDeviceApi.register(data)
      devices.value.push(device)
      return device
    } finally {
      isLoading.value = false
    }
  }

  async function updateDevice(id: string, data: Partial<FeelbackDevice>) {
    isLoading.value = true
    try {
      const updated = await feelbackDeviceApi.update(id, data)
      const index = devices.value.findIndex((d) => d.id === id)
      if (index !== -1) {
        devices.value[index] = updated
      }
      if (currentDevice.value?.id === id) {
        currentDevice.value = updated
      }
      return updated
    } finally {
      isLoading.value = false
    }
  }

  async function setDeviceOnline(id: string, isOnline: boolean) {
    const device = await feelbackDeviceApi.setOnline(id, isOnline)
    const idx = devices.value.findIndex((d) => d.id === id)
    if (idx !== -1) devices.value[idx] = device
    if (currentDevice.value?.id === id) currentDevice.value = device
    return device
  }

  async function deleteDevice(id: string) {
    isLoading.value = true
    try {
      await feelbackDeviceApi.delete(id)
      devices.value = devices.value.filter((d) => d.id !== id)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Appelé par useRealtimeSubscriptions - met à jour le statut d'un device feelback.
   */
  function handleRealtimeDevice(data: {
    deviceId: string
    status: string
    timestamp: string
  }) {
    const device = devices.value.find((d) => d.id === data.deviceId)
    if (device) {
      device.isOnline = data.status === 'online'
      device.lastPingAt = data.timestamp
    }
  }

  return {
    devices,
    currentDevice,
    isLoading,
    filters,
    pagination,
    fetchDevices,
    fetchDevice,
    registerDevice,
    updateDevice,
    setDeviceOnline,
    deleteDevice,
    handleRealtimeDevice,
  }
})
