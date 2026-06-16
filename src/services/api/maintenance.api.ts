import apiClient from './client'
import type { PaginatedResponse } from '@/types'

/** Catalogue des solutions, identique à la fiche d'installation. */
export const MAINTENANCE_SOLUTIONS = [
  'presenseRH_rfid', 'presenseRH_fp', 'presenseRH_qr',
  'feelback',
] as const
export type MaintenanceSolution = (typeof MAINTENANCE_SOLUTIONS)[number]

export const MAINTENANCE_SOLUTION_LABELS: Record<MaintenanceSolution, string> = {
  presenseRH_rfid: 'PresenseRH - RFID',
  presenseRH_fp: 'PresenseRH - Empreinte',
  presenseRH_qr: 'PresenseRH - QR Code',
  feelback: 'Feelback',
}

export const MAINTENANCE_TYPES = ['preventive', 'corrective', 'emergency'] as const
export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number]

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  preventive: 'Maintenance préventive',
  corrective: 'Maintenance corrective',
  emergency: "Intervention d'urgence",
}

export const EQUIPMENT_STATUSES = ['operational', 'repaired', 'replaced', 'to_monitor', 'out_of_service'] as const
export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number]

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  operational: 'Opérationnel',
  repaired: 'Réparé',
  replaced: 'Remplacé',
  to_monitor: 'À surveiller',
  out_of_service: 'Hors service',
}

export interface MaintenanceChecklistItem {
  key: string
  label: string
  done: boolean
}

/** Équipement tel que renvoyé par l'API (clés snake_case). */
export interface MaintenanceEquipment {
  solution: MaintenanceSolution
  serial_number: string
  operation?: string | null
  status: EquipmentStatus
}

/** Équipement saisi dans le formulaire (clés camelCase, converties par l'intercepteur). */
export interface MaintenanceEquipmentInput {
  solution: MaintenanceSolution | ''
  serialNumber: string
  operation?: string
  status: EquipmentStatus
}

export interface MaintenanceSheet {
  id: string
  company_id: string
  installation_sheet_id: string | null
  technician_user_id: number
  client_contact_name: string | null
  client_contact_role: string | null
  client_phone: string | null
  client_email: string | null
  site_address: string | null
  maintenance_type: MaintenanceType
  reported_issue: string | null
  equipments: MaintenanceEquipment[]
  checklist: MaintenanceChecklistItem[]
  resolved: boolean
  duration_minutes: number | null
  satisfaction_rating: number | null
  next_maintenance_at: string | null
  observations: string | null
  maintained_at: string
  client_signature_url: string | null
  technician_signature_url: string | null
  company?: { id: string; name: string }
  technician?: { id: number; name?: string; email?: string }
  installation_sheet?: { id: string; installed_at: string } | null
}

export interface MaintenanceSheetPayload {
  companyId: string
  installationSheetId?: string
  clientContactName?: string
  clientContactRole?: string
  clientPhone?: string
  clientEmail?: string
  siteAddress?: string
  maintenanceType: MaintenanceType
  reportedIssue?: string
  equipments: MaintenanceEquipmentInput[]
  checklist: MaintenanceChecklistItem[]
  resolved: boolean
  durationMinutes?: number | null
  satisfactionRating?: number | null
  nextMaintenanceAt?: string
  observations?: string
  clientSignatureBase64: string
  technicianSignatureBase64: string
  maintainedAt?: string
}

export const maintenanceApi = {
  list(params?: { company_id?: string; page?: number }): Promise<PaginatedResponse<MaintenanceSheet>> {
    return apiClient.get('/maintenance-sheets', { params }).then((r) => r.data)
  },
  get(id: string): Promise<MaintenanceSheet> {
    return apiClient.get(`/maintenance-sheets/${id}`).then((r) => r.data)
  },
  pdf(id: string): Promise<Blob> {
    return apiClient.get(`/maintenance-sheets/${id}/pdf`, { responseType: 'blob' }).then((r) => r.data)
  },
  create(payload: MaintenanceSheetPayload): Promise<MaintenanceSheet> {
    return apiClient.post('/maintenance-sheets', payload).then((r) => r.data)
  },
}
