import apiClient from './client'
import type { ApiResponse, PaginatedResponse } from '@/types'

export interface AttendanceFilters {
  companyId?: number
  siteId?: number
  departmentId?: number
  employeeId?: number
  status?: string
  page?: number
  perPage?: number
}

export interface DateRange {
  startDate: string
  endDate: string
}

export const attendanceApi = {
  getDailyReport(date: string, filters?: AttendanceFilters): Promise<ApiResponse<unknown>> {
    return apiClient.get('/attendance/daily', { params: { date, ...filters } }).then((r) => r.data)
  },

  getMonthlyReport(month: string, filters?: AttendanceFilters): Promise<ApiResponse<unknown>> {
    return apiClient.get('/attendance/monthly', { params: { month, ...filters } }).then((r) => r.data)
  },

  getByEmployee(
    employeeId: number,
    dateRange: DateRange
  ): Promise<PaginatedResponse<unknown>> {
    return apiClient
      .get(`/attendance/employee/${employeeId}`, { params: dateRange })
      .then((r) => r.data)
  },

  getByDepartment(
    departmentId: number,
    dateRange: DateRange
  ): Promise<PaginatedResponse<unknown>> {
    return apiClient
      .get(`/attendance/department/${departmentId}`, { params: dateRange })
      .then((r) => r.data)
  },

  getSummary(filters?: AttendanceFilters): Promise<ApiResponse<unknown>> {
    return apiClient.get('/attendance/summary', { params: filters }).then((r) => r.data)
  },
}
