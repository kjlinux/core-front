import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { firmwareApi } from '@/services/api/firmware.api'
import type { FirmwareVersion, DeviceFirmwareStatus, OtaUpdateLog, CompanyUpdateProgress } from '@/types'

export const useFirmwareStore = defineStore('firmware', () => {
  const versions = ref<FirmwareVersion[]>([])
  const deviceStatuses = ref<DeviceFirmwareStatus[]>([])
  const updateLogs = ref<OtaUpdateLog[]>([])
  const isLoading = ref(false)
  const pagination = ref({ currentPage: 1, perPage: 15, total: 0, totalPages: 0 })

  // Mise à jour en masse — une derniere version publiee par type d'appareil
  const latestPublishedByKind = ref<{ rfid: FirmwareVersion | null; biometric: FirmwareVersion | null }>({
    rfid: null,
    biometric: null,
  })
  // Compat : premiere version publiee non nulle (RFID prioritaire).
  const latestPublishedVersion = computed<FirmwareVersion | null>(
    () => latestPublishedByKind.value.rfid ?? latestPublishedByKind.value.biometric,
  )
  // Liste des bannieres a afficher (une par type ayant une version publiee).
  const publishedBanners = computed<FirmwareVersion[]>(() =>
    [latestPublishedByKind.value.rfid, latestPublishedByKind.value.biometric].filter(
      (v): v is FirmwareVersion => v !== null,
    ),
  )
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
    if (updated.deviceKind === 'rfid' || updated.deviceKind === 'biometric') {
      latestPublishedByKind.value[updated.deviceKind] = updated
    }
    return updated
  }

  async function fetchLatestPublished() {
    // Recupere en parallele la derniere publiee par type d'appareil.
    const fetchByKind = async (kind: 'rfid' | 'biometric'): Promise<FirmwareVersion | null> => {
      try {
        const response = await firmwareApi.getVersions({ device_kind: kind, perPage: 5 } as Record<string, unknown>)
        return response.data.find((v) => v.isPublished) ?? null
      } catch {
        return null
      }
    }
    const [rfid, biometric] = await Promise.all([fetchByKind('rfid'), fetchByKind('biometric')])
    latestPublishedByKind.value = { rfid, biometric }
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

  async function retryPending(firmwareVersionId: string) {
    const result = await firmwareApi.retryPending(firmwareVersionId)
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
    latestPublishedByKind,
    publishedBanners,
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
    retryPending,
  }
})
