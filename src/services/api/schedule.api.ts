import apiClient from './client'
import type {
  PaginatedResponse,
  Schedule,
  Holiday,
  PaginationParams,
} from '@/types'

function toSnakePayload(data: Partial<Schedule>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (data.companyId !== undefined) out.company_id = data.companyId
  if (data.name !== undefined) out.name = data.name
  if (data.type !== undefined) out.type = data.type
  if (data.defaultLateTolerance !== undefined) out.default_late_tolerance = data.defaultLateTolerance
  if (data.days !== undefined) out.days = data.days
  if (data.assignedDepartments !== undefined) out.assigned_departments = data.assignedDepartments
  return out
}

export const scheduleApi = {
  getAll(params?: PaginationParams): Promise<PaginatedResponse<Schedule>> {
    return apiClient.get('/schedules', { params }).then((r) => r.data)
  },

  getById(id: string): Promise<Schedule> {
    return apiClient.get(`/schedules/${id}`).then((r) => r.data)
  },

  create(data: Partial<Schedule>): Promise<Schedule> {
    return apiClient.post('/schedules', toSnakePayload(data)).then((r) => r.data)
  },

  update(id: string, data: Partial<Schedule>): Promise<Schedule> {
    return apiClient.put(`/schedules/${id}`, toSnakePayload(data)).then((r) => r.data)
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`/schedules/${id}`).then((r) => r.data)
  },

  getHolidays(params?: PaginationParams): Promise<PaginatedResponse<Holiday>> {
    return apiClient.get('/holidays', { params }).then((r) => r.data)
  },

  createHoliday(data: Partial<Holiday>): Promise<Holiday> {
    return apiClient.post('/holidays', data).then((r) => r.data)
  },

  updateHoliday(id: string, data: Partial<Holiday>): Promise<Holiday> {
    return apiClient.put(`/holidays/${id}`, data).then((r) => r.data)
  },

  deleteHoliday(id: string): Promise<void> {
    return apiClient.delete(`/holidays/${id}`).then((r) => r.data)
  },
}
