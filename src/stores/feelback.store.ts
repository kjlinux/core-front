import { ref } from 'vue'
import { defineStore } from 'pinia'
import { feelbackApi } from '@/services/api/feelback.api'
import type { FeelbackEntry, SatisfactionStats, FeelbackAlert } from '@/types'

export const useFeelbackStore = defineStore('feelback', () => {
  const entries = ref<FeelbackEntry[]>([])
  const stats = ref<SatisfactionStats | null>(null)
  const statsByAgency = ref<SatisfactionStats[]>([])
  const alerts = ref<FeelbackAlert[]>([])
  const isLoading = ref(false)

  async function fetchStats(params?: Record<string, unknown>) {
    isLoading.value = true
    try {
      const response = await feelbackApi.getStats(params)
      stats.value = response.data
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
      const response = await feelbackApi.getStatsByAgency(agencyId, params)
      statsByAgency.value = [response.data]
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAlerts() {
    isLoading.value = true
    try {
      const response = await feelbackApi.getAlerts()
      alerts.value = response.data
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

  return { entries, stats, statsByAgency, alerts, isLoading, fetchStats, fetchEntries, fetchStatsByAgency, fetchAlerts, updateAlertSettings }
})
