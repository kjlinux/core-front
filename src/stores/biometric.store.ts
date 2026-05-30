import { ref } from 'vue'
import { defineStore } from 'pinia'
import { biometricApi } from '@/services/api/biometric.api'
import type { BiometricDeviceFilters, EnrollmentFilters } from '@/services/api/biometric.api'
import type { BiometricDevice, FingerprintEnrollment } from '@/types'

export const useBiometricStore = defineStore('biometric', () => {
  const devices = ref<BiometricDevice[]>([])
  const currentDevice = ref<BiometricDevice | null>(null)
  const enrollments = ref<FingerprintEnrollment[]>([])

  // Pagination distincte par liste : les deux listes partagent le store mais
  // chacune a sa propre table server-side (cf. DeviceListPage / EnrollmentListPage).
  const devicesPagination = ref({
    currentPage: 1,
    perPage: 15,
    total: 0,
    totalPages: 0,
  })
  const enrollmentsPagination = ref({
    currentPage: 1,
    perPage: 15,
    total: 0,
    totalPages: 0,
  })

  const isLoading = ref(false)

  async function fetchDevices(filters?: BiometricDeviceFilters) {
    isLoading.value = true
    try {
      const response = await biometricApi.getDevices(filters)
      devices.value = response.data
      devicesPagination.value = response.meta
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDevice(id: string) {
    isLoading.value = true
    try {
      const device = await biometricApi.getDevice(id)
      currentDevice.value = device
      return device
    } finally {
      isLoading.value = false
    }
  }

  async function fetchEnrollments(filters?: EnrollmentFilters) {
    isLoading.value = true
    try {
      const response = await biometricApi.getEnrollments(filters)
      enrollments.value = response.data
      enrollmentsPagination.value = response.meta
    } finally {
      isLoading.value = false
    }
  }

  async function startEnrollment(data: Partial<FingerprintEnrollment>) {
    isLoading.value = true
    try {
      const enrollment = await biometricApi.startEnrollment(data)
      enrollments.value.push(enrollment)
      return enrollment
    } finally {
      isLoading.value = false
    }
  }

  async function createDevice(data: Partial<BiometricDevice>) {
    isLoading.value = true
    try {
      const device = await biometricApi.createDevice(data)
      devices.value.push(device)
      return device
    } finally {
      isLoading.value = false
    }
  }

  async function enrollViaDevice(employeeId: string, deviceId: string) {
    return await biometricApi.enrollViaDevice(employeeId, deviceId)
  }

  function pollEnrollmentStatus(
    enrollmentId: string,
    onUpdate: (enrollment: FingerprintEnrollment) => void,
    options: { interval?: number; timeout?: number } = {},
  ): { promise: Promise<FingerprintEnrollment>; stop: () => void } {
    const interval = options.interval ?? 2000
    const timeout = options.timeout ?? 60000
    const startTime = Date.now()

    let cancelled = false
    let timerHandle: ReturnType<typeof setTimeout> | null = null

    const stop = () => {
      cancelled = true
      if (timerHandle !== null) {
        clearTimeout(timerHandle)
        timerHandle = null
      }
    }

    const promise = new Promise<FingerprintEnrollment>((resolve, reject) => {
      const poll = async () => {
        if (cancelled) {
          reject(new Error('Enrôlement annulé'))
          return
        }
        if (Date.now() - startTime > timeout) {
          reject(new Error('Délai d\'attente dépassé pour l\'enrôlement'))
          return
        }

        try {
          const enrollment = await biometricApi.getEnrollment(enrollmentId)
          if (cancelled) {
            reject(new Error('Enrôlement annulé'))
            return
          }
          onUpdate(enrollment)

          if (enrollment.status === 'enrolled') {
            const idx = enrollments.value.findIndex((e) => e.id === enrollment.id)
            if (idx >= 0) {
              enrollments.value[idx] = enrollment
            } else {
              enrollments.value.push(enrollment)
            }
            resolve(enrollment)
            return
          }

          if (enrollment.status === 'failed') {
            reject(new Error('L\'enrôlement a échoué'))
            return
          }

          timerHandle = setTimeout(poll, interval)
        } catch (error) {
          reject(error)
        }
      }

      poll()
    })

    return { promise, stop }
  }

  async function deleteEnrollment(id: string) {
    isLoading.value = true
    try {
      await biometricApi.deleteEnrollment(id)
      enrollments.value = enrollments.value.filter((e) => e.id !== id)
    } finally {
      isLoading.value = false
    }
  }

  async function setDeviceOnline(id: string, isOnline: boolean) {
    const device = await biometricApi.setDeviceOnline(id, isOnline)
    const idx = devices.value.findIndex((d) => d.id === id)
    if (idx !== -1) devices.value[idx] = device
    if (currentDevice.value?.id === id) currentDevice.value = device
    return device
  }

  async function syncDevice(id: string) {
    isLoading.value = true
    try {
      await biometricApi.syncDevice(id)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Appelé par useRealtimeSubscriptions - met à jour le statut d'un device biométrique.
   */
  function handleRealtimeDevice(data: {
    deviceId: string
    status: string
    timestamp: string
  }) {
    const device = devices.value.find((d) => d.id === data.deviceId)
    if (device) {
      device.isOnline = data.status === 'online'
      device.lastSyncAt = data.timestamp
    }
  }

  return {
    devices,
    currentDevice,
    enrollments,
    devicesPagination,
    enrollmentsPagination,
    isLoading,
    fetchDevices,
    fetchDevice,
    fetchEnrollments,
    createDevice,
    startEnrollment,
    enrollViaDevice,
    pollEnrollmentStatus,
    deleteEnrollment,
    setDeviceOnline,
    syncDevice,
    handleRealtimeDevice,
  }
})
