import apiClient from './client'
import type { LoginPayload, AuthResponse, ApiResponse, User } from '@/types'

export const authApi = {
  login(payload: LoginPayload): Promise<AuthResponse> {
    return apiClient.post('/auth/login', payload).then((r) => r.data.data)
  },

  logout(): Promise<void> {
    return apiClient.post('/auth/logout').then((r) => r.data)
  },

  refreshToken(token: string): Promise<AuthResponse> {
    return apiClient.post('/auth/refresh', { token }).then((r) => r.data)
  },

  getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get('/auth/me').then((r) => r.data)
  },
}
