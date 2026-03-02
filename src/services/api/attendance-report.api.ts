import apiClient from './client'

export interface AttendanceReportRow {
  employeeId: string
  employee: string
  department: string
  site: string
  present: number
  absent: number
  late: number
  overtime: number
  rate: string
  [key: string]: unknown
}

export interface AttendanceReportData {
  totalEmployees: number
  totalPresent: number
  totalAbsent: number
  totalLate: number
  rows: AttendanceReportRow[]
}

export interface AttendanceReportParams {
  start_date: string
  end_date: string
  type?: string
  company_id?: string
  site_id?: string
  department_id?: string
}

export const attendanceReportApi = {
  getReport(params: AttendanceReportParams): Promise<AttendanceReportData> {
    return apiClient.get('/attendance/reports', { params }).then((r) => r.data)
  },
}
