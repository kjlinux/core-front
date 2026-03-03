import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { notificationApi } from '@/services/api/notification.api'
import { getEcho } from '@/services/echo'
import { useNotificationSound } from '@/composables/useNotificationSound'

export interface AppNotification {
  id: string
  type?: string
  title: string
  message: string
  isRead: boolean
  data?: Record<string, unknown>
  createdAt: string
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<AppNotification[]>([])
  const isLoading = ref(false)
  const { play: playSound } = useNotificationSound()

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

  function addLocalNotification(notification: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>) {
    notifications.value.unshift({
      ...notification,
      id: `local-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    })

    // Keep max 50 notifications
    if (notifications.value.length > 50) {
      notifications.value.pop()
    }

    playSound()
  }

  function subscribeRealtime() {
    const echo = getEcho()
    if (!echo) return

    echo.channel('notifications').listen('.notification.received', (data: AppNotification) => {
      notifications.value.unshift({
        id: data.id,
        type: data.type,
        title: data.title,
        message: data.message,
        isRead: false,
        data: data.data,
        createdAt: data.createdAt,
      })

      playSound()
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
    addLocalNotification,
    subscribeRealtime,
    unsubscribeRealtime,
  }
})
