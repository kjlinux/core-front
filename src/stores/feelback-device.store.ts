import { ref } from 'vue'
import { defineStore } from 'pinia'
import { feelbackDeviceApi } from '@/services/api/feelback-device.api'
import { getEcho } from '@/services/echo'
import type { FeelbackDevice } from '@/types'

export const useFeelbackDeviceStore = defineStore('feelback-device', () => {
  const devices = ref<FeelbackDevice[]>([])
  const currentDevice = ref<FeelbackDevice | null>(null)
  const isLoading = ref(false)

  async function fetchDevices() {
    isLoading.value = true
    try {
      const response = await feelbackDeviceApi.getAll()
      devices.value = response.data
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDevice(id: string) {
    isLoading.value = true
    try {
      const response = await feelbackDeviceApi.getById(id)
      currentDevice.value = response.data
      return response.data
    } finally {
      isLoading.value = false
    }
  }

  async function registerDevice(data: Partial<FeelbackDevice>) {
    isLoading.value = true
    try {
      const response = await feelbackDeviceApi.register(data)
      devices.value.push(response.data)
      return response.data
    } finally {
      isLoading.value = false
    }
  }

  async function updateDevice(id: string, data: Partial<FeelbackDevice>) {
    isLoading.value = true
    try {
      const response = await feelbackDeviceApi.update(id, data)
      const updated = response.data
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
      await feelbackDeviceApi.delete(id)
      devices.value = devices.value.filter((d) => d.id !== id)
    } finally {
      isLoading.value = false
    }
  }

  async function restartDevice(id: string) {
    isLoading.value = true
    try {
      await feelbackDeviceApi.restart(id)
    } finally {
      isLoading.value = false
    }
  }

  function subscribeRealtime() {
    const echo = getEcho()
    if (!echo) return

    echo.channel('devices').listen('.device.status.updated', (data: {
      deviceType: string
      deviceId: string
      status: string
      data: Record<string, unknown>
      timestamp: string
    }) => {
      if (data.deviceType === 'feelback') {
        const device = devices.value.find((d) => d.id === data.deviceId)
        if (device) {
          device.isOnline = data.status === 'online'
          device.lastPingAt = data.timestamp
          if (data.data?.batteryLevel !== undefined) {
            device.batteryLevel = data.data.batteryLevel as number
          }
        }
      }
    })
  }

  function unsubscribeRealtime() {
    const echo = getEcho()
    if (!echo) return
    echo.leave('devices')
  }

  return {
    devices,
    currentDevice,
    isLoading,
    fetchDevices,
    fetchDevice,
    registerDevice,
    updateDevice,
    deleteDevice,
    restartDevice,
    subscribeRealtime,
    unsubscribeRealtime,
  }
})
