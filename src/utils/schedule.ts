import type {
  Schedule,
  ScheduleDay,
  ScheduleSegment,
  ShiftKind,
} from '@/types/schedule'
import type { Employee } from '@/types/employee'

// Type des donnees legacy (ancien modele plat) pouvant arriver de l'API/mock
interface LegacySchedule {
  startTime?: string
  endTime?: string
  breakStart?: string
  breakEnd?: string
  workDays?: number[]
  lateTolerance?: number
}

const ALL_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7]

function emptyDays(): ScheduleDay[] {
  return ALL_WEEKDAYS.map((weekday) => ({ weekday, worked: false, segments: [] }))
}

// Determine le type de shift a partir d'une plage horaire
function inferShiftKind(startTime: string, endTime: string): ShiftKind {
  const start = parseInt(startTime.slice(0, 2), 10) || 0
  const end = parseInt(endTime.slice(0, 2), 10) || 0
  // Plage qui franchit minuit => nuit
  if (endTime < startTime) return 'night'
  if (start < 12 && end <= 13) return 'morning'
  if (start >= 12) return 'evening'
  return 'full_day'
}

// Normalise un Schedule potentiellement legacy vers le nouveau modele
export function normalizeSchedule(raw: Partial<Schedule> & LegacySchedule): Schedule {
  const base: Schedule = {
    id: raw.id ?? '',
    companyId: raw.companyId ?? '',
    name: raw.name ?? '',
    type: raw.type ?? 'standard',
    defaultLateTolerance: raw.defaultLateTolerance ?? raw.lateTolerance ?? 0,
    days: Array.isArray(raw.days) && raw.days.length ? raw.days : emptyDays(),
    assignedDepartments: raw.assignedDepartments ?? [],
    createdAt: raw.createdAt ?? '',
  }

  // Si pas de days mais des champs legacy, on derive
  const hasNewDays = Array.isArray(raw.days) && raw.days.length > 0
  if (!hasNewDays && raw.startTime && raw.endTime) {
    const tolerance = raw.lateTolerance ?? 0
    const kind = inferShiftKind(raw.startTime, raw.endTime)
    const segment: ScheduleSegment = {
      kind,
      startTime: raw.startTime,
      endTime: raw.endTime,
      expectedPunches: [{ time: raw.startTime, label: 'Arrivee' }],
      lateTolerance: tolerance,
    }
    const workDays = raw.workDays ?? []
    base.days = ALL_WEEKDAYS.map((weekday) => ({
      weekday,
      worked: workDays.includes(weekday),
      segments: workDays.includes(weekday) ? [structuredClone(segment)] : [],
    }))
  }

  return base
}

// Resout l'horaire d'un employe: scheduleId prioritaire, sinon via departement
export function resolveEmployeeSchedule(
  employee: Pick<Employee, 'scheduleId' | 'departmentId'>,
  schedules: Schedule[],
): Schedule | null {
  if (employee.scheduleId) {
    const direct = schedules.find((s) => s.id === employee.scheduleId)
    if (direct) return direct
  }
  return (
    schedules.find((s) => s.assignedDepartments.includes(employee.departmentId)) ?? null
  )
}

const SHIFT_LABELS: Record<ShiftKind, string> = {
  morning: 'Matin',
  evening: 'Soir',
  full_day: 'Journee',
  night: 'Nuit',
}

export function shiftKindLabel(kind: ShiftKind): string {
  return SHIFT_LABELS[kind] ?? kind
}

const SEGMENT_STATUS_LABELS: Record<string, string> = {
  complete: 'Present',
  partial: 'Partiel',
  late: 'En retard',
  absent: 'Absent',
  on_leave: 'Conge',
  not_scheduled: 'Non programme',
}

export function segmentStatusLabel(status: string): string {
  return SEGMENT_STATUS_LABELS[status] ?? status
}

// Nombre de jours travailles dans un horaire
export function countWorkedDays(schedule: Schedule): number {
  return schedule.days.filter((d) => d.worked && d.segments.length > 0).length
}
