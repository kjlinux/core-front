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

export interface FeelbackReportDepartmentRow {
  departmentId: string
  department: string
  site: string
  totalResponses: number
  bon: number
  neutre: number
  mauvais: number
  satisfactionRate: number
}

export interface FeelbackReportPeriodRow {
  period: string
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
  byDepartment: FeelbackReportDepartmentRow[]
  byPeriod: FeelbackReportPeriodRow[]
}

export interface FeelbackReportParams {
  start_date?: string
  end_date?: string
  company_id?: string
  site_id?: string
  department_id?: string
  type?: string
  period_granularity?: 'day' | 'week' | 'month'
}

export const feelbackReportApi = {
  getReport(params?: FeelbackReportParams): Promise<FeelbackReportData> {
    return apiClient.get('/feelback/reports', { params }).then((r) => r.data)
  },
}
