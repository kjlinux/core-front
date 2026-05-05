<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supportApi } from '@/services/api/support.api'
import { useSupportStore } from '@/stores/support.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { ArrowLeftIcon, SignalIcon } from '@heroicons/vue/24/outline'
import type { DeviceAlert, DeviceKind, SupportDevice } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useSupportStore()
const toast = useToast()

const kind = computed(() => route.params.kind as DeviceKind)
const id = computed(() => route.params.id as string)

const device = ref<any>(null)
const alerts = ref<DeviceAlert[]>([])
const loading = ref(false)
const witnessId = ref<string>('')

const witnessOptions = computed(() => [
  { value: '', label: 'Comparer avec un temoin...' },
  ...store.witnesses
    .filter((w) => w.kind === kind.value)
    .map((w) => ({ value: w.id, label: w.name })),
])
const selectedWitness = computed<SupportDevice | undefined>(() =>
  store.witnesses.find((w) => w.id === witnessId.value),
)

async function load() {
  loading.value = true
  try {
    const data = await supportApi.getDevice(kind.value, id.value)
    device.value = data.device
    alerts.value = data.alerts
  } finally {
    loading.value = false
  }
}

async function ping() {
  try {
    await store.pingDevice(kind.value, id.value)
    toast.success('Commande STATUS envoyee')
  } catch (e) {
    toast.error('Echec', String((e as Error).message))
  }
}

function fmtDate(s: string | null | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleString('fr-FR')
}

onMounted(async () => {
  await Promise.all([load(), store.fetchWitnesses()])
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <AppButton variant="ghost" size="sm" @click="router.back()">
          <ArrowLeftIcon class="w-4 h-4" /> Retour
        </AppButton>
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">{{ device?.name ?? device?.serial_number ?? id }}</h1>
          <p class="text-sm text-gray-500 capitalize">{{ kind }}</p>
        </div>
      </div>
      <div class="flex gap-2">
        <AppButton v-if="kind === 'rfid' || kind === 'biometric'" variant="outline" @click="ping">
          <SignalIcon class="w-4 h-4" /> Envoyer STATUS
        </AppButton>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard title="Capteur">
        <dl v-if="device" class="space-y-2 text-sm">
          <div class="flex justify-between"><dt class="text-gray-500">Statut</dt>
            <dd><AppBadge :variant="device.is_online ? 'success' : 'danger'" size="sm">{{ device.is_online ? 'En ligne' : 'Hors ligne' }}</AppBadge></dd>
          </div>
          <div class="flex justify-between"><dt class="text-gray-500">Serie</dt><dd>{{ device.serial_number ?? '—' }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">Site</dt><dd>{{ device.site_id ?? '—' }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">Firmware</dt><dd>{{ device.firmware_version ?? '—' }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">Dernier signal</dt><dd>{{ fmtDate(device.last_ping_at ?? device.last_sync_at) }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">Temoin</dt><dd>{{ device.is_witness ? 'Oui' : 'Non' }}</dd></div>
        </dl>
        <p v-else class="text-sm text-gray-500">Chargement...</p>
      </AppCard>

      <AppCard title="Comparaison capteur temoin" subtitle="Diagnostic visuel">
        <AppSelect v-model="witnessId" :options="witnessOptions" />
        <div v-if="selectedWitness" class="mt-4 p-3 bg-gray-50 rounded text-sm space-y-1">
          <div class="flex justify-between"><span class="text-gray-500">Nom</span><span>{{ selectedWitness.name }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Statut</span>
            <AppBadge :variant="selectedWitness.isOnline ? 'success' : 'danger'" size="sm">{{ selectedWitness.isOnline ? 'En ligne' : 'Hors ligne' }}</AppBadge>
          </div>
          <div class="flex justify-between"><span class="text-gray-500">Dernier signal</span><span>{{ fmtDate(selectedWitness.lastSeenAt) }}</span></div>
        </div>
        <p v-else-if="witnessOptions.length <= 1" class="mt-4 text-xs text-gray-500">Aucun capteur temoin de ce type. Marquez-en un depuis la page Capteurs temoins.</p>
      </AppCard>
    </div>

    <AppCard title="Alertes recentes">
      <div v-if="alerts.length === 0" class="text-sm text-gray-500 py-3">Aucune alerte pour ce capteur.</div>
      <div v-else class="divide-y divide-gray-100">
        <div v-for="a in alerts" :key="a.id" class="py-3 flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-900">{{ a.title }}</p>
            <p class="text-xs text-gray-500">{{ fmtDate(a.created_at) }}</p>
          </div>
          <div class="flex gap-2">
            <AppBadge :variant="a.severity === 'critical' || a.severity === 'high' ? 'danger' : 'warning'" size="sm">{{ a.severity }}</AppBadge>
            <AppBadge :variant="a.status === 'resolved' ? 'success' : 'neutral'" size="sm">{{ a.status }}</AppBadge>
          </div>
        </div>
      </div>
    </AppCard>
  </div>
</template>
