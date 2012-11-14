import { ref } from 'vue'
import { defineStore } from 'pinia'
import { dashboardApi } from '@/services/api/dashboard.api'
import type { GlobalDashboardStats, TrendData } from '@/types'

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref<GlobalDashboardStats | null>(null)
  const trends = ref<TrendData[]>([])
  const isLoading = ref(false)

  async function fetchStats() {
    isLoading.value = true
    try {
      stats.value = await dashboardApi.getStats()
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTrends(period: string) {
    isLoading.value = true
    try {
      trends.value = await dashboardApi.getTrends(period)
    } finally {
      isLoading.value = false
    }
  }

  return { stats, trends, isLoading, fetchStats, fetchTrends }
})
