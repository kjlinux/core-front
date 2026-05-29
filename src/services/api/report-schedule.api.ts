import apiClient from './client'

export type ReportScheduleType = 'attendance' | 'feelback' | 'sales'
export type ReportScheduleFormat = 'pdf' | 'csv'
export type ReportScheduleFrequency = 'daily' | 'weekly' | 'monthly'

export interface ReportSchedule {
  id: string
  user_id: number
  company_id: string | null
  report_type: ReportScheduleType
  format: ReportScheduleFormat
  frequency: ReportScheduleFrequency
  filters: Record<string, unknown> | null
  recipients: string[]
  is_active: boolean
  last_sent_at: string | null
  next_run_at: string | null
  created_at: string
  user?: { id: number; first_name: string; last_name: string }
  company?: { id: string; name: string }
}

export interface ReportSchedulePayload {
  report_type: ReportScheduleType
  format?: ReportScheduleFormat
  frequency: ReportScheduleFrequency
  filters?: Record<string, unknown> | null
  recipients: string[]
  company_id?: string | null
  is_active?: boolean
}

export const reportScheduleApi = {
  list(): Promise<ReportSchedule[]> {
    return apiClient.get('/reports/schedules').then((r) => r.data)
  },

  create(payload: ReportSchedulePayload): Promise<ReportSchedule> {
    return apiClient.post('/reports/schedules', payload).then((r) => r.data)
  },

  update(id: string, payload: Partial<ReportSchedulePayload>): Promise<ReportSchedule> {
    return apiClient.patch(`/reports/schedules/${id}`, payload).then((r) => r.data)
  },

  remove(id: string): Promise<void> {
    return apiClient.delete(`/reports/schedules/${id}`).then(() => undefined)
  },
}
