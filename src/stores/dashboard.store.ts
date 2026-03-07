import { ref } from 'vue'
import { defineStore } from 'pinia'
import { dashboardApi } from '@/services/api/dashboard.api'
import type { GlobalDashboardStats, TrendData, DashboardCharts } from '@/types'

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref<GlobalDashboardStats | null>(null)
  const trends = ref<TrendData[]>([])
  const charts = ref<DashboardCharts | null>(null)
  const isLoading = ref(false)
  const chartsLoading = ref(false)

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

  async function fetchCharts() {
    chartsLoading.value = true
    try {
      charts.value = await dashboardApi.getCharts()
    } finally {
      chartsLoading.value = false
    }
  }

  return { stats, trends, charts, isLoading, chartsLoading, fetchStats, fetchTrends, fetchCharts }
})
