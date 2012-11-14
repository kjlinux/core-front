import apiClient from './client'
import type { ApiResponse, GlobalDashboardStats, TrendData } from '@/types'

export const dashboardApi = {
  getStats(): Promise<ApiResponse<GlobalDashboardStats>> {
    return apiClient.get('/dashboard/stats').then((r) => r.data)
  },

  getTrends(period: string): Promise<ApiResponse<TrendData[]>> {
    return apiClient.get('/dashboard/trends', { params: { period } }).then((r) => r.data)
  },
}
