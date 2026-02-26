import { watch } from 'vue'
import { getEcho } from '@/services/echo'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import { useAttendanceStore } from '@/stores/attendance.store'
import { useFeelbackStore } from '@/stores/feelback.store'
import { useBiometricStore } from '@/stores/biometric.store'
import { useFeelbackDeviceStore } from '@/stores/feelback-device.store'
import { useUiStore } from '@/stores/ui.store'

/**
 * Sets up all real-time Echo subscriptions and toast notifications.
 * Should be called once in App.vue or DashboardLayout.
 */
export function useRealtimeSubscriptions() {
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()
  const attendanceStore = useAttendanceStore()
  const feelbackStore = useFeelbackStore()
  const biometricStore = useBiometricStore()
  const feelbackDeviceStore = useFeelbackDeviceStore()
  const ui = useUiStore()

  function subscribeAll() {
    const echo = getEcho()
    if (!echo) return

    notificationStore.subscribeRealtime()
    attendanceStore.subscribeRealtime()
    feelbackStore.subscribeRealtime()
    biometricStore.subscribeRealtime()
    feelbackDeviceStore.subscribeRealtime()

    // Global toast notifications for key events
    echo.channel('attendance').listen('.attendance.recorded', (data: {
      employeeName: string
      status: string
      source: string
      exitTime: string | null
    }) => {
      const sourceName = data.source === 'rfid' ? 'RFID' : 'Biometrique'
      const action = data.exitTime ? 'Sortie' : 'Entree'
      ui.addToast({
        type: 'info',
        title: `Pointage ${sourceName}`,
        message: `${data.employeeName} - ${action}`,
      })
    })

    echo.channel('feelback').listen('.feelback.received', (data: {
      level: string
      siteName: string
    }) => {
      const levelLabels: Record<string, string> = {
        bon: 'Bon',
        neutre: 'Neutre',
        mauvais: 'Mauvais',
      }
      const type = data.level === 'mauvais' ? 'warning' : 'info'
      ui.addToast({
        type,
        title: `Feelback - ${levelLabels[data.level] ?? data.level}`,
        message: data.siteName,
      })
    })
  }

  function unsubscribeAll() {
    notificationStore.unsubscribeRealtime()
    attendanceStore.unsubscribeRealtime()
    feelbackStore.unsubscribeRealtime()
    biometricStore.unsubscribeRealtime()
    feelbackDeviceStore.unsubscribeRealtime()
  }

  // Auto subscribe/unsubscribe when auth state changes
  watch(
    () => authStore.isAuthenticated,
    (isAuth) => {
      if (isAuth) {
        subscribeAll()
      } else {
        unsubscribeAll()
      }
    },
    { immediate: true },
  )

  return { subscribeAll, unsubscribeAll }
}
