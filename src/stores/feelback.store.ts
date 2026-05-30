import { ref } from 'vue'
import { defineStore } from 'pinia'
import { feelbackApi, type FeelbackAlertFilters } from '@/services/api/feelback.api'
import type { FeelbackEntry, SatisfactionStats, FeelbackAlert } from '@/types'

export const useFeelbackStore = defineStore('feelback', () => {
  const entries = ref<FeelbackEntry[]>([])
  const stats = ref<SatisfactionStats | null>(null)
  const statsByAgency = ref<SatisfactionStats[]>([])
  const alerts = ref<FeelbackAlert[]>([])
  const alertFilters = ref<FeelbackAlertFilters>({
    page: 1,
    perPage: 15,
  })
  const alertsPagination = ref({
    currentPage: 1,
    perPage: 15,
    total: 0,
    totalPages: 0,
  })
  const isLoading = ref(false)

  async function fetchStats(params?: Record<string, unknown>) {
    isLoading.value = true
    try {
      stats.value = await feelbackApi.getStats(params)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchEntries(params?: Record<string, unknown>) {
    isLoading.value = true
    try {
      const response = await feelbackApi.getEntries(params)
      entries.value = response.data
    } finally {
      isLoading.value = false
    }
  }

  async function fetchStatsByAgency(agencyId: string, params?: Record<string, unknown>) {
    isLoading.value = true
    try {
      const result = await feelbackApi.getStatsByAgency(agencyId, params)
      statsByAgency.value = [result]
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAlerts(newFilters?: Partial<FeelbackAlertFilters>) {
    if (newFilters) {
      alertFilters.value = { page: 1, perPage: alertFilters.value.perPage, ...newFilters }
    }
    isLoading.value = true
    try {
      const response = await feelbackApi.getAlerts(alertFilters.value)
      alerts.value = response.data
      alertsPagination.value = response.meta
    } finally {
      isLoading.value = false
    }
  }

  const comparison = ref<SatisfactionStats[]>([])

  async function fetchComparison(params?: Record<string, unknown>) {
    isLoading.value = true
    try {
      comparison.value = await feelbackApi.getComparison(params)
    } finally {
      isLoading.value = false
    }
  }

  async function updateAlertSettings(settings: Record<string, unknown>) {
    isLoading.value = true
    try {
      await feelbackApi.updateAlertSettings(settings)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Appelé par useRealtimeSubscriptions - met à jour le state sans s'abonner à Echo.
   */
  function handleRealtimeFeedback(_data: {
    id?: string
    deviceId?: string
    level: string
    siteName: string
    timestamp?: string
  }) {
    fetchEntries()
  }

  return {
    entries,
    stats,
    statsByAgency,
    comparison,
    alerts,
    alertFilters,
    alertsPagination,
    isLoading,
    fetchStats,
    fetchEntries,
    fetchStatsByAgency,
    fetchComparison,
    fetchAlerts,
    updateAlertSettings,
    handleRealtimeFeedback,
  }
})
