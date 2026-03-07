import apiClient from './client'
import type { LoginPayload, AuthResponse, User } from '@/types'

export const authApi = {
  login(payload: LoginPayload): Promise<AuthResponse> {
    return apiClient.post('/auth/login', payload).then((r) => r.data)
  },

  logout(): Promise<void> {
    return apiClient.post('/auth/logout').then((r) => r.data)
  },

  refreshToken(token: string): Promise<AuthResponse> {
    return apiClient.post('/auth/refresh', { token }).then((r) => r.data)
  },

  getCurrentUser(): Promise<User> {
    return apiClient.get('/auth/me').then((r) => r.data)
  },

  forgotPassword(email: string): Promise<void> {
    return apiClient.post('/auth/forgot-password', { email }).then((r) => r.data)
  },

  updateProfile(data: { firstName: string; lastName: string }): Promise<User> {
    return apiClient.put('/auth/profile', {
      first_name: data.firstName,
      last_name: data.lastName,
    }).then((r) => r.data)
  },

  changePassword(data: { currentPassword: string; newPassword: string; newPassword_confirmation: string }): Promise<void> {
    return apiClient.put('/auth/password', {
      current_password: data.currentPassword,
      new_password: data.newPassword,
      new_password_confirmation: data.newPassword_confirmation,
    }).then((r) => r.data)
  },

  resetPassword(data: { token: string; email: string; password: string; password_confirmation: string }): Promise<void> {
    return apiClient.post('/auth/reset-password', data).then((r) => r.data)
  },
}
