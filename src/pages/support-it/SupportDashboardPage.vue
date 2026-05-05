<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useSupportStore } from '@/stores/support.store'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import StatCard from '@/components/data-display/StatCard.vue'
import {
  ServerStackIcon,
  CpuChipIcon,
  BellAlertIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline'

const store = useSupportStore()

const totalDevices = computed(() => {
  const o = store.overview
  if (!o) return 0
  return o.rfid.total + o.biometric.total + o.feelback.total
})
const totalOnline = computed(() => {
  const o = store.overview
  if (!o) return 0
  return o.rfid.online + o.biometric.online + o.feelback.online
})
const totalOffline = computed(() => totalDevices.value - totalOnline.value)

const overallVariant = computed(() => {
  const s = store.health?.status
  if (s === 'healthy') return 'success'
  if (s === 'degraded') return 'warning'
  if (s === 'unhealthy') return 'danger'
  return 'neutral'
})

const overallLabel = computed(() => {
  const s = store.health?.status
  if (s === 'healthy') return 'Tout va bien'
  if (s === 'degraded') return 'Degrade'
  if (s === 'unhealthy') return 'Hors ligne'
  return 'Inconnu'
})

const recentAlerts = computed(() => store.alerts.slice(0, 5))

onMounted(async () => {
  await Promise.all([store.fetchHealth(), store.fetchOverview(), store.fetchAlerts({ per_page: 10 })])
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Support IT</h1>
        <p class="text-sm text-gray-500">Vue d'ensemble du système et des capteurs</p>
      </div>
      <AppBadge :variant="overallVariant" size="md">{{ overallLabel }}</AppBadge>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Capteurs" :value="totalDevices" :icon="CpuChipIcon" />
      <StatCard
        title="En ligne"
        :value="totalOnline"
        :icon="ShieldCheckIcon"
        icon-bg-class="bg-green-100"
        icon-color-class="text-green-600"
      />
      <StatCard
        title="Hors ligne"
        :value="totalOffline"
        :icon="ServerStackIcon"
        :icon-bg-class="totalOffline > 0 ? 'bg-red-100' : 'bg-gray-100'"
        :icon-color-class="totalOffline > 0 ? 'text-red-600' : 'text-gray-600'"
      />
      <StatCard
        title="Alertes ouvertes"
        :value="store.overview?.alerts.open ?? 0"
        :icon="BellAlertIcon"
        :icon-bg-class="(store.overview?.alerts.open ?? 0) > 0 ? 'bg-red-100' : 'bg-gray-100'"
        :icon-color-class="(store.overview?.alerts.open ?? 0) > 0 ? 'text-red-600' : 'text-gray-600'"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard title="Santé système" subtitle="Composants critiques">
        <template #actions>
          <RouterLink to="/support-it/health" class="text-sm text-blue-600 hover:underline">Detail</RouterLink>
        </template>
        <div v-if="store.health" class="space-y-2">
          <div v-for="(c, name) in {
            'Base de données': store.health.components.db,
            'Cache': store.health.components.cache,
            'File de jobs': store.health.components.queue,
            'Broker MQTT': store.health.components.mqtt,
            'WebSocket (Reverb)': store.health.components.reverb,
          }" :key="name" class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <span class="text-sm text-gray-700">{{ name }}</span>
            <AppBadge :variant="c.status === 'ok' ? 'success' : c.status === 'degraded' ? 'warning' : 'danger'" size="sm">
              {{ c.status }}
            </AppBadge>
          </div>
        </div>
        <div v-else class="text-sm text-gray-500">Chargement...</div>
      </AppCard>

      <AppCard title="Alertes récentes">
        <template #actions>
          <RouterLink to="/support-it/alerts" class="text-sm text-blue-600 hover:underline">Voir tout</RouterLink>
        </template>
        <div v-if="recentAlerts.length === 0" class="text-sm text-gray-500 py-4">Aucune alerte récente.</div>
        <div v-else class="space-y-3">
          <div v-for="a in recentAlerts" :key="a.id" class="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
            <AppBadge
              :variant="a.severity === 'critical' || a.severity === 'high' ? 'danger' : a.severity === 'medium' ? 'warning' : 'info'"
              size="sm"
            >{{ a.severity }}</AppBadge>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ a.title }}</p>
              <p class="text-xs text-gray-500">{{ new Date(a.created_at).toLocaleString('fr-FR') }}</p>
            </div>
            <AppBadge :variant="a.status === 'resolved' ? 'success' : 'neutral'" size="sm">{{ a.status }}</AppBadge>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>
