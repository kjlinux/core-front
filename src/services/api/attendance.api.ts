import apiClient from './client'
import type { AttendanceRecord, AttendanceDailyReport, AttendanceSummary } from '@/types'

export interface AttendanceFilters {
  companyId?: string
  siteId?: string
  departmentId?: string
  employeeId?: string
  status?: string
  page?: number
  perPage?: number
}

export interface DateRange {
  start: string
  end: string
}

export const attendanceApi = {
  getDailyReport(date: string, filters?: AttendanceFilters): Promise<AttendanceDailyReport> {
    return apiClient.get('/attendance/daily', { params: { date, ...filters } }).then((r) => r.data?.data ?? r.data)
  },

  getMonthlyReport(month: string, filters?: AttendanceFilters): Promise<AttendanceSummary[]> {
    return apiClient.get('/attendance/monthly', { params: { month, ...filters } }).then((r) => r.data?.data ?? r.data)
  },

  getByEmployee(employeeId: string, dateRange: DateRange): Promise<AttendanceRecord[]> {
    return apiClient
      .get(`/attendance/employee/${employeeId}`, { params: dateRange })
      .then((r) => r.data?.data ?? r.data)
  },

  getByDepartment(departmentId: string, dateRange: DateRange): Promise<AttendanceRecord[]> {
    return apiClient
      .get(`/attendance/department/${departmentId}`, { params: dateRange })
      .then((r) => r.data?.data ?? r.data)
  },

  getSummary(filters?: AttendanceFilters): Promise<AttendanceSummary[]> {
    return apiClient.get('/attendance/summary', { params: filters }).then((r) => r.data?.data ?? r.data)
  },
}
