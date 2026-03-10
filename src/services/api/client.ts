import axios from 'axios'
import router from '@/router'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Convert camelCase keys to snake_case recursively for API requests.
 * The Laravel backend expects snake_case field names.
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function convertKeysToSnakeCase(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToSnakeCase)
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof File) && !(obj instanceof Blob)) {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[camelToSnake(key)] = convertKeysToSnakeCase(value)
    }
    return result
  }
  return obj
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
})

// Request interceptor: attach JWT token + convert camelCase to snake_case
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Convert request body keys from camelCase to snake_case
    if (config.data && typeof config.data === 'object') {
      config.data = convertKeysToSnakeCase(config.data)
    }

    // Convert query params keys from camelCase to snake_case
    if (config.params && typeof config.params === 'object') {
      config.params = convertKeysToSnakeCase(config.params)
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: auto-unwrap { success, data } wrapper from API responses
let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

function forceLogout() {
  const auth = useAuthStore()
  auth.logout()
  router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath, expired: '1' } })
}

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      response.data = body.data
    }
    return response
  },
  async (error) => {
    console.error('[API Error]', error.config?.url, error.response?.status, error.response?.data)

    const originalRequest = error.config
    const url = originalRequest?.url || ''
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh')
    const isOnLoginPage = router.currentRoute.value.path.includes('/login')

    if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token')

      if (!refreshToken || isOnLoginPage) {
        forceLogout()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await apiClient.post('/auth/refresh', { token: refreshToken })
        const data = response.data
        const newAccessToken: string = data.accessToken ?? data.access_token
        const newRefreshToken: string | undefined = data.refreshToken ?? data.refresh_token

        localStorage.setItem('access_token', newAccessToken)
        if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken)

        const auth = useAuthStore()
        auth.accessToken = newAccessToken

        processQueue(null, newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        forceLogout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
