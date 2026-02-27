import { ref } from 'vue'
import { defineStore } from 'pinia'
import { rfidDeviceApi } from '@/services/api/rfid-device.api'
import { getEcho } from '@/services/echo'
import type { RfidDevice } from '@/types'

export const useRfidDeviceStore = defineStore('rfid-device', () => {
  const devices = ref<RfidDevice[]>([])
  const currentDevice = ref<RfidDevice | null>(null)
  const isLoading = ref(false)

  async function fetchDevices() {
    isLoading.value = true
    try {
      const response = await rfidDeviceApi.getAll()
      devices.value = response.data
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDevice(id: string) {
    isLoading.value = true
    try {
      const response = await rfidDeviceApi.getById(id)
      currentDevice.value = response.data
      return response.data
    } finally {
      isLoading.value = false
    }
  }

  async function registerDevice(data: Partial<RfidDevice>) {
    isLoading.value = true
    try {
      const response = await rfidDeviceApi.register(data)
      devices.value.push(response.data)
      return response.data
    } finally {
      isLoading.value = false
    }
  }

  async function updateDevice(id: string, data: Partial<RfidDevice>) {
    isLoading.value = true
    try {
      const response = await rfidDeviceApi.update(id, data)
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
      await rfidDeviceApi.delete(id)
      devices.value = devices.value.filter((d) => d.id !== id)
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
      if (data.deviceType === 'rfid') {
        const device = devices.value.find((d) => d.id === data.deviceId)
        if (device) {
          device.isOnline = data.status === 'online'
          device.lastPingAt = data.timestamp
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
    subscribeRealtime,
    unsubscribeRealtime,
  }
})
