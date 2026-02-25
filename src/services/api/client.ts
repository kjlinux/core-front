import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach JWT token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: auto-unwrap { success, data } wrapper from API responses
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data
    console.log('[API Response]', response.config.url, body)
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      response.data = body.data
    }
    return response
  },
  (error) => {
    console.error('[API Error]', error.config?.url, error.response?.status, error.response?.data)
    if (error.response?.status === 401) {
      // Ne pas rediriger si c'est l'endpoint login lui-meme
      const url = error.config?.url || ''
      if (!url.includes('/auth/login') && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
