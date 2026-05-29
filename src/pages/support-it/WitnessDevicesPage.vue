<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useSupportStore } from '@/stores/support.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppSearchInput from '@/components/ui/AppSearchInput.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import type { DeviceKind } from '@/types'
import type { TableColumn } from '@/types/common'

const store = useSupportStore()
const toast = useToast()

const showAdd = ref(false)
const search = ref('')
const searchWitness = ref('')
const currentPage = ref(1)
const perPage = 10

const columns: TableColumn[] = [
  { key: 'name', label: 'Nom' },
  { key: 'kind', label: 'Type' },
  { key: 'siteName', label: 'Site' },
  { key: 'status', label: 'Statut' },
  { key: 'lastSeenAt', label: 'Dernier signal' },
  { key: 'actions', label: '', sortable: false, align: 'right' },
]

const filteredWitnesses = computed(() => {
  const q = searchWitness.value.trim().toLowerCase()
  if (!q) return store.witnesses
  return store.witnesses.filter(
    (w) => w.name.toLowerCase().includes(q) || (w.serialNumber ?? '').toLowerCase().includes(q),
  )
})

const sorted = computed(() =>
  [...filteredWitnesses.value].sort(
    (a, b) => new Date(b.lastSeenAt ?? 0).getTime() - new Date(a.lastSeenAt ?? 0).getTime(),
  ),
)

const pagedWitnesses = computed(() =>
  sorted.value.slice((currentPage.value - 1) * perPage, currentPage.value * perPage),
)

const paginationObj = computed(() => ({
  currentPage: currentPage.value,
  perPage,
  total: sorted.value.length,
  totalPages: Math.max(1, Math.ceil(sorted.value.length / perPage)),
}))

watch(filteredWitnesses, () => {
  currentPage.value = 1
})

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
    try {
      await store.fetchDevices()
    } catch (e) {
      toast.error('Impossible de charger les capteurs', String((e as Error).message))
    }
  }
}

async function add(kind: DeviceKind, id: string) {
  try {
    await store.markWitness(kind, id)
    toast.success('Capteur marqué comme témoin')
    showAdd.value = false
  } catch (e) {
    toast.error('Échec', String((e as Error).message))
  }
}

async function remove(kind: DeviceKind, id: string) {
  if (!confirm('Retirer ce capteur de la liste des témoins ?')) return
  try {
    await store.unmarkWitness(kind, id)
    toast.success('Retiré')
  } catch (e) {
    toast.error('Échec', String((e as Error).message))
  }
}

function fmtDate(s: string | null) {
  if (!s) return '-'
  return new Date(s).toLocaleString('fr-FR')
}

onMounted(async () => {
  try {
    await store.fetchWitnesses()
  } catch (e) {
    toast.error('Impossible de charger les capteurs témoins', String((e as Error).message))
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Capteurs témoins</h1>
        <p class="text-sm text-gray-500">Capteurs de référence dans les locaux du support, pour diagnostic</p>
      </div>
      <AppButton @click="openAdd">
        <PlusIcon class="w-4 h-4" /> Ajouter
      </AppButton>
    </div>

    <AppCard padding="sm">
      <div class="flex flex-wrap gap-3 items-end">
        <div class="flex-1 min-w-55">
          <AppSearchInput v-model="searchWitness" placeholder="Rechercher (nom, serie)..." />
        </div>
      </div>
    </AppCard>

    <AppCard padding="none">
      <DataTable
        :columns="columns"
        :data="pagedWitnesses"
        :loading="store.isLoading"
        :pagination="paginationObj"
        default-sort-column="lastSeenAt"
        default-sort-direction="desc"
        empty-message="Aucun capteur témoin enregistré."
        @page-change="(p) => (currentPage = p)"
      >
        <template #name="{ row }">
          <div class="font-medium text-gray-900">{{ row.name }}</div>
          <div class="text-xs text-gray-500">{{ row.serialNumber ?? row.id }}</div>
        </template>
        <template #kind="{ row }">
          <AppBadge variant="info" size="sm">{{ row.kind }}</AppBadge>
        </template>
        <template #siteName="{ row }">{{ row.siteName ?? '-' }}</template>
        <template #status="{ row }">
          <AppBadge :variant="row.isOnline ? 'success' : 'danger'" size="sm">
            <span
              v-if="row.isOnline"
              class="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse mr-1 align-middle"
            ></span>
            {{ row.isOnline ? 'En ligne' : 'Hors ligne' }}
          </AppBadge>
        </template>
        <template #lastSeenAt="{ row }">{{ fmtDate(row.lastSeenAt) }}</template>
        <template #actions="{ row }">
          <div class="text-right" @click.stop>
            <AppButton size="sm" variant="ghost" @click="remove(row.kind, row.id)">
              <TrashIcon class="w-4 h-4 text-red-600" />
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>

    <AppModal v-model="showAdd" title="Ajouter un capteur témoin" size="lg">
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
