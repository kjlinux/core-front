import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { notificationApi } from '@/services/api/notification.api'
import { getEcho } from '@/services/echo'

interface Notification {
  id: string
  type?: string
  title: string
  message: string
  isRead: boolean
  data?: Record<string, unknown>
  createdAt: string
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const isLoading = ref(false)

  const unreadCount = computed(() => notifications.value.filter((n) => !n.isRead).length)

  async function fetchNotifications() {
    isLoading.value = true
    try {
      const response = await notificationApi.getAll()
      notifications.value = response.data
    } finally {
      isLoading.value = false
    }
  }

  async function markAsRead(id: string) {
    await notificationApi.markAsRead(id)
    const notification = notifications.value.find((n) => n.id === id)
    if (notification) {
      notification.isRead = true
    }
  }

  async function markAllAsRead() {
    await notificationApi.markAllAsRead()
    notifications.value.forEach((n) => {
      n.isRead = true
    })
  }

  function subscribeRealtime() {
    const echo = getEcho()
    if (!echo) return

    echo.channel('notifications').listen('.notification.received', (data: Notification) => {
      // Add to the top of the list
      notifications.value.unshift({
        id: data.id,
        type: data.type,
        title: data.title,
        message: data.message,
        isRead: false,
        data: data.data,
        createdAt: data.createdAt,
      })
    })
  }

  function unsubscribeRealtime() {
    const echo = getEcho()
    if (!echo) return
    echo.leave('notifications')
  }

  return {
    notifications,
    isLoading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    subscribeRealtime,
    unsubscribeRealtime,
  }
})
