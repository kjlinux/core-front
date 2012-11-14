import type { SatisfactionLevel } from './enums'

export interface FeelbackDevice {
  id: string
  serialNumber: string
  companyId: string
  siteId: string
  siteName: string
  isOnline: boolean
  batteryLevel: number
  lastPingAt: string
  assignedAgent?: string
}

export interface FeelbackEntry {
  id: string
  deviceId: string
  level: SatisfactionLevel
  timestamp: string
  siteId: string
  siteName: string
  agentId?: string
  agentName?: string
}

export interface SatisfactionStats {
  period: string
  siteId?: string
  siteName?: string
  totalResponses: number
  bon: number
  neutre: number
  mauvais: number
  satisfactionRate: number
}

export interface FeelbackAlert {
  id: string
  deviceId: string
  siteId: string
  siteName: string
  type: 'threshold_exceeded' | 'device_offline' | 'low_battery'
  message: string
  threshold?: number
  currentValue?: number
  isRead: boolean
  createdAt: string
}
