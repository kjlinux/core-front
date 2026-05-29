import client from './client'
import type { AbsenceRequest, AbsenceRequestFilters, CreateAbsencePayload, ReviewAbsencePayload, UpdateAbsencePayload } from '@/types/absence'
import type { PaginatedResponse } from '@/types/common'

export const absenceApi = {
  getAll(params?: AbsenceRequestFilters): Promise<PaginatedResponse<AbsenceRequest>> {
    const p: Record<string, unknown> = {}
    if (params?.companyId) p.company_id = params.companyId
    if (params?.employeeId) p.employee_id = params.employeeId
    if (params?.status) p.status = params.status
    if (params?.dateStart) p.date_start = params.dateStart
    if (params?.dateEnd) p.date_end = params.dateEnd
    if (params?.page) p.page = params.page
    if (params?.perPage) p.per_page = params.perPage
    return client.get('/absence-requests', { params: p })
  },

  getById(id: string): Promise<AbsenceRequest> {
    return client.get(`/absence-requests/${id}`)
  },

  getMyRequests(employeeId: string): Promise<AbsenceRequest[]> {
    return client.get('/absence-requests/my', { params: { employee_id: employeeId } })
  },

  create(data: CreateAbsencePayload): Promise<AbsenceRequest> {
    const form = new FormData()
    form.append('employee_id', data.employeeId)
    form.append('date_start', data.dateStart)
    form.append('date_end', data.dateEnd)
    form.append('reason', data.reason)
    if (data.justificatif) {
      form.append('justificatif', data.justificatif)
    }
    return client.post('/absence-requests', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  update(id: string, data: UpdateAbsencePayload): Promise<AbsenceRequest> {
    const p: Record<string, unknown> = {}
    if (data.dateStart !== undefined) p.date_start = data.dateStart
    if (data.dateEnd !== undefined) p.date_end = data.dateEnd
    if (data.reason !== undefined) p.reason = data.reason
    return client.put(`/absence-requests/${id}`, p)
  },

  review(id: string, data: ReviewAbsencePayload): Promise<AbsenceRequest> {
    return client.patch(`/absence-requests/${id}/review`, {
      status: data.status,
      review_note: data.reviewNote,
    })
  },

  delete(id: string): Promise<void> {
    return client.delete(`/absence-requests/${id}`)
  },
}
