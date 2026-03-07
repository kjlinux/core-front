export interface GlobalDashboardStats {
  // Super admin
  activeCompanies: number
  rfidCardsSold: number
  marketplaceRevenue: number
  // Commun
  connectedDevices: number
  totalEmployees: number
  globalSatisfactionRate: number
  technicalAlerts: number
  // Enterprise/Manager
  presentToday: number
  absentToday: number
  lateToday: number
  attendanceRate: number
  pendingOrders: number
  totalOrders: number
  biometricEnrolled: number
  activeCards: number
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

export interface DashboardCharts {
  attendanceTrend: ChartDataPoint[]
  satisfactionTrend: ChartDataPoint[]
  attendanceByDepartment: ChartDataPoint[]
  // Super admin only
  companiesByModule: ChartDataPoint[]
  revenueMonthly: ChartDataPoint[]
}
