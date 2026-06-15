import { getEcho } from '@/services/echo'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import { useAttendanceStore } from '@/stores/attendance.store'
import { useFeelbackStore } from '@/stores/feelback.store'
import { useBiometricStore } from '@/stores/biometric.store'
import { useRfidDeviceStore } from '@/stores/rfid-device.store'
import { useFeelbackDeviceStore } from '@/stores/feelback-device.store'
import { useSupportStore } from '@/stores/support.store'
import { useUiStore } from '@/stores/ui.store'
import type { DeviceStatusUpdatePayload } from '@/types'

const recentDeviceStatus = new Map<string, { status: string; at: number }>()
const FLAP_WINDOW_MS = 90_000

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
  const rfidDeviceStore = useRfidDeviceStore()
  const feelbackDeviceStore = useFeelbackDeviceStore()
  const supportStore = useSupportStore()
  const ui = useUiStore()

  // Nom du canal prive devices selon le role : les roles transverses ecoutent le flux
  // global ; les autres uniquement le canal de leur entreprise. Null si indeterminable.
  function deviceChannelName(): string | null {
    if (authStore.isSupportIt || authStore.isSuperAdmin || authStore.userRole === 'technicien') {
      return 'devices.all'
    }
    return authStore.userCompanyId ? `devices.${authStore.userCompanyId}` : null
  }

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

        const sourceName = data.source === 'rfid' ? 'RFID' : 'Biométrique'
        const action = data.exitTime ? 'Sortie' : 'Entrée'
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

    // Canal devices PRIVE (cloisonnement multi-tenant) - dispatch + notification statut.
    // Roles transverses : flux global 'devices.all' ; sinon le canal de sa propre entreprise.
    const deviceChannel = deviceChannelName()
    if (deviceChannel) {
      echo.private(deviceChannel)
        .stopListening('.device.status.updated')
        .listen('.device.status.updated', (data: DeviceStatusUpdatePayload) => {
        const key = `${data.deviceType}:${data.deviceId}`
        const prev = recentDeviceStatus.get(key)
        const now = Date.now()
        const isFlap = !!prev && prev.status === data.status && now - prev.at < FLAP_WINDOW_MS
        recentDeviceStatus.set(key, { status: data.status, at: now })

        // 1. Maj stores module (statut + dernier signal)
        const modulePayload = { deviceId: data.deviceId, status: data.status, timestamp: data.timestamp }
        if (data.deviceType === 'biometric') {
          biometricStore.handleRealtimeDevice(modulePayload)
        } else if (data.deviceType === 'rfid') {
          rfidDeviceStore.handleRealtimeDevice(modulePayload)
        } else if (data.deviceType === 'feelback') {
          feelbackDeviceStore.handleRealtimeDevice(modulePayload)
        }

        // 2. Maj store support (pages capteurs / temoins en direct)
        supportStore.handleRealtimeDevice(data)

        // 3. Notification utilisateur (anti-flapping + ciblage role)
        if (isFlap) return
        const isTarget =
          authStore.isSupportIt ||
          authStore.isSuperAdmin ||
          (authStore.isAdminEnterprise && !!data.companyId && data.companyId === authStore.userCompanyId)
        if (!isTarget) return

        // Resolution du nom lisible : payload > store du module (deja charge sur la page
        // capteurs concernee) > store support > numero de serie. On n'affiche JAMAIS l'UUID
        // brut en dernier recours (illisible pour l'utilisateur).
        const moduleList = (
          data.deviceType === 'biometric' ? biometricStore.devices
            : data.deviceType === 'rfid' ? rfidDeviceStore.devices
              : data.deviceType === 'feelback' ? feelbackDeviceStore.devices
                : []
        ) as Array<{ id: string; name?: string }>
        const moduleName = moduleList.find((d) => d.id === data.deviceId)?.name
        const fallback = supportStore.devices.find((d) => d.id === data.deviceId && d.kind === data.deviceType)
        const name = data.deviceName ?? moduleName ?? fallback?.name ?? data.serialNumber ?? 'Capteur'
        const ctx = [data.companyName, data.siteName ?? fallback?.siteName].filter(Boolean).join(' - ')
        const msg = ctx ? `${name} - ${ctx}` : String(name)

        if (data.status === 'offline') {
          ui.addToast({ type: 'warning', title: 'Capteur hors ligne', message: msg })
        } else {
          ui.addToast({ type: 'success', title: 'Capteur en ligne', message: msg })
        }
        })
    }

    // Canal support - alertes systeme + sante (support_it / super_admin uniquement)
    if (authStore.isSupportIt || authStore.isSuperAdmin) {
      supportStore.subscribeRealtime()
    }
  }

  function unsubscribeAll() {
    const echo = getEcho()
    if (!echo) return

    notificationStore.unsubscribeRealtime()
    echo.leave('attendance')
    echo.leave('feelback')
    const deviceChannel = deviceChannelName()
    if (deviceChannel) {
      echo.leave(deviceChannel)
    }
    if (authStore.isSupportIt || authStore.isSuperAdmin) {
      supportStore.unsubscribeRealtime()
    }
  }

  return { subscribeAll, unsubscribeAll }
}
