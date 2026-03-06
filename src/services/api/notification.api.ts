import apiClient from './client'
import type { PaginatedResponse, PaginationParams } from '@/types'

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

  markAsRead(id: string): Promise<void> {
    return apiClient.patch(`/notifications/${id}/read`).then((r) => r.data)
  },

  markAllAsRead(): Promise<void> {
    return apiClient.patch('/notifications/read-all').then((r) => r.data)
  },
}
