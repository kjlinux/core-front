export type AbsenceStatus = 'pending' | 'approved' | 'rejected'

export interface AbsenceRequest {
  id: string
  employeeId: string
  employeeName: string
  companyId: string
  dateStart: string
  dateEnd: string
  reason: string
  justificatifUrl: string | null
  status: AbsenceStatus
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
}

export interface AbsenceRequestFilters {
  companyId?: string
  employeeId?: string
  status?: AbsenceStatus
  dateStart?: string
  dateEnd?: string
  page?: number
  perPage?: number
}

export interface CreateAbsencePayload {
  employeeId: string
  dateStart: string
  dateEnd: string
  reason: string
  justificatif?: File | null
}

export interface ReviewAbsencePayload {
  status: 'approved' | 'rejected'
  reviewNote?: string
}

export interface UpdateAbsencePayload {
  dateStart?: string
  dateEnd?: string
  reason?: string
}
