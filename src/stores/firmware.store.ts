import { ref } from 'vue'
import { defineStore } from 'pinia'
import { firmwareApi } from '@/services/api/firmware.api'
import type { FirmwareVersion, DeviceFirmwareStatus, OtaUpdateLog, CompanyUpdateProgress } from '@/types'

export const useFirmwareStore = defineStore('firmware', () => {
  const versions = ref<FirmwareVersion[]>([])
  const deviceStatuses = ref<DeviceFirmwareStatus[]>([])
  const updateLogs = ref<OtaUpdateLog[]>([])
  const isLoading = ref(false)
  const pagination = ref({ currentPage: 1, perPage: 15, total: 0, totalPages: 0 })

  // Mise à jour en masse
  const latestPublishedVersion = ref<FirmwareVersion | null>(null)
  const companyUpdateProgress = ref<CompanyUpdateProgress | null>(null)
  const pollingInterval = ref<ReturnType<typeof setInterval> | null>(null)

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

  async function publishVersion(id: string) {
    const updated = await firmwareApi.publishVersion(id)
    const idx = versions.value.findIndex((v) => v.id === id)
    if (idx !== -1) versions.value[idx] = updated
    latestPublishedVersion.value = updated
    return updated
  }

  async function fetchLatestPublished() {
    try {
      const response = await firmwareApi.getVersions({ perPage: 1 } as Record<string, unknown>)
      // On cherche la dernière version publiée parmi toutes les versions
      const published = response.data.find((v) => v.isPublished)
      if (published) {
        latestPublishedVersion.value = published
      } else {
        // Pas de version publiée dans la page courante — on essaye sans filtre
        latestPublishedVersion.value = null
      }
    } catch {
      latestPublishedVersion.value = null
    }
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

  async function triggerCompanyUpdate(firmwareVersionId: string) {
    isLoading.value = true
    try {
      const result = await firmwareApi.triggerCompanyUpdate(firmwareVersionId)
      startProgressPolling(firmwareVersionId)
      return result
    } finally {
      isLoading.value = false
    }
  }

  function startProgressPolling(firmwareVersionId: string) {
    stopProgressPolling()
    pollingInterval.value = setInterval(async () => {
      try {
        const progress = await firmwareApi.getCompanyUpdateProgress(firmwareVersionId)
        companyUpdateProgress.value = progress
        // Arrêter le polling quand tout est terminé
        if (progress.pending === 0 && progress.inProgress === 0) {
          stopProgressPolling()
        }
      } catch {
        stopProgressPolling()
      }
    }, 5000)
  }

  function stopProgressPolling() {
    if (pollingInterval.value !== null) {
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
    }
  }

  async function retryFailed(firmwareVersionId: string) {
    const result = await firmwareApi.retryFailed(firmwareVersionId)
    startProgressPolling(firmwareVersionId)
    return result
  }

  return {
    versions,
    deviceStatuses,
    updateLogs,
    isLoading,
    pagination,
    latestPublishedVersion,
    companyUpdateProgress,
    fetchVersions,
    uploadVersion,
    deleteVersion,
    setAutoUpdate,
    publishVersion,
    fetchLatestPublished,
    fetchDeviceStatuses,
    triggerUpdate,
    fetchLogs,
    triggerCompanyUpdate,
    startProgressPolling,
    stopProgressPolling,
    retryFailed,
  }
})
