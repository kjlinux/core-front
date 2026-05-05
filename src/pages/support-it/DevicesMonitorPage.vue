<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSupportStore } from '@/stores/support.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSearchInput from '@/components/ui/AppSearchInput.vue'
import { SignalIcon, EyeIcon } from '@heroicons/vue/24/outline'
import type { DeviceKind } from '@/types'

const store = useSupportStore()
const router = useRouter()
const toast = useToast()

const filter = ref<{ type?: DeviceKind; status?: 'online' | 'offline' }>({})
const search = ref('')

const typeOptions = [
  { value: '', label: 'Tous les types' },
  { value: 'rfid', label: 'RFID' },
  { value: 'biometric', label: 'Biometrique' },
  { value: 'feelback', label: 'Feelback' },
]
const statusOptions = [
  { value: '', label: 'Tous statuts' },
  { value: 'online', label: 'En ligne' },
  { value: 'offline', label: 'Hors ligne' },
]

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return store.devices
  return store.devices.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      (d.serialNumber ?? '').toLowerCase().includes(q) ||
      (d.siteName ?? '').toLowerCase().includes(q),
  )
})

async function load() {
  await store.fetchDevices({ type: filter.value.type, status: filter.value.status })
}

watch(filter, load, { deep: true })

async function ping(kind: DeviceKind, id: string) {
  try {
    await store.pingDevice(kind, id)
    toast.success('Commande STATUS envoyee')
  } catch (e) {
    toast.error('Echec ping', String((e as Error).message))
  }
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('fr-FR')
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900">Capteurs</h1>
      <p class="text-sm text-gray-500">Tous les capteurs, toutes entreprises confondues</p>
    </div>

    <AppCard padding="sm">
      <div class="flex flex-wrap gap-3 items-end">
        <div class="flex-1 min-w-[220px]">
          <AppSearchInput v-model="search" placeholder="Rechercher (nom, serie, site)..." />
        </div>
        <AppSelect v-model="filter.type" :options="typeOptions" label="Type" />
        <AppSelect v-model="filter.status" :options="statusOptions" label="Statut" />
      </div>
    </AppCard>

    <AppCard padding="none">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Derniere activite</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firmware</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr v-for="d in filtered" :key="`${d.kind}:${d.id}`" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ d.name }}</div>
                <div class="text-xs text-gray-500">{{ d.serialNumber ?? d.id }}</div>
              </td>
              <td class="px-4 py-3">
                <AppBadge variant="info" size="sm">{{ d.kind }}</AppBadge>
                <AppBadge v-if="d.isWitness" variant="warning" size="sm" class="ml-1">temoin</AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ d.siteName ?? '—' }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="d.isOnline ? 'success' : 'danger'" size="sm">
                  {{ d.isOnline ? 'En ligne' : 'Hors ligne' }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ fmtDate(d.lastSeenAt) }}</td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ d.firmwareVersion ?? '—' }}</td>
              <td class="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                <AppButton
                  v-if="d.kind === 'rfid' || d.kind === 'biometric'"
                  size="sm"
                  variant="outline"
                  @click="ping(d.kind, d.id)"
                >
                  <SignalIcon class="w-4 h-4" /> Ping
                </AppButton>
                <AppButton size="sm" variant="ghost" @click="router.push(`/support-it/devices/${d.kind}/${d.id}`)">
                  <EyeIcon class="w-4 h-4" />
                </AppButton>
              </td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-sm text-gray-500">Aucun capteur</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>
