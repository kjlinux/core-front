import apiClient from './client'
import type { PaginatedResponse, PaginationParams } from '@/types'
import type { ReviewConfig, ReviewStats, SubmissionListItem } from '@/types/review'

export interface SaveReviewConfigPayload {
  questions?: { text: string; orderIndex: number }[]
  channels?: { name: string }[]
  isActive?: boolean
}

export const reviewApi = {
  getConfig(): Promise<ReviewConfig | null> {
    return apiClient.get('/feelback/review-config').then((r) => r.data)
  },

  saveConfig(data: SaveReviewConfigPayload): Promise<ReviewConfig> {
    return apiClient.post('/feelback/review-config', data).then((r) => r.data)
  },

  regenerateToken(): Promise<ReviewConfig> {
    return apiClient.post('/feelback/review-config/regenerate-token').then((r) => r.data)
  },

  getStats(): Promise<ReviewStats> {
    return apiClient.get('/feelback/review-stats').then((r) => r.data)
  },

  getSubmissions(params?: PaginationParams): Promise<PaginatedResponse<SubmissionListItem>> {
    return apiClient.get('/feelback/review-submissions', { params }).then((r) => r.data)
  },
}
