import type { AttendanceStatus } from './enums'
import type { ShiftKind } from './schedule'

// Evaluation d'un pointage attendu vs reel
export interface PunchEvaluation {
  expectedTime: string
  actualTime?: string // null => non pointe
  status: 'on_time' | 'late' | 'missing'
  lateMinutes: number
}

// Evaluation d'un segment (matin/soir/...)
export interface SegmentEvaluation {
  kind: ShiftKind
  startTime: string
  endTime: string
  punches: PunchEvaluation[]
  status: 'complete' | 'partial' | 'late' | 'absent' | 'on_leave' | 'not_scheduled'
}

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
  source: 'rfid' | 'biometric' | 'qrcode'
  isDoubleBadge: boolean
  notes?: string
  expectedShift?: ShiftKind | null // ce que l'employe devait faire ce jour
  segments?: SegmentEvaluation[] // detail par segment
  isOnLeave?: boolean // couvert par un conge approuve
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
