export interface Schedule {
  id: string
  companyId: string
  name: string
  type: 'standard' | 'custom'
  startTime: string
  endTime: string
  breakStart?: string
  breakEnd?: string
  workDays: number[]
  lateTolerance: number
  assignedDepartments: string[]
  createdAt: string
}

export interface Holiday {
  id: string
  companyId: string
  name: string
  date: string
  isRecurring: boolean
}
