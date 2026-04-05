import apiClient from './client'
import type { PaginatedResponse } from '@/types'

export interface TechnicienActivity {
  id: string
  action: string
  resourceType: string
  resourceId: string | null
  resourceLabel: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  technicien?: {
    id: string
    fullName: string
    email: string
  }
  company?: {
    id: string
    name: string
  }
}

export interface TechnicienActivityFilters {
  company_id?: string
  technicien_id?: string
  resource_type?: string
  date_from?: string
  date_to?: string
  per_page?: number
  page?: number
}

export interface TechnicienSummaryEntry {
  technicien: {
    id: string
    fullName: string
    email: string
  }
  totalActions: number
  lastActivity: string | null
  breakdown: Array<{
    resourceType: string
    action: string
    count: number
  }>
}

export interface TechnicienCompanyEntry {
  company: {
    id: string
    name: string
  }
  totalActions: number
  lastActivity: string | null
}

export const technicienActivityApi = {
  getActivities(params?: TechnicienActivityFilters): Promise<PaginatedResponse<TechnicienActivity>> {
    return apiClient.get('/technicien/activities', { params }).then((r) => r.data)
  },

  getSummaryByCompany(companyId: string): Promise<TechnicienSummaryEntry[]> {
    return apiClient
      .get('/technicien/activities/summary-by-company', { params: { company_id: companyId } })
      .then((r) => r.data)
  },

  getCompaniesByTechnicien(technicienId: string): Promise<TechnicienCompanyEntry[]> {
    return apiClient.get(`/technicien/${technicienId}/companies`).then((r) => r.data)
  },
}
