import apiClient from './client'
import type { PaginatedResponse } from '@/types'

export type TicketStatus = 'open' | 'in_progress' | 'resolved'
export type TicketPriority = 'low' | 'medium' | 'high'

export interface ClientTicket {
  id: string
  subject: string
  message: string
  priority: TicketPriority
  status: TicketStatus
  support_notes: string | null
  created_at: string
  resolved_at: string | null
}

export interface SupportTicket {
  id: string
  subject: string
  message: string
  priority: TicketPriority
  status: TicketStatus
  supportNotes: string | null
  createdAt: string
  resolvedAt: string | null
  company: { id: string; name: string; phone: string | null; email: string | null } | null
  createdBy: { id: string; name: string; email: string; phone: string | null } | null
}

export const supportTicketApi = {
  // Client
  listMine(): Promise<ClientTicket[]> {
    return apiClient.get('/client/tickets').then((r) => r.data)
  },
  create(data: { subject: string; message: string; priority?: TicketPriority }): Promise<ClientTicket> {
    return apiClient.post('/client/tickets', data).then((r) => r.data)
  },

  // Support
  listAll(
    filter: {
      status?: TicketStatus
      priority?: TicketPriority
      companyId?: string
      search?: string
      page?: number
      perPage?: number
    } = {},
  ): Promise<PaginatedResponse<SupportTicket>> {
    return apiClient.get('/support/tickets', { params: filter }).then((r) => r.data)
  },
  update(id: string, data: { status?: TicketStatus; support_notes?: string }): Promise<ClientTicket> {
    return apiClient.patch(`/support/tickets/${id}`, data).then((r) => r.data)
  },
}
