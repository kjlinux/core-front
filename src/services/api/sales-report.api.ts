import apiClient from './client'

export interface SalesReportData {
  totalOrders: number
  totalRevenue: number
  averageBasket: number
  pendingOrders: number
  revenueByMonth: { month: string; revenue: number; orders: number }[]
  ordersByStatus: { name: string; value: number }[]
  topProducts: { name: string; value: number }[]
}

export interface SalesReportParams {
  start_date?: string
  end_date?: string
}

export const salesReportApi = {
  getReport(params?: SalesReportParams): Promise<SalesReportData> {
    return apiClient.get('/admin/reports/sales', { params }).then((r) => r.data)
  },
}
