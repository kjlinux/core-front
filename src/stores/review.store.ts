import { ref } from 'vue'
import { defineStore } from 'pinia'
import { reviewApi } from '@/services/api/review.api'
import type { SaveReviewConfigPayload } from '@/services/api/review.api'
import type { ReviewConfig, ReviewStats, SubmissionListItem } from '@/types/review'

export const useReviewStore = defineStore('review', () => {
  const config = ref<ReviewConfig | null>(null)
  const stats = ref<ReviewStats | null>(null)
  const submissions = ref<SubmissionListItem[]>([])
  const isLoading = ref(false)
  const isLoadingStats = ref(false)

  async function fetchConfig() {
    isLoading.value = true
    try {
      config.value = await reviewApi.getConfig()
    } finally {
      isLoading.value = false
    }
  }

  async function saveConfig(data: SaveReviewConfigPayload) {
    isLoading.value = true
    try {
      config.value = await reviewApi.saveConfig(data)
    } finally {
      isLoading.value = false
    }
  }

  async function regenerateToken() {
    isLoading.value = true
    try {
      config.value = await reviewApi.regenerateToken()
    } finally {
      isLoading.value = false
    }
  }

  async function fetchStats() {
    isLoadingStats.value = true
    try {
      stats.value = await reviewApi.getStats()
    } finally {
      isLoadingStats.value = false
    }
  }

  async function fetchSubmissions() {
    try {
      const response = await reviewApi.getSubmissions()
      submissions.value = response.data
    } catch {
      // silently fail, submissions stay empty
    }
  }

  return {
    config,
    stats,
    submissions,
    isLoading,
    isLoadingStats,
    fetchConfig,
    saveConfig,
    regenerateToken,
    fetchStats,
    fetchSubmissions,
  }
})
