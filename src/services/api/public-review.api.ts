import axios from 'axios'
import type { PublicReviewConfig, ReviewSubmitPayload } from '@/types/review'
import { extractApiErrorMessage } from '@/utils/api-error'

const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
})

// Unwrap { success, data } response
publicClient.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      response.data = body.data
    }
    return response
  },
  (error) => {
    // Normaliser error.message avec le vrai message serveur (ce client public
    // ne passe pas par l'intercepteur de client.ts).
    if (axios.isAxiosError(error) && error.response) {
      error.message = extractApiErrorMessage(error, error.message)
    }
    return Promise.reject(error)
  },
)

export const publicReviewApi = {
  getPublicConfig(token: string): Promise<PublicReviewConfig> {
    return publicClient.get(`/public/review/${token}`).then((r) => r.data)
  },

  submitReview(token: string, data: ReviewSubmitPayload): Promise<void> {
    return publicClient.post(`/public/review/${token}/submit`, data).then((r) => r.data)
  },
}
