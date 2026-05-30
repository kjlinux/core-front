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
  rate: number
  /** Jours de congé approuvés sur la période (additif, backend récent). */
  leave?: number
  /** Jours ouvrés attendus servant de dénominateur au taux (additif). */
  expected?: number
  [key: string]: unknown
}

export interface AttendanceReportData {
  totalEmployees: number
  totalPresent: number
  totalAbsent: number
  totalLate: number
  /** Total des jours de congé approuvés (additif, backend récent). */
  totalLeave?: number
  /** Taux de présence global = présents+retards / jours ouvrés (additif). */
  globalRate?: number
  rows: AttendanceReportRow[]
}

export interface AttendanceReportParams {
  start_date: string
  end_date: string
  type?: 'daily' | 'monthly' | 'late' | 'absence'
  company_id?: string
  site_id?: string
  department_id?: string
  /** Filtre par canal de pointage. Le backend accepte rfid|qrcode|biometric|manual. */
  source?: 'rfid' | 'qrcode' | 'biometric' | 'manual'
  [key: string]: unknown
}

import { downloadServerCsv, downloadServerFile } from './report-export'

export const attendanceReportApi = {
  getReport(params: AttendanceReportParams): Promise<AttendanceReportData> {
    return apiClient.get('/attendance/reports', { params }).then((r) => r.data)
  },

  downloadCsv(params: AttendanceReportParams): Promise<void> {
    return downloadServerCsv(
      '/attendance/reports/export.csv',
      params,
      `rapport-presence_${params.start_date}_au_${params.end_date}.csv`,
    )
  },

  downloadPdf(params: AttendanceReportParams): Promise<void> {
    return downloadServerFile(
      '/attendance/reports/export.pdf',
      params,
      `rapport-presence_${params.start_date}_au_${params.end_date}.pdf`,
      'application/pdf',
    )
  },
}
