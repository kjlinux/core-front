import apiClient from './client'
import type { RfidCard, CardHistoryEntry } from '@/types'

export const cardApi = {
  getAll(params?: Record<string, unknown>): Promise<RfidCard[]> {
    return apiClient.get('/cards', { params }).then((r) => r.data?.data ?? r.data)
  },

  getById(id: string): Promise<RfidCard> {
    return apiClient.get(`/cards/${id}`).then((r) => r.data?.data ?? r.data)
  },

  register(data: Partial<RfidCard>): Promise<RfidCard> {
    return apiClient.post('/cards', data).then((r) => r.data?.data ?? r.data)
  },

  assign(cardId: string, employeeId: string): Promise<RfidCard> {
    return apiClient.patch(`/cards/${cardId}/assign`, { employeeId }).then((r) => r.data?.data ?? r.data)
  },

  unassign(cardId: string): Promise<RfidCard> {
    return apiClient.patch(`/cards/${cardId}/unassign`).then((r) => r.data?.data ?? r.data)
  },

  block(cardId: string, reason?: string): Promise<RfidCard> {
    return apiClient.patch(`/cards/${cardId}/block`, { reason }).then((r) => r.data?.data ?? r.data)
  },

  unblock(cardId: string): Promise<RfidCard> {
    return apiClient.patch(`/cards/${cardId}/unblock`).then((r) => r.data?.data ?? r.data)
  },

  getHistory(cardId: string, params?: Record<string, unknown>): Promise<CardHistoryEntry[]> {
    return apiClient.get(`/cards/${cardId}/history`, { params }).then((r) => r.data?.data ?? r.data)
  },
}
