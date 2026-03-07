import apiClient from './client'
import type { AttendanceRecord, AttendanceDailyReport, AttendanceSummary } from '@/types'

export interface AttendanceFilters {
  companyId?: string
  siteId?: string
  departmentId?: string
  employeeId?: string
  status?: string
  source?: 'rfid' | 'biometric'
  page?: number
  perPage?: number
}

export interface DateRange {
  startDate: string
  endDate: string
}

export const attendanceApi = {
  getDailyReport(date: string, filters?: AttendanceFilters): Promise<AttendanceDailyReport> {
    return apiClient.get('/attendance/daily', { params: { date, ...filters } }).then((r) => r.data)
  },

  getMonthlyReport(month: string, filters?: AttendanceFilters): Promise<any> {
    return apiClient.get('/attendance/monthly', { params: { month, ...filters } }).then((r) => r.data)
  },

  getByEmployee(employeeId: string, dateRange: DateRange): Promise<AttendanceRecord[]> {
    return apiClient
      .get(`/attendance/employee/${employeeId}`, {
        params: { start_date: dateRange.startDate, end_date: dateRange.endDate },
      })
      .then((r) => r.data)
  },

  getByDepartment(departmentId: string, dateRange: DateRange): Promise<AttendanceRecord[]> {
    return apiClient
      .get(`/attendance/department/${departmentId}`, {
        params: { start_date: dateRange.startDate, end_date: dateRange.endDate },
      })
      .then((r) => r.data)
  },

  getSummary(filters?: AttendanceFilters): Promise<AttendanceSummary[]> {
    return apiClient.get('/attendance/summary', { params: filters }).then((r) => r.data)
  },

  getBiometricReport(date: string, filters?: AttendanceFilters): Promise<AttendanceDailyReport> {
    return apiClient.get('/attendance/biometric', { params: { date, ...filters } }).then((r) => r.data)
  },
}
