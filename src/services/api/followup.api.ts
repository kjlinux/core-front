import apiClient from './client'
import type { PaginatedResponse } from '@/types'

export interface ClientFollowupCall {
  id: number
  company_id: string
  installation_sheet_id: string | null
  call_type: 'j2' | 'j7' | 'j30'
  scheduled_at: string
  called_at: string | null
  status: 'pending' | 'done' | 'skipped' | 'escalated'
  result: 'ok' | 'partial' | 'problem' | undefined
  usage_rate: number | undefined
  satisfaction_score: number | undefined
  notes: string | undefined
  actions: any[] | null
  assigned_to_user_id: number | null
  company?: { id: string; name: string; phone?: string }
  installationSheet?: any
}

export const followupApi = {
  list(params?: { status?: string; type?: string; overdue?: boolean }): Promise<PaginatedResponse<ClientFollowupCall>> {
    return apiClient.get('/followups', { params }).then((r) => r.data)
  },
  get(id: number | string): Promise<ClientFollowupCall> {
    return apiClient.get(`/followups/${id}`).then((r) => r.data)
  },
  update(id: number | string, payload: Partial<ClientFollowupCall>): Promise<ClientFollowupCall> {
    return apiClient.patch(`/followups/${id}`, payload).then((r) => r.data)
  },
  escalate(id: number | string): Promise<ClientFollowupCall> {
    return apiClient.post(`/followups/${id}/escalate`).then((r) => r.data)
  },
  dashboard(): Promise<{
    by_status: Record<string, number>
    missing_j2_overdue: number
    avg_usage_j7: number | null
    avg_satisfaction_j30: number | null
  }> {
    return apiClient.get('/followups/dashboard').then((r) => r.data)
  },
}
