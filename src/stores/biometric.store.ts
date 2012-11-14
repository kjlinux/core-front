import { ref } from 'vue'
import { defineStore } from 'pinia'
import { biometricApi } from '@/services/api/biometric.api'
import type { BiometricDevice, FingerprintEnrollment, BiometricAuditEntry } from '@/types'

export const useBiometricStore = defineStore('biometric', () => {
  const devices = ref<BiometricDevice[]>([])
  const enrollments = ref<FingerprintEnrollment[]>([])
  const auditLog = ref<BiometricAuditEntry[]>([])
  const isLoading = ref(false)

  async function fetchDevices() {
    isLoading.value = true
    try {
      devices.value = await biometricApi.getDevices()
    } finally {
      isLoading.value = false
    }
  }

  async function fetchEnrollments() {
    isLoading.value = true
    try {
      enrollments.value = await biometricApi.getEnrollments()
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

  async function fetchAuditLog() {
    isLoading.value = true
    try {
      auditLog.value = await biometricApi.getAuditLog()
    } finally {
      isLoading.value = false
    }
  }

  async function fetchInconsistencies() {
    isLoading.value = true
    try {
      return await biometricApi.getInconsistencies()
    } finally {
      isLoading.value = false
    }
  }

  return { devices, enrollments, auditLog, isLoading, fetchDevices, fetchEnrollments, startEnrollment, fetchAuditLog, fetchInconsistencies }
})
