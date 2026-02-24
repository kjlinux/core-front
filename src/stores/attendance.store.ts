import { ref } from 'vue'
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

  async function fetchDailyAttendance(date: string, filters?: Record<string, unknown>) {
    isLoading.value = true
    try {
      dailyReport.value = await attendanceApi.getDailyReport(date, filters)
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

  return { records, dailyReport, summaries, recentActivity, isLoading, dateRange, fetchDailyAttendance, fetchMonthlyReport, fetchByEmployee, fetchByDepartment, fetchDailyStats, fetchRecentActivity }
})
