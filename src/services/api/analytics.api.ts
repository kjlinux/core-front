import apiClient from './client'

export interface MonthlyAttendancePoint {
  label: string
  present: number
  late: number
  absent: number
}

export interface DepartmentAttendancePoint {
  label: string
  present: number
  late: number
  absent: number
}

export interface HeadcountPoint {
  label: string
  newHires: number
  headcount: number
}

export interface SatisfactionPoint {
  label: string
  total: number
  satisfactionRate: number
}

export interface AdvancedAnalytics {
  period: { months: number; start: string; end: string }
  monthlyAttendance: MonthlyAttendancePoint[]
  punctuality: { present: number; late: number; punctualityRate: number }
  attendanceByDepartment: DepartmentAttendancePoint[]
  attendanceBySite: DepartmentAttendancePoint[]
  headcountEvolution: HeadcountPoint[]
  satisfactionByMonth: SatisfactionPoint[]
}

export const analyticsApi = {
  advanced(params?: { months?: number }): Promise<AdvancedAnalytics> {
    return apiClient.get('/analytics/advanced', { params }).then((r) => r.data)
  },
}
