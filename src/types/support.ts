export type DeviceKind = 'rfid' | 'biometric' | 'feelback' | 'qr'

export interface SupportDevice {
  id: string
  kind: DeviceKind
  name: string
  serialNumber: string | null
  companyId: string | null
  siteId: string | null
  siteName: string | null
  isOnline: boolean
  isWitness: boolean
  lastSeenAt: string | null
  firmwareVersion: string | null
}

export interface DevicesOverview {
  rfid: { total: number; online: number }
  biometric: { total: number; online: number }
  feelback: { total: number; online: number }
  alerts: { open: number; critical: number }
}

export type HealthStatus = 'ok' | 'degraded' | 'fail'
export type OverallHealth = 'healthy' | 'degraded' | 'unhealthy'

export interface HealthComponent {
  status: HealthStatus
  message?: string
  latencyMs?: number
  size?: number
  driver?: string
  ageSeconds?: number
  lastHeartbeatAt?: string
}

export interface SystemHealth {
  status: OverallHealth
  components: {
    db: HealthComponent
    cache: HealthComponent
    queue: HealthComponent
    mqtt: HealthComponent
    reverb: HealthComponent
    listeners: {
      rfid: HealthComponent
      biometric: HealthComponent
      feelback: HealthComponent
    }
  }
  devices: {
    rfid: { total: number; online: number }
    biometric: { total: number; online: number }
    feelback: { total: number; online: number }
  }
  timestamp: string
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'
export type AlertStatus = 'open' | 'acknowledged' | 'resolved'

export interface DeviceAlert {
  id: string
  company_id: string | null
  site_id: string | null
  device_id: string | null
  device_kind: string
  type: string
  severity: AlertSeverity
  title: string
  message: string | null
  context: Record<string, unknown> | null
  status: AlertStatus
  acknowledged_by: string | null
  acknowledged_at: string | null
  resolved_at: string | null
  notified_at: string | null
  created_at: string
  updated_at: string
}
