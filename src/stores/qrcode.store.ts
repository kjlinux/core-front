import { ref } from 'vue'
import { defineStore } from 'pinia'
import { qrcodeApi } from '@/services/api/qrcode.api'
import type { QrCode, QrAttendanceRecord, QrCodeStats } from '@/types'

export const useQrcodeStore = defineStore('qrcode', () => {
  const qrCodes = ref<QrCode[]>([])
  const currentQrCode = ref<QrCode | null>(null)
  const attendanceRecords = ref<QrAttendanceRecord[]>([])
  const stats = ref<QrCodeStats | null>(null)
  const isLoading = ref(false)
  const pagination = ref({ currentPage: 1, perPage: 15, total: 0, totalPages: 0 })

  async function fetchQrCodes(params?: Record<string, unknown>) {
    isLoading.value = true
    try {
      const response = await qrcodeApi.getAll(params)
      qrCodes.value = response.data
      pagination.value = response.meta
    } finally {
      isLoading.value = false
    }
  }

  async function fetchQrCode(id: string) {
    isLoading.value = true
    try {
      currentQrCode.value = await qrcodeApi.getById(id)
    } finally {
      isLoading.value = false
    }
  }

  async function generateQrCode(employeeId: string) {
    isLoading.value = true
    try {
      const created = await qrcodeApi.generate(employeeId)
      // Replace existing QR for this employee in the list
      const index = qrCodes.value.findIndex((q) => q.employeeId === employeeId)
      if (index !== -1) {
        qrCodes.value[index] = created
      } else {
        qrCodes.value.unshift(created)
      }
      return created
    } finally {
      isLoading.value = false
    }
  }

  async function revokeQrCode(id: string) {
    await qrcodeApi.revoke(id)
    const index = qrCodes.value.findIndex((q) => q.id === id)
    if (index !== -1) {
      qrCodes.value[index] = { ...qrCodes.value[index], isActive: false }
    }
  }

  async function fetchStats() {
    isLoading.value = true
    try {
      stats.value = await qrcodeApi.getStats()
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAttendance(params?: Record<string, unknown>) {
    isLoading.value = true
    try {
      const response = await qrcodeApi.getAttendance(params)
      attendanceRecords.value = response.data
      pagination.value = response.meta
    } finally {
      isLoading.value = false
    }
  }

  async function simulateScan(token: string) {
    isLoading.value = true
    try {
      const record = await qrcodeApi.simulateScan(token)
      return record
    } finally {
      isLoading.value = false
    }
  }

  return {
    qrCodes,
    currentQrCode,
    attendanceRecords,
    stats,
    isLoading,
    pagination,
    fetchQrCodes,
    fetchQrCode,
    generateQrCode,
    revokeQrCode,
    fetchStats,
    fetchAttendance,
    simulateScan,
  }
})
