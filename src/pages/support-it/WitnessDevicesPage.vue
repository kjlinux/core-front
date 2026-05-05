<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSupportStore } from '@/stores/support.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppSearchInput from '@/components/ui/AppSearchInput.vue'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import type { DeviceKind } from '@/types'

const store = useSupportStore()
const toast = useToast()

const showAdd = ref(false)
const search = ref('')

const candidates = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.devices.filter((d) => {
    if (d.isWitness) return false
    if (!q) return true
    return d.name.toLowerCase().includes(q) || (d.serialNumber ?? '').toLowerCase().includes(q)
  })
})

async function openAdd() {
  showAdd.value = true
  if (store.devices.length === 0) {
    await store.fetchDevices()
  }
}

async function add(kind: DeviceKind, id: string) {
  try {
    await store.markWitness(kind, id)
    toast.success('Capteur marque comme temoin')
    showAdd.value = false
  } catch (e) {
    toast.error('Echec', String((e as Error).message))
  }
}

async function remove(kind: DeviceKind, id: string) {
  if (!confirm('Retirer ce capteur de la liste des temoins ?')) return
  try {
    await store.unmarkWitness(kind, id)
    toast.success('Retire')
  } catch (e) {
    toast.error('Echec', String((e as Error).message))
  }
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('fr-FR')
}

onMounted(() => store.fetchWitnesses())
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Capteurs temoins</h1>
        <p class="text-sm text-gray-500">Capteurs de reference dans les locaux du support, pour diagnostic</p>
      </div>
      <AppButton @click="openAdd">
        <PlusIcon class="w-4 h-4" /> Ajouter
      </AppButton>
    </div>

    <AppCard padding="none">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernier signal</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr v-for="w in store.witnesses" :key="`${w.kind}:${w.id}`">
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ w.name }}</div>
                <div class="text-xs text-gray-500">{{ w.serialNumber ?? w.id }}</div>
              </td>
              <td class="px-4 py-3"><AppBadge variant="info" size="sm">{{ w.kind }}</AppBadge></td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ w.siteName ?? '—' }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="w.isOnline ? 'success' : 'danger'" size="sm">
                  {{ w.isOnline ? 'En ligne' : 'Hors ligne' }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ fmtDate(w.lastSeenAt) }}</td>
              <td class="px-4 py-3 text-right">
                <AppButton size="sm" variant="ghost" @click="remove(w.kind, w.id)">
                  <TrashIcon class="w-4 h-4 text-red-600" />
                </AppButton>
              </td>
            </tr>
            <tr v-if="store.witnesses.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-sm text-gray-500">Aucun capteur temoin enregistre.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <AppModal v-model="showAdd" title="Ajouter un capteur temoin" size="lg">
      <div class="space-y-3">
        <AppSearchInput v-model="search" placeholder="Rechercher un capteur..." />
        <div class="max-h-96 overflow-y-auto divide-y divide-gray-100">
          <div
            v-for="d in candidates"
            :key="`${d.kind}:${d.id}`"
            class="flex items-center justify-between py-2"
          >
            <div>
              <div class="text-sm font-medium text-gray-900">{{ d.name }}</div>
              <div class="text-xs text-gray-500">{{ d.kind }} · {{ d.siteName ?? 'sans site' }}</div>
            </div>
            <AppButton size="sm" @click="add(d.kind, d.id)">Marquer</AppButton>
          </div>
          <div v-if="candidates.length === 0" class="py-6 text-center text-sm text-gray-500">Aucun candidat.</div>
        </div>
      </div>
    </AppModal>
  </div>
</template>
