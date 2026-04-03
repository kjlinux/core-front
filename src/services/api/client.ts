import axios from 'axios'
import router from '@/router'
import { useAuthStore } from '@/stores/auth.store'
import { disconnectEcho } from '@/services/echo'

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

    // Inject active company as query param for technicien company switching.
    // Using query param instead of custom header to avoid CORS preflight issues with proxies.
    const activeCompanyId = localStorage.getItem('active_company_id')
    const skipCompanyScope = config.params?.__skipCompanyScope === true
    if (!skipCompanyScope && activeCompanyId && activeCompanyId !== 'undefined' && activeCompanyId !== 'null') {
      config.params = { ...config.params, _company_id: activeCompanyId }
    }
    if (config.params) {
      delete config.params.__skipCompanyScope
    }

    // Convert request body keys from camelCase to snake_case (skip FormData)
    if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
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
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      response.data = body.data
    }
    return response
  },
  (error) => {
    const url = error.config?.url || ''
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/logout')
    const isOnLoginPage = router.currentRoute.value.path.includes('/login')
    const isOnPublicQrPage = router.currentRoute.value.path.includes('/qr-scan')

    if (error.response?.status === 401 && !isAuthEndpoint && !isOnLoginPage && !isOnPublicQrPage) {
      // Nettoyer les tokens directement sans passer par le store
      // pour éviter tout problème d'initialisation de Pinia
      localStorage.removeItem('access_token')
      localStorage.removeItem('auth_user')
      try {
        const auth = useAuthStore()
        auth.user = null
        auth.accessToken = null
        disconnectEcho()
      } catch {
        // Pinia pas encore prêt — les tokens localStorage sont déjà supprimés
      }
      router.push({ name: 'login' })
    }

    return Promise.reject(error)
  }
)

export default apiClient
