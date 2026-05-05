<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSupportStore } from '@/stores/support.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import type { HealthComponent } from '@/types'

const store = useSupportStore()
const toast = useToast()

interface Row {
  name: string
  component: HealthComponent
}

const rows = computed<Row[]>(() => {
  const h = store.health
  if (!h) return []
  return [
    { name: 'Base de donnees', component: h.components.db },
    { name: 'Cache', component: h.components.cache },
    { name: 'File de jobs', component: h.components.queue },
    { name: 'Broker MQTT (HiveMQ)', component: h.components.mqtt },
    { name: 'WebSocket (Reverb)', component: h.components.reverb },
    { name: 'Listener RFID', component: h.components.listeners.rfid },
    { name: 'Listener Biometrique', component: h.components.listeners.biometric },
    { name: 'Listener Feelback', component: h.components.listeners.feelback },
  ]
})

function variantFor(s: string) {
  if (s === 'ok') return 'success'
  if (s === 'degraded') return 'warning'
  return 'danger'
}

async function refresh() {
  try {
    await store.fetchHealth()
    toast.success('Sante systeme actualisee')
  } catch (e) {
    toast.error('Echec de la verification', String((e as Error).message))
  }
}

onMounted(() => store.fetchHealth())
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Sante systeme</h1>
        <p class="text-sm text-gray-500">Dernier check : {{ store.health?.timestamp ? new Date(store.health.timestamp).toLocaleTimeString('fr-FR') : '—' }}</p>
      </div>
      <AppButton variant="outline" @click="refresh" :loading="store.isLoading">
        <ArrowPathIcon class="w-4 h-4" /> Verifier
      </AppButton>
    </div>

    <AppCard>
      <div class="divide-y divide-gray-100">
        <div v-for="row in rows" :key="row.name" class="flex items-center justify-between py-3">
          <div>
            <p class="text-sm font-medium text-gray-900">{{ row.name }}</p>
            <p v-if="row.component.message" class="text-xs text-gray-500 mt-0.5">{{ row.component.message }}</p>
            <p v-else-if="row.component.latencyMs !== undefined" class="text-xs text-gray-500 mt-0.5">Latence : {{ row.component.latencyMs }} ms</p>
            <p v-else-if="row.component.size !== undefined" class="text-xs text-gray-500 mt-0.5">{{ row.component.size }} jobs en file</p>
            <p v-else-if="row.component.lastHeartbeatAt" class="text-xs text-gray-500 mt-0.5">Heartbeat : il y a {{ Math.round(row.component.ageSeconds || 0) }}s</p>
          </div>
          <AppBadge :variant="variantFor(row.component.status)" size="sm">{{ row.component.status }}</AppBadge>
        </div>
      </div>
    </AppCard>

    <AppCard title="Capteurs en ligne par type">
      <div class="grid grid-cols-3 gap-4">
        <div v-for="(d, kind) in (store.health?.devices as Record<string, { total: number; online: number }> | undefined) ?? {}" :key="kind" class="text-center p-4 bg-gray-50 rounded">
          <p class="text-xs text-gray-500 uppercase">{{ kind }}</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ d.online }} / {{ d.total }}</p>
        </div>
      </div>
    </AppCard>
  </div>
</template>
