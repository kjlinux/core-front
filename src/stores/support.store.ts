import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supportApi, type AlertsFilter, type DevicesFilter, type SupportCompanyRow, type SupportCompanyDetail } from '@/services/api/support.api'
import { getEcho } from '@/services/echo'
import type { DeviceAlert, DeviceKind, DevicesOverview, SupportDevice, SystemHealth, DeviceStatusUpdatePayload } from '@/types'

export const useSupportStore = defineStore('support', () => {
  const health = ref<SystemHealth | null>(null)
  const overview = ref<DevicesOverview | null>(null)
  const devices = ref<SupportDevice[]>([])
  const witnesses = ref<SupportDevice[]>([])
  const alerts = ref<DeviceAlert[]>([])
  const alertsTotal = ref(0)
  const companies = ref<SupportCompanyRow[]>([])
  const companyDetail = ref<SupportCompanyDetail | null>(null)
  const isLoading = ref(false)

  const openAlertsCount = computed(
    () => alerts.value.filter((a) => a.status === 'open' || a.status === 'acknowledged').length,
  )

  async function fetchHealth() {
    isLoading.value = true
    try {
      health.value = await supportApi.getHealth()
    } finally {
      isLoading.value = false
    }
  }

  async function fetchOverview(companyId?: string) {
    overview.value = await supportApi.getOverview(companyId)
  }

  async function fetchDevices(filter: DevicesFilter = {}) {
    isLoading.value = true
    try {
      devices.value = await supportApi.getDevices(filter)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchWitnesses() {
    witnesses.value = await supportApi.listWitnesses()
  }

  async function markWitness(kind: DeviceKind, id: string) {
    await supportApi.markWitness(kind, id)
    const d = devices.value.find((x) => x.id === id && x.kind === kind)
    if (d) d.isWitness = true
    await fetchWitnesses()
  }

  async function unmarkWitness(kind: DeviceKind, id: string) {
    await supportApi.unmarkWitness(kind, id)
    const d = devices.value.find((x) => x.id === id && x.kind === kind)
    if (d) d.isWitness = false
    witnesses.value = witnesses.value.filter((w) => !(w.id === id && w.kind === kind))
  }

  async function pingDevice(kind: DeviceKind, id: string) {
    return supportApi.pingDevice(kind, id)
  }

  async function fetchAlerts(filter: AlertsFilter = {}) {
    isLoading.value = true
    try {
      const res = await supportApi.getAlerts(filter)
      alerts.value = res.data
      alertsTotal.value = res.meta?.total ?? res.data.length
    } finally {
      isLoading.value = false
    }
  }

  async function acknowledgeAlert(id: string) {
    const updated = await supportApi.acknowledgeAlert(id)
    const idx = alerts.value.findIndex((a) => a.id === id)
    if (idx !== -1) alerts.value[idx] = updated
  }

  async function resolveAlert(id: string) {
    const updated = await supportApi.resolveAlert(id)
    const idx = alerts.value.findIndex((a) => a.id === id)
    if (idx !== -1) alerts.value[idx] = updated
  }

  async function fetchCompanies() {
    isLoading.value = true
    try {
      companies.value = await supportApi.getCompanies()
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCompanyDetail(id: string) {
    isLoading.value = true
    try {
      companyDetail.value = await supportApi.getCompanyDetail(id)
    } finally {
      isLoading.value = false
    }
  }

  function handleRealtimeDevice(p: DeviceStatusUpdatePayload) {
    const isOnline = p.status === 'online'
    const d = devices.value.find((x) => x.id === p.deviceId && x.kind === p.deviceType)
    if (d) {
      d.isOnline = isOnline
      d.lastSeenAt = p.timestamp
    }
    const w = witnesses.value.find((x) => x.id === p.deviceId && x.kind === p.deviceType)
    if (w) {
      w.isOnline = isOnline
      w.lastSeenAt = p.timestamp
    }
    if (overview.value && p.previousStatus && p.previousStatus !== p.status) {
      const kind = p.deviceType as 'rfid' | 'biometric' | 'feelback'
      const bucket = overview.value[kind]
      if (bucket) {
        bucket.online = Math.max(0, Math.min(bucket.total, bucket.online + (isOnline ? 1 : -1)))
      }
    }
  }

  function subscribeRealtime() {
    const echo = getEcho()
    if (!echo) return
    echo.channel('support')
      .listen('.alert.created', (payload: { alert: DeviceAlert }) => {
        alerts.value = [payload.alert, ...alerts.value]
        alertsTotal.value += 1
      })
      .listen('.alert.resolved', (payload: { alertId: string; status: string; resolvedAt: string }) => {
        const idx = alerts.value.findIndex((a) => a.id === payload.alertId)
        if (idx !== -1) {
          const existing = alerts.value[idx] as DeviceAlert
          alerts.value[idx] = { ...existing, status: payload.status as DeviceAlert['status'], resolved_at: payload.resolvedAt }
        }
      })
      .listen('.health.changed', (payload: SystemHealth) => {
        health.value = payload
      })
  }

  function unsubscribeRealtime() {
    const echo = getEcho()
    if (!echo) return
    echo.leave('support')
  }

  return {
    health,
    overview,
    devices,
    witnesses,
    alerts,
    alertsTotal,
    companies,
    companyDetail,
    isLoading,
    openAlertsCount,
    fetchHealth,
    fetchOverview,
    fetchDevices,
    fetchWitnesses,
    markWitness,
    unmarkWitness,
    pingDevice,
    fetchAlerts,
    acknowledgeAlert,
    resolveAlert,
    fetchCompanies,
    fetchCompanyDetail,
    handleRealtimeDevice,
    subscribeRealtime,
    unsubscribeRealtime,
  }
})
