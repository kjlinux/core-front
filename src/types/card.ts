import type { CardStatus } from './enums'

export interface RfidCard {
  id: string
  uid: string
  employeeId?: string
  employeeName?: string
  companyId: string
  status: CardStatus
  assignedAt?: string
  blockedAt?: string
  blockReason?: string
  createdAt: string
}

export interface CardHistoryEntry {
  id: string
  cardId: string
  action: 'assigned' | 'unassigned' | 'activated' | 'deactivated' | 'blocked'
  performedBy: string
  timestamp: string
  details?: string
}
