import apiClient from './client'
import type { RfidCard, CardHistoryEntry, PaginatedResponse } from '@/types'

export interface CardFilters {
  companyId?: string
  status?: string
  search?: string
  page?: number
  perPage?: number
}

function toSnakeFilters(params?: CardFilters): Record<string, unknown> | undefined {
  if (!params) return undefined
  const result: Record<string, unknown> = {}
  if (params.companyId !== undefined) result.company_id = params.companyId
  if (params.status !== undefined) result.status = params.status
  if (params.search !== undefined) result.search = params.search
  if (params.page !== undefined) result.page = params.page
  if (params.perPage !== undefined) result.per_page = params.perPage
  return result
}

export const cardApi = {
  getAll(params?: CardFilters): Promise<PaginatedResponse<RfidCard>> {
    return apiClient.get('/cards', { params: toSnakeFilters(params) }).then((r) => r.data)
  },

  getById(id: string): Promise<RfidCard> {
    return apiClient.get(`/cards/${id}`).then((r) => r.data)
  },

  register(data: Partial<RfidCard>): Promise<RfidCard> {
    return apiClient.post('/cards', data).then((r) => r.data)
  },

  assign(cardId: string, employeeId: string): Promise<RfidCard> {
    return apiClient.patch(`/cards/${cardId}/assign`, { employeeId }).then((r) => r.data)
  },

  unassign(cardId: string): Promise<RfidCard> {
    return apiClient.patch(`/cards/${cardId}/unassign`).then((r) => r.data)
  },

  block(cardId: string, reason?: string): Promise<RfidCard> {
    return apiClient.patch(`/cards/${cardId}/block`, { blockReason: reason }).then((r) => r.data)
  },

  unblock(cardId: string): Promise<RfidCard> {
    return apiClient.patch(`/cards/${cardId}/unblock`).then((r) => r.data)
  },

  getHistory(cardId: string, params?: Record<string, unknown>): Promise<CardHistoryEntry[]> {
    return apiClient.get(`/cards/${cardId}/history`, { params }).then((r) => r.data)
  },
}
