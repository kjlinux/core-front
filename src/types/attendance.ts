import type { AttendanceStatus } from './enums'

export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  date: string
  entryTime?: string
  exitTime?: string
  status: AttendanceStatus
  lateMinutes: number
  earlyDepartureMinutes: number
  source: 'rfid' | 'biometric'
  isDoubleBadge: boolean
  notes?: string
}

export interface AttendanceSummary {
  employeeId: string
  employeeName: string
  period: string
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  totalLateMinutes: number
  averageEntryTime: string
  averageExitTime: string
}

export interface AttendanceDailyReport {
  date: string
  departmentId: string
  departmentName: string
  totalEmployees: number
  present: number
  absent: number
  late: number
  records: AttendanceRecord[]
}
