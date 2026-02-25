import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { attendanceApi } from '@/services/api/attendance.api'
import type { AttendanceRecord, AttendanceDailyReport, AttendanceSummary } from '@/types'
import type { DateRange } from '@/services/api/attendance.api'

export const useAttendanceStore = defineStore('attendance', () => {
  const records = ref<AttendanceRecord[]>([])
  const dailyReport = ref<AttendanceDailyReport | null>(null)
  const summaries = ref<AttendanceSummary[]>([])
  const recentActivity = ref<AttendanceRecord[]>([])
  const isLoading = ref(false)
  const dateRange = ref<{ start: string; end: string }>({
    start: '',
    end: '',
  })

  // Aliases pour la compatibilité avec AttendanceDailyPage
  const dailyAttendance = computed(() => dailyReport.value?.records ?? [])
  const dailyAttendanceTotal = computed(() => dailyReport.value?.records?.length ?? 0)
  const dailyStats = computed(() => {
    if (!dailyReport.value) return null
    return {
      totalEmployees: dailyReport.value.totalEmployees,
      present: dailyReport.value.present,
      absent: dailyReport.value.absent,
      late: dailyReport.value.late,
      averageEntryTime: (dailyReport.value as any).averageEntryTime ?? '00:00',
      earlyDepartures: (dailyReport.value as any).earlyDepartures ?? 0,
      doubleBadgeCount: (dailyReport.value as any).doubleBadgeCount ?? 0,
    }
  })

  async function fetchDailyAttendance(params: { date?: string; department?: string; site?: string; status?: string; page?: number; perPage?: number } | string, filters?: Record<string, unknown>) {
    isLoading.value = true
    try {
      // Supporte l'ancienne signature (date: string) et la nouvelle (objet params)
      const date = typeof params === 'string' ? params : (params.date ?? new Date().toISOString().split('T')[0])
      const extraFilters = typeof params === 'string' ? filters : params
      dailyReport.value = await attendanceApi.getDailyReport(date, extraFilters as any)
      if (dailyReport.value) {
        records.value = dailyReport.value.records
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMonthlyReport(month: string, filters?: Record<string, unknown>) {
    isLoading.value = true
    try {
      summaries.value = await attendanceApi.getMonthlyReport(month, filters)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchByEmployee(employeeId: string, range: { start: string; end: string }) {
    isLoading.value = true
    dateRange.value = range
    try {
      records.value = await attendanceApi.getByEmployee(employeeId, range)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchByDepartment(departmentId: string, range: { start: string; end: string }) {
    isLoading.value = true
    dateRange.value = range
    try {
      records.value = await attendanceApi.getByDepartment(departmentId, range)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDailyStats(date: string) {
    isLoading.value = true
    try {
      dailyReport.value = await attendanceApi.getDailyReport(date)
      if (dailyReport.value) {
        records.value = dailyReport.value.records
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchRecentActivity(date: string, limit: number = 10) {
    try {
      const report = await attendanceApi.getDailyReport(date)
      if (report) {
        recentActivity.value = (report.records || []).slice(0, limit)
      }
    } catch {
      recentActivity.value = []
    }
  }

  async function fetchBiometricAttendance(date: string) {
    isLoading.value = true
    try {
      return await attendanceApi.getBiometricReport(date)
    } finally {
      isLoading.value = false
    }
  }

  return {
    records,
    dailyReport,
    dailyAttendance,
    dailyAttendanceTotal,
    dailyStats,
    summaries,
    recentActivity,
    isLoading,
    dateRange,
    fetchDailyAttendance,
    fetchMonthlyReport,
    fetchByEmployee,
    fetchByDepartment,
    fetchDailyStats,
    fetchRecentActivity,
    fetchBiometricAttendance,
  }
})
