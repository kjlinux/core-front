import { ref } from 'vue'
import { defineStore } from 'pinia'
import { biometricApi } from '@/services/api/biometric.api'
import { getEcho } from '@/services/echo'
import type { BiometricDevice, FingerprintEnrollment } from '@/types'

export const useBiometricStore = defineStore('biometric', () => {
  const devices = ref<BiometricDevice[]>([])
  const currentDevice = ref<BiometricDevice | null>(null)
  const enrollments = ref<FingerprintEnrollment[]>([])

  const isLoading = ref(false)

  async function fetchDevices() {
    isLoading.value = true
    try {
      const response = await biometricApi.getDevices()
      devices.value = response.data
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

  async function fetchEnrollments() {
    isLoading.value = true
    try {
      const response = await biometricApi.getEnrollments()
      enrollments.value = response.data
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

  async function enrollViaDevice(employeeId: string, deviceId: string) {
    return await biometricApi.enrollViaDevice(employeeId, deviceId)
  }

  async function pollEnrollmentStatus(
    enrollmentId: string,
    onUpdate: (enrollment: FingerprintEnrollment) => void,
    options: { interval?: number; timeout?: number } = {},
  ) {
    const interval = options.interval ?? 2000
    const timeout = options.timeout ?? 60000
    const startTime = Date.now()

    return new Promise<FingerprintEnrollment>((resolve, reject) => {
      const poll = async () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error('Delai d\'attente depasse pour l\'enrolement'))
          return
        }

        try {
          const enrollment = await biometricApi.getEnrollment(enrollmentId)
          onUpdate(enrollment)

          if (enrollment.status === 'enrolled') {
            enrollments.value.push(enrollment)
            resolve(enrollment)
            return
          }

          if (enrollment.status === 'failed') {
            reject(new Error('L\'enrolement a echoue'))
            return
          }

          setTimeout(poll, interval)
        } catch (error) {
          reject(error)
        }
      }

      setTimeout(poll, interval)
    })
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


  async function syncDevice(id: string) {
    isLoading.value = true
    try {
      await biometricApi.syncDevice(id)
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
      if (data.deviceType === 'biometric') {
        const device = devices.value.find((d) => d.id === data.deviceId)
        if (device) {
          device.isOnline = data.status === 'online'
          device.lastSyncAt = data.timestamp
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
    enrollments,

    isLoading,
    fetchDevices,
    fetchDevice,
    fetchEnrollments,
    startEnrollment,
    enrollViaDevice,
    pollEnrollmentStatus,
    deleteEnrollment,
    syncDevice,
    subscribeRealtime,
    unsubscribeRealtime,
  }
})
