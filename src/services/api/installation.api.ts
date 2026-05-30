import apiClient from './client'
import type { PaginatedResponse } from '@/types'

export const INSTALLATION_SOLUTIONS = [
  'presenseRH_rfid', 'presenseRH_fp', 'presenseRH_qr',
  'feelback',
] as const
export type InstallationSolution = (typeof INSTALLATION_SOLUTIONS)[number]

export const INSTALLATION_SOLUTION_LABELS: Record<InstallationSolution, string> = {
  presenseRH_rfid: 'PresenseRH - RFID',
  presenseRH_fp: 'PresenseRH - Empreinte',
  presenseRH_qr: 'PresenseRH - QR Code',
  feelback: 'Feelback',
}

export interface InstallationChecklistItem {
  key: string
  label: string
  done: boolean
}

/** Matériel tel que renvoyé par l'API (clés snake_case). */
export interface InstallationMaterial {
  solution: InstallationSolution
  serial_number: string
  quantity?: string | null
  firmware_version?: string | null
  wifi_ssid?: string | null
  static_ip?: string | null
  remote_access?: string | null
}

/** Matériel saisi dans le formulaire (clés camelCase, converties par l'intercepteur). */
export interface InstallationMaterialInput {
  solution: InstallationSolution | ''
  serialNumber: string
  quantity?: string
  firmwareVersion?: string
  wifiSsid?: string
  staticIp?: string
  remoteAccess?: string
}

export interface InstallationSheet {
  id: string
  company_id: string
  technician_user_id: number
  client_contact_name: string | null
  client_contact_role: string | null
  client_phone: string | null
  client_email: string | null
  site_address: string | null
  materials: InstallationMaterial[]
  checklist: InstallationChecklistItem[]
  training_rating: number | null
  observations: string | null
  installed_at: string
  client_signature_url: string | null
  technician_signature_url: string | null
  company?: { id: string; name: string }
  technician?: { id: number; name?: string; email?: string }
  followups?: {
    id: number
    call_type: 'j2' | 'j7' | 'j30'
    scheduled_at: string
    status: string
  }[]
}

export interface InstallationSheetPayload {
  companyId: string
  clientContactName?: string
  clientContactRole?: string
  clientPhone?: string
  clientEmail?: string
  siteAddress?: string
  materials: InstallationMaterialInput[]
  checklist: InstallationChecklistItem[]
  trainingRating?: number | null
  observations?: string
  clientSignatureBase64: string
  technicianSignatureBase64: string
  installedAt?: string
}

export const installationApi = {
  list(params?: { company_id?: string; page?: number }): Promise<PaginatedResponse<InstallationSheet>> {
    return apiClient.get('/installation-sheets', { params }).then((r) => r.data)
  },
  get(id: string): Promise<InstallationSheet> {
    return apiClient.get(`/installation-sheets/${id}`).then((r) => r.data)
  },
  pdf(id: string): Promise<Blob> {
    return apiClient.get(`/installation-sheets/${id}/pdf`, { responseType: 'blob' }).then((r) => r.data)
  },
  create(payload: InstallationSheetPayload): Promise<InstallationSheet> {
    return apiClient.post('/installation-sheets', payload).then((r) => r.data)
  },
}
