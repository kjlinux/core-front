import apiClient from './client'
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types'

interface Notification {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export const notificationApi = {
  getAll(params?: PaginationParams): Promise<PaginatedResponse<Notification>> {
    return apiClient.get('/notifications', { params }).then((r) => r.data)
  },

  markAsRead(id: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`/notifications/${id}/read`).then((r) => r.data)
  },

  markAllAsRead(): Promise<ApiResponse<void>> {
    return apiClient.patch('/notifications/read-all').then((r) => r.data)
  },
}
