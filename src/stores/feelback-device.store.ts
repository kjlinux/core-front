import { ref } from 'vue'
import { defineStore } from 'pinia'
import { feelbackDeviceApi } from '@/services/api/feelback-device.api'
import type { FeelbackDevice } from '@/types'

export const useFeelbackDeviceStore = defineStore('feelback-device', () => {
  const devices = ref<FeelbackDevice[]>([])
  const currentDevice = ref<FeelbackDevice | null>(null)
  const isLoading = ref(false)

  async function fetchDevices() {
    isLoading.value = true
    try {
      devices.value = await feelbackDeviceApi.getAll()
    } finally {
      isLoading.value = false
    }
  }

  async function registerDevice(data: Partial<FeelbackDevice>) {
    isLoading.value = true
    try {
      const created = await feelbackDeviceApi.register(data)
      devices.value.push(created)
      return created
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDevice(id: string) {
    isLoading.value = true
    try {
      currentDevice.value = await feelbackDeviceApi.getById(id)
    } finally {
      isLoading.value = false
    }
  }

  return { devices, currentDevice, isLoading, fetchDevices, registerDevice, fetchDevice }
})
