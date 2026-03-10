import axios from 'axios'
import type { PublicReviewConfig, ReviewSubmitPayload } from '@/types/review'

const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
})

// Unwrap { success, data } response
publicClient.interceptors.response.use((response) => {
  const body = response.data
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    response.data = body.data
  }
  return response
})

export const publicReviewApi = {
  getPublicConfig(token: string): Promise<PublicReviewConfig> {
    return publicClient.get(`/public/review/${token}`).then((r) => r.data)
  },

  submitReview(token: string, data: ReviewSubmitPayload): Promise<void> {
    return publicClient.post(`/public/review/${token}/submit`, data).then((r) => r.data)
  },
}
