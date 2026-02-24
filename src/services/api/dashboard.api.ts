import apiClient from './client'
import type { GlobalDashboardStats, TrendData } from '@/types'

export const dashboardApi = {
  getStats(): Promise<GlobalDashboardStats> {
    return apiClient.get('/dashboard/stats').then((r) => r.data?.data ?? r.data)
  },

  getTrends(period: string): Promise<TrendData[]> {
    return apiClient.get('/dashboard/trends', { params: { period } }).then((r) => r.data?.data ?? r.data)
  },
}
