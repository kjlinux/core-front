import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { notificationApi } from '@/services/api/notification.api'
import { getEcho } from '@/services/echo'
import { useNotificationSound } from '@/composables/useNotificationSound'
import { useAuthStore } from '@/stores/auth.store'

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
  const flashNotification = ref<AppNotification | null>(null)
  const { play: playSound } = useNotificationSound()

  let flashTimer: ReturnType<typeof setTimeout> | null = null

  function triggerFlash(notification: AppNotification) {
    if (flashTimer) clearTimeout(flashTimer)
    flashNotification.value = notification
    flashTimer = setTimeout(() => {
      flashNotification.value = null
    }, 5000)
  }

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

    if (notifications.value.length > 50) {
      notifications.value.pop()
    }

    playSound()
  }

  function subscribeRealtime() {
    const echo = getEcho()
    if (!echo) return

    const authStore = useAuthStore()
    const userId = authStore.user?.id
    if (!userId) return

    const channelName = `notifications.${userId}`

    echo.private(channelName)
      .stopListening('.notification.received')
      .listen('.notification.received', (data: AppNotification) => {
        const notification: AppNotification = {
          id: data.id,
          type: data.type,
          title: data.title,
          message: data.message,
          isRead: false,
          data: data.data,
          createdAt: data.createdAt,
        }
        notifications.value.unshift(notification)
        triggerFlash(notification)
        playSound()
      })
  }

  function unsubscribeRealtime() {
    const echo = getEcho()
    if (!echo) return

    const authStore = useAuthStore()
    const userId = authStore.user?.id
    if (userId) {
      echo.leave(`notifications.${userId}`)
    }
  }

  return {
    notifications,
    isLoading,
    unreadCount,
    flashNotification,
    dismissFlash: () => { flashNotification.value = null },
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addLocalNotification,
    subscribeRealtime,
    unsubscribeRealtime,
  }
})
