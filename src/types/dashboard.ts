export interface GlobalDashboardStats {
  activeCompanies: number
  connectedDevices: number
  totalEmployees: number
  globalSatisfactionRate: number
  rfidCardsSold: number
  marketplaceRevenue: number
  technicalAlerts: number
}

export interface TrendData {
  label: string
  value: number
  previousValue: number
  changePercent: number
}

export interface ChartDataPoint {
  label: string
  value: number
}
