import { ref } from 'vue'
import { defineStore } from 'pinia'
import { firmwareApi } from '@/services/api/firmware.api'
import type { FirmwareVersion, DeviceFirmwareStatus, OtaUpdateLog } from '@/types'

export const useFirmwareStore = defineStore('firmware', () => {
  const versions = ref<FirmwareVersion[]>([])
  const deviceStatuses = ref<DeviceFirmwareStatus[]>([])
  const updateLogs = ref<OtaUpdateLog[]>([])
  const isLoading = ref(false)
  const pagination = ref({ currentPage: 1, perPage: 15, total: 0, totalPages: 0 })

  async function fetchVersions(params?: Record<string, unknown>) {
    isLoading.value = true
    try {
      const response = await firmwareApi.getVersions(params)
      versions.value = response.data
      pagination.value = response.meta
    } finally {
      isLoading.value = false
    }
  }

  async function uploadVersion(formData: FormData) {
    isLoading.value = true
    try {
      const created = await firmwareApi.uploadVersion(formData)
      versions.value.unshift(created)
      return created
    } finally {
      isLoading.value = false
    }
  }

  async function deleteVersion(id: string) {
    await firmwareApi.deleteVersion(id)
    versions.value = versions.value.filter((v) => v.id !== id)
  }

  async function setAutoUpdate(id: string, isAutoUpdate: boolean) {
    const updated = await firmwareApi.setAutoUpdate(id, isAutoUpdate)
    const idx = versions.value.findIndex((v) => v.id === id)
    if (idx !== -1) versions.value[idx] = updated
    return updated
  }

  async function fetchDeviceStatuses(params?: Record<string, unknown>) {
    isLoading.value = true
    try {
      deviceStatuses.value = await firmwareApi.getDeviceStatuses(params)
    } finally {
      isLoading.value = false
    }
  }

  async function triggerUpdate(deviceId: string, firmwareVersionId: string) {
    isLoading.value = true
    try {
      const log = await firmwareApi.triggerUpdate(deviceId, firmwareVersionId)
      updateLogs.value.unshift(log)
      return log
    } finally {
      isLoading.value = false
    }
  }

  async function fetchLogs(params?: Record<string, unknown>) {
    isLoading.value = true
    try {
      const response = await firmwareApi.getLogs(params)
      updateLogs.value = response.data
      pagination.value = response.meta
    } finally {
      isLoading.value = false
    }
  }

  return {
    versions,
    deviceStatuses,
    updateLogs,
    isLoading,
    pagination,
    fetchVersions,
    uploadVersion,
    deleteVersion,
    setAutoUpdate,
    fetchDeviceStatuses,
    triggerUpdate,
    fetchLogs,
  }
})
