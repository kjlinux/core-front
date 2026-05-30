import apiClient from './client'
import type {
  PaginatedResponse,
  Schedule,
  Holiday,
} from '@/types'

export interface ScheduleFilters {
  companyId?: string
  search?: string
  page?: number
  perPage?: number
}

export interface HolidayFilters {
  year?: number | string
  search?: string
  page?: number
  perPage?: number
}

function toSnakeScheduleFilters(params?: ScheduleFilters): Record<string, unknown> | undefined {
  if (!params) return undefined
  const result: Record<string, unknown> = {}
  if (params.companyId !== undefined) result.company_id = params.companyId
  if (params.search !== undefined) result.search = params.search
  if (params.page !== undefined) result.page = params.page
  if (params.perPage !== undefined) result.per_page = params.perPage
  return result
}

function toSnakeHolidayFilters(params?: HolidayFilters): Record<string, unknown> | undefined {
  if (!params) return undefined
  const result: Record<string, unknown> = {}
  if (params.year !== undefined) result.year = params.year
  if (params.search !== undefined) result.search = params.search
  if (params.page !== undefined) result.page = params.page
  if (params.perPage !== undefined) result.per_page = params.perPage
  return result
}

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
  getAll(params?: ScheduleFilters): Promise<PaginatedResponse<Schedule>> {
    return apiClient.get('/schedules', { params: toSnakeScheduleFilters(params) }).then((r) => r.data)
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

  getHolidays(params?: HolidayFilters): Promise<PaginatedResponse<Holiday>> {
    return apiClient.get('/holidays', { params: toSnakeHolidayFilters(params) }).then((r) => r.data)
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
