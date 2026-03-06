import apiClient from './client'

export interface FeelbackReportSiteRow {
  siteId: string
  site: string
  totalResponses: number
  bon: number
  neutre: number
  mauvais: number
  satisfactionRate: number
}

export interface FeelbackReportAgentRow {
  agentId: string
  agent: string
  site: string
  totalResponses: number
  bon: number
  neutre: number
  mauvais: number
  satisfactionRate: number
}

export interface FeelbackReportData {
  totalResponses: number
  bonRate: number
  neutreRate: number
  mauvaisRate: number
  bySite: FeelbackReportSiteRow[]
  byAgent: FeelbackReportAgentRow[]
}

export interface FeelbackReportParams {
  start_date?: string
  end_date?: string
  site_id?: string
  type?: string
}

export const feelbackReportApi = {
  getReport(params?: FeelbackReportParams): Promise<FeelbackReportData> {
    return apiClient.get('/feelback/reports', { params }).then((r) => r.data)
  },
}
