import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { attendanceApi } from '@/services/api/attendance.api'
import type { AttendanceRecord, AttendanceDailyReport, AttendanceSummary } from '@/types'
import type { DateRange } from '@/services/api/attendance.api'

export const useAttendanceStore = defineStore('attendance', () => {
  // --- State ---
  const records = ref<AttendanceRecord[]>([])
  const dailyReport = ref<AttendanceDailyReport | null>(null)
  const summaries = ref<AttendanceSummary[]>([])
  const recentActivity = ref<AttendanceRecord[]>([])
  const isLoading = ref(false)
  const dateRange = ref<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: '',
  })

  // Monthly state
  const monthlyRecords = ref<any[]>([])
  const monthlyStatsData = ref<{ averageAttendanceRate: number; totalAbsences: number; totalLateMinutes: number } | null>(null)

  // Employee state
  const employeeRecords = ref<AttendanceRecord[]>([])
  const employeeStatsData = ref<{ totalDays: number; presentDays: number; lateDays: number; onTimePercentage: number } | null>(null)
  const employeeCalendarData = ref<Array<{ date: string; dayNumber: number; status: string; statusLabel: string; tooltip: string }>>([])

  // Department state
  const departmentEmployeesData = ref<any[]>([])
  const departmentStatsData = ref<{ totalEmployees: number; averageAttendanceRate: number; totalAbsences: number; totalLateInstances: number } | null>(null)

  // --- Computed aliases ---
  const dailyAttendance = computed(() => dailyReport.value?.records ?? [])
  const dailyAttendanceTotal = computed(() => dailyReport.value?.records?.length ?? 0)
  const dailyStats = computed(() => {
    if (!dailyReport.value) return null
    return {
      totalEmployees: dailyReport.value.totalEmployees,
      present: dailyReport.value.present,
      absent: dailyReport.value.absent,
      late: dailyReport.value.late,
      averageEntryTime: (dailyReport.value as any).averageEntryTime ?? '—',
      earlyDepartures: (dailyReport.value as any).earlyDepartures ?? 0,
      doubleBadgeCount: (dailyReport.value as any).doubleBadgeCount ?? 0,
    }
  })

  const monthlyAttendance = computed(() => monthlyRecords.value)
  const monthlyAttendanceTotal = computed(() => monthlyRecords.value.length)
  const monthlyStats = computed(() => monthlyStatsData.value)

  const employeeAttendance = computed(() => employeeRecords.value)
  const employeeAttendanceTotal = computed(() => employeeRecords.value.length)
  const employeeStats = computed(() => employeeStatsData.value)
  const employeeCalendar = computed(() => employeeCalendarData.value)

  const departmentEmployees = computed(() => departmentEmployeesData.value)
  const departmentEmployeesTotal = computed(() => departmentEmployeesData.value.length)
  const departmentStats = computed(() => departmentStatsData.value)

  // --- Actions ---

  async function fetchDailyAttendance(params: { date?: string; source?: 'rfid' | 'biometric'; departmentId?: string; siteId?: string; status?: string; page?: number; perPage?: number } | string, filters?: Record<string, unknown>) {
    isLoading.value = true
    try {
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

  async function fetchMonthlyAttendance(params: { month: string; year: string; department?: string; employeeName?: string; page?: number; perPage?: number }) {
    isLoading.value = true
    try {
      const monthStr = `${params.year}-${String(params.month).padStart(2, '0')}`
      const response = await attendanceApi.getMonthlyReport(monthStr)
      const rawSummaries: any[] = (response as any)?.summaries ?? (Array.isArray(response) ? response : [])
      monthlyRecords.value = rawSummaries.map((s: any) => ({
        employeeId: s.employee_id ?? s.employeeId ?? '',
        employeeName: s.employee_name ?? s.employeeName ?? '',
        period: monthStr,
        totalDays: s.totalDays ?? 0,
        presentDays: s.presentDays ?? 0,
        absentDays: s.absentDays ?? 0,
        lateDays: s.lateDays ?? 0,
        totalLateMinutes: s.totalLateMinutes ?? 0,
        averageEntryTime: s.averageEntryTime ?? '—',
        averageExitTime: s.averageExitTime ?? '—',
        attendanceRate: (s.totalDays ?? 0) > 0 ? Math.round(((s.presentDays ?? 0) / s.totalDays) * 100) : 0,
      }))
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMonthlyStats(params: { month: string; year: string }) {
    try {
      const monthStr = `${params.year}-${String(params.month).padStart(2, '0')}`
      const response = await attendanceApi.getMonthlyReport(monthStr)
      const rawSummaries: any[] = (response as any)?.summaries ?? (Array.isArray(response) ? response : [])
      const totalAbsences = rawSummaries.reduce((sum: number, s: any) => sum + (s.absentDays ?? 0), 0)
      const totalLateMinutes = rawSummaries.reduce((sum: number, s: any) => sum + (s.totalLateMinutes ?? 0), 0)
      const rates = rawSummaries.map((s: any) => (s.totalDays ?? 0) > 0 ? ((s.presentDays ?? 0) / s.totalDays) * 100 : 0)
      const averageAttendanceRate = rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0
      monthlyStatsData.value = { averageAttendanceRate, totalAbsences, totalLateMinutes }
    } catch {
      monthlyStatsData.value = null
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

  async function fetchEmployeeAttendance(params: { employeeId: string; startDate: string; endDate: string; page?: number; perPage?: number }) {
    isLoading.value = true
    try {
      const result = await attendanceApi.getByEmployee(params.employeeId, { startDate: params.startDate, endDate: params.endDate })
      employeeRecords.value = Array.isArray(result) ? result : []
      const firstName = (employeeRecords.value[0] as any)?.employeeName
      return firstName ? { employeeName: firstName } : null
    } finally {
      isLoading.value = false
    }
  }

  async function fetchEmployeeStats(params: { employeeId: string; startDate: string; endDate: string }) {
    try {
      const result = await attendanceApi.getByEmployee(params.employeeId, { startDate: params.startDate, endDate: params.endDate })
      const recs = Array.isArray(result) ? result : []
      const totalDays = recs.length
      const presentDays = recs.filter((r) => r.status === 'present' || r.status === 'late').length
      const lateDays = recs.filter((r) => r.status === 'late').length
      const onTimeDays = presentDays - lateDays
      employeeStatsData.value = {
        totalDays,
        presentDays,
        lateDays,
        onTimePercentage: presentDays > 0 ? Math.round((onTimeDays / presentDays) * 100) : 0,
      }
    } catch {
      employeeStatsData.value = null
    }
  }

  async function fetchEmployeeCalendar(params: { employeeId: string; startDate: string; endDate: string }) {
    try {
      const result = await attendanceApi.getByEmployee(params.employeeId, { startDate: params.startDate, endDate: params.endDate })
      const recs = Array.isArray(result) ? result : []
      const statusLabels: Record<string, string> = {
        present: 'Présent',
        late: 'En retard',
        absent: 'Absent',
        left_early: 'Départ anticipé',
        weekend: 'Weekend',
      }
      employeeCalendarData.value = recs.map((r) => {
        const d = new Date(r.date)
        const isWeekend = d.getDay() === 0 || d.getDay() === 6
        const status = isWeekend ? 'weekend' : (r.status ?? 'absent')
        return {
          date: r.date,
          dayNumber: d.getDate(),
          status,
          statusLabel: statusLabels[status] ?? status,
          tooltip: `${r.date} — ${statusLabels[status] ?? status}`,
        }
      })
    } catch {
      employeeCalendarData.value = []
    }
  }

  async function fetchDepartmentAttendance(params: { departmentId: string; startDate: string; endDate: string; page?: number; perPage?: number }) {
    isLoading.value = true
    try {
      const result = await attendanceApi.getByDepartment(params.departmentId, { startDate: params.startDate, endDate: params.endDate })
      const recs = Array.isArray(result) ? result : []
      const byEmployee: Record<string, any[]> = {}
      for (const r of recs) {
        if (!byEmployee[r.employeeId]) byEmployee[r.employeeId] = []
        byEmployee[r.employeeId].push(r)
      }
      departmentEmployeesData.value = Object.entries(byEmployee).map(([empId, empRecs]) => {
        const totalDays = empRecs.length
        const presentDays = empRecs.filter((r) => r.status === 'present' || r.status === 'late').length
        const absentDays = empRecs.filter((r) => r.status === 'absent').length
        const lateDays = empRecs.filter((r) => r.status === 'late').length
        return {
          employeeId: empId,
          name: empRecs[0]?.employeeName ?? '',
          position: (empRecs[0] as any)?.position ?? '—',
          presentDays,
          absentDays,
          lateDays,
          attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
        }
      })
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDepartmentStats(params: { departmentId: string; startDate: string; endDate: string }) {
    try {
      const result = await attendanceApi.getByDepartment(params.departmentId, { startDate: params.startDate, endDate: params.endDate })
      const recs = Array.isArray(result) ? result : []
      const employeeIds = new Set(recs.map((r) => r.employeeId))
      const totalAbsences = recs.filter((r) => r.status === 'absent').length
      const totalLateInstances = recs.filter((r) => r.status === 'late').length
      const byEmployee: Record<string, any[]> = {}
      for (const r of recs) {
        if (!byEmployee[r.employeeId]) byEmployee[r.employeeId] = []
        byEmployee[r.employeeId].push(r)
      }
      const rates = Object.values(byEmployee).map((empRecs) => {
        const total = empRecs.length
        const present = empRecs.filter((r) => r.status === 'present' || r.status === 'late').length
        return total > 0 ? (present / total) * 100 : 0
      })
      const averageAttendanceRate = rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0
      departmentStatsData.value = {
        totalEmployees: employeeIds.size,
        averageAttendanceRate,
        totalAbsences,
        totalLateInstances,
      }
    } catch {
      departmentStatsData.value = null
    }
  }

  async function fetchByEmployee(employeeId: string, range: { startDate: string; endDate: string }) {
    isLoading.value = true
    dateRange.value = range
    try {
      records.value = await attendanceApi.getByEmployee(employeeId, range)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchByDepartment(departmentId: string, range: { startDate: string; endDate: string }) {
    isLoading.value = true
    dateRange.value = range
    try {
      records.value = await attendanceApi.getByDepartment(departmentId, range)
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

  /**
   * Appelé par useRealtimeSubscriptions pour mettre à jour le state en temps réel.
   * Ne s'abonne PAS au canal Echo — c'est useRealtimeSubscriptions qui gère ça.
   */
  function handleRealtimeAttendance(data: {
    id: string
    employeeId: string
    employeeName: string
    date: string
    entryTime: string | null
    exitTime: string | null
    status: string
    source: string
  }) {
    const record: AttendanceRecord = {
      id: data.id,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      date: data.date,
      entryTime: data.entryTime ?? '',
      exitTime: data.exitTime ?? '',
      status: data.status as AttendanceRecord['status'],
      source: data.source as AttendanceRecord['source'],
    } as AttendanceRecord

    // Mettre à jour ou insérer dans recentActivity
    const existingIdx = recentActivity.value.findIndex((r) => r.id === data.id)
    if (existingIdx !== -1) {
      recentActivity.value[existingIdx] = record
    } else {
      recentActivity.value.unshift(record)
      if (recentActivity.value.length > 20) {
        recentActivity.value.pop()
      }
    }

    // Mettre à jour la liste principale si on regarde aujourd'hui
    const today = new Date().toISOString().split('T')[0]
    if (data.date === today) {
      const idx = records.value.findIndex((r) => r.id === data.id)
      if (idx !== -1) {
        records.value[idx] = record
      } else {
        records.value.unshift(record)
      }
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
    // Monthly
    monthlyAttendance,
    monthlyAttendanceTotal,
    monthlyStats,
    // Employee
    employeeAttendance,
    employeeAttendanceTotal,
    employeeStats,
    employeeCalendar,
    // Department
    departmentEmployees,
    departmentEmployeesTotal,
    departmentStats,
    // Actions
    fetchDailyAttendance,
    fetchDailyStats,
    fetchMonthlyAttendance,
    fetchMonthlyStats,
    fetchMonthlyReport,
    fetchEmployeeAttendance,
    fetchEmployeeStats,
    fetchEmployeeCalendar,
    fetchDepartmentAttendance,
    fetchDepartmentStats,
    fetchByEmployee,
    fetchByDepartment,
    fetchRecentActivity,
    fetchBiometricAttendance,
    handleRealtimeAttendance,
  }
})
