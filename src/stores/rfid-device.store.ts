import { ref } from 'vue'
import { defineStore } from 'pinia'
import { rfidDeviceApi, type RfidDeviceFilters } from '@/services/api/rfid-device.api'
import type { RfidDevice } from '@/types'

export const useRfidDeviceStore = defineStore('rfid-device', () => {
  const devices = ref<RfidDevice[]>([])
  const currentDevice = ref<RfidDevice | null>(null)
  const isLoading = ref(false)
  const filters = ref<RfidDeviceFilters>({
    page: 1,
    perPage: 15,
  })
  const pagination = ref({
    currentPage: 1,
    perPage: 15,
    total: 0,
    totalPages: 0,
  })

  async function fetchDevices(newFilters?: Partial<RfidDeviceFilters>) {
    if (newFilters) {
      filters.value = { page: 1, perPage: filters.value.perPage, ...newFilters }
    }
    isLoading.value = true
    try {
      const response = await rfidDeviceApi.getAll(filters.value)
      devices.value = response.data
      pagination.value = response.meta
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDevice(id: string) {
    isLoading.value = true
    try {
      const device = await rfidDeviceApi.getById(id)
      currentDevice.value = device
      return device
    } finally {
      isLoading.value = false
    }
  }

  async function registerDevice(data: Partial<RfidDevice>) {
    isLoading.value = true
    try {
      const created = await rfidDeviceApi.register(data)
      devices.value.push(created)
      return created
    } finally {
      isLoading.value = false
    }
  }

  async function updateDevice(id: string, data: Partial<RfidDevice>) {
    isLoading.value = true
    try {
      const updated = await rfidDeviceApi.update(id, data)
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

  async function deleteDevice(id: string) {
    isLoading.value = true
    try {
      await rfidDeviceApi.delete(id)
      devices.value = devices.value.filter((d) => d.id !== id)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Appelé par useRealtimeSubscriptions - met à jour le statut d'un device RFID.
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
    if (currentDevice.value?.id === data.deviceId) {
      currentDevice.value.isOnline = data.status === 'online'
      currentDevice.value.lastPingAt = data.timestamp
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
    deleteDevice,
    handleRealtimeDevice,
  }
})
