import { getEcho } from '@/services/echo'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import { useAttendanceStore } from '@/stores/attendance.store'
import { useFeelbackStore } from '@/stores/feelback.store'
import { useBiometricStore } from '@/stores/biometric.store'
import { useFeelbackDeviceStore } from '@/stores/feelback-device.store'
import { useUiStore } from '@/stores/ui.store'

/**
 * Centralise tous les abonnements Echo temps réel.
 * Appelé une seule fois dans DashboardLayout (onMounted/onUnmounted).
 *
 * Canaux gérés :
 *   - notifications  → notificationStore
 *   - attendance     → attendanceStore + toast + notification locale
 *   - feelback       → feelbackStore + toast + notification locale
 *   - devices        → biometricStore + feelbackDeviceStore
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
    if (!authStore.isAuthenticated) return

    const echo = getEcho()
    if (!echo) return

    // Canal notifications backend
    notificationStore.subscribeRealtime()

    // Canal attendance
    // stopListening avant listen pour éviter les doublons (HMR, remontage)
    echo.channel('attendance')
      .stopListening('.attendance.recorded')
      .listen('.attendance.recorded', (data: {
        id: string
        employeeId: string
        employeeName: string
        date: string
        entryTime: string | null
        exitTime: string | null
        status: string
        source: string
      }) => {
        attendanceStore.handleRealtimeAttendance(data)

        const sourceName = data.source === 'rfid' ? 'RFID' : 'Biometrique'
        const action = data.exitTime ? 'Sortie' : 'Entree'
        const title = `Pointage ${sourceName} - ${action}`
        const message = data.employeeName

        ui.addToast({ type: 'info', title, message })
      })

    // Canal feelback
    echo.channel('feelback')
      .stopListening('.feelback.received')
      .listen('.feelback.received', (data: {
        id?: string
        deviceId?: string
        level: string
        siteName: string
        timestamp?: string
      }) => {
        feelbackStore.handleRealtimeFeedback(data)

        const levelLabels: Record<string, string> = { bon: 'Bon', neutre: 'Neutre', mauvais: 'Mauvais' }
        const toastType = data.level === 'mauvais' ? 'warning' as const : 'info' as const
        const title = `Feelback - ${levelLabels[data.level] ?? data.level}`
        const message = data.siteName

        ui.addToast({ type: toastType, title, message })
      })

    // Canal devices — dispatch selon deviceType
    echo.channel('devices')
      .stopListening('.device.status.updated')
      .listen('.device.status.updated', (data: {
        deviceType: string
        deviceId: string
        status: string
        timestamp: string
        data: Record<string, unknown>
      }) => {
        const payload = { deviceId: data.deviceId, status: data.status, timestamp: data.timestamp }
        if (data.deviceType === 'biometric') {
          biometricStore.handleRealtimeDevice(payload)
        } else if (data.deviceType === 'feelback') {
          feelbackDeviceStore.handleRealtimeDevice(payload)
        }
      })
  }

  function unsubscribeAll() {
    const echo = getEcho()
    if (!echo) return

    notificationStore.unsubscribeRealtime()
    echo.leave('attendance')
    echo.leave('feelback')
    echo.leave('devices')
  }

  return { subscribeAll, unsubscribeAll }
}
