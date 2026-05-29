import apiClient from './client'

export interface SalesReportData {
  totalOrders: number
  totalRevenue: number
  averageBasket: number
  pendingOrders: number
  revenueByMonth: { month: string; revenue: number; orders: number }[]
  ordersByStatus: { name: string; value: number }[]
  topProducts: { name: string; value: number; quantity: number }[]
}

export interface SalesReportParams {
  start_date?: string
  end_date?: string
  company_id?: string
}

import { downloadServerCsv, downloadServerFile } from './report-export'

export const salesReportApi = {
  getReport(params?: SalesReportParams): Promise<SalesReportData> {
    return apiClient.get('/admin/reports/sales', { params }).then((r) => r.data)
  },

  downloadCsv(params: SalesReportParams): Promise<void> {
    return downloadServerCsv(
      '/admin/reports/sales/export.csv',
      params as Record<string, unknown>,
      `rapport-ventes_${params.start_date ?? 'tout'}_au_${params.end_date ?? 'tout'}.csv`,
    )
  },

  downloadPdf(params: SalesReportParams): Promise<void> {
    return downloadServerFile(
      '/admin/reports/sales/export.pdf',
      params as Record<string, unknown>,
      `rapport-ventes_${params.start_date ?? 'tout'}_au_${params.end_date ?? 'tout'}.pdf`,
      'application/pdf',
    )
  },
}
