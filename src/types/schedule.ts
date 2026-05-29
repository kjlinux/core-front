export type ShiftKind = 'morning' | 'evening' | 'full_day' | 'night'

// Un pointage attendu dans un segment
export interface ExpectedPunch {
  time: string // "07:00"
  label?: string // "Arrivee", "Controle mi-matinee"...
}

// Un segment de travail pour un jour donne
export interface ScheduleSegment {
  kind: ShiftKind
  startTime: string // "07:00"
  endTime: string // "12:00" (peut etre < start => franchit minuit pour 'night')
  expectedPunches: ExpectedPunch[] // heures cibles de pointage
  lateTolerance: number // minutes de tolerance par pointage (override du defaut)
}

// Config d'un jour de la semaine
export interface ScheduleDay {
  weekday: number // 1=lundi .. 7=dimanche
  worked: boolean
  segments: ScheduleSegment[] // 0..n (matin + soir = 2 segments)
}

// Le "template" reutilisable
export interface Schedule {
  id: string
  companyId: string
  name: string // "Horaire Jour", "Horaire Nuit", "Mi-temps matin"
  type: 'standard' | 'custom' | 'day' | 'night'
  defaultLateTolerance: number
  days: ScheduleDay[] // 7 entrees
  assignedDepartments: string[] // affectation par defaut (retro-compat)
  createdAt: string
}

export interface Holiday {
  id: string
  companyId: string
  name: string
  date: string
  isRecurring: boolean
}
