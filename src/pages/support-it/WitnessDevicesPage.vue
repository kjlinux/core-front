<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { useSupportStore } from '@/stores/support.store'
import { useServerTable } from '@/composables/useServerTable'
import { useToast } from '@/composables/useToast'
import { supportApi } from '@/services/api/support.api'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppSearchInput from '@/components/ui/AppSearchInput.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import { extractApiErrorMessage } from '@/utils/api-error'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import type { DeviceKind, SupportDevice } from '@/types'
import type { TableColumn } from '@/types/common'
import { deviceKindLabel, labelOf } from '@/utils/support-labels'

const store = useSupportStore()
const toast = useToast()
const { t } = useI18n()

const showAdd = ref(false)
const candidateSearch = ref('')
const candidates = ref<SupportDevice[]>([])
const loadingCandidates = ref(false)

const { search, handlePageChange, reload } = useServerTable({
  initialFilters: {},
  fetcher: async (p) => {
    try {
      await store.fetchWitnesses({ page: p.page, perPage: p.perPage, search: p.search || undefined })
    } catch (e) {
      toast.error(t('toast.support.loadWitnessError'), extractApiErrorMessage(e, t('common.genericError')))
    }
  },
})

const columns: TableColumn[] = [
  { key: 'name', label: 'Nom', sortable: false },
  { key: 'kind', label: 'Type', sortable: false },
  { key: 'siteName', label: 'Site', sortable: false },
  { key: 'status', label: 'Statut', sortable: false },
  { key: 'lastSeenAt', label: 'Dernier signal', sortable: false },
  { key: 'actions', label: '', sortable: false, align: 'right' },
]

async function loadCandidates() {
  loadingCandidates.value = true
  try {
    const res = await supportApi.getDevices({ witness: false, search: candidateSearch.value || undefined, perPage: 50 })
    candidates.value = res.data
  } catch (e) {
    toast.error(t('toast.support.loadSensorsError'), extractApiErrorMessage(e, t('common.genericError')))
  } finally {
    loadingCandidates.value = false
  }
}

const debouncedCandidates = useDebounceFn(loadCandidates, 400)
watch(candidateSearch, () => debouncedCandidates())

async function openAdd() {
  showAdd.value = true
  candidateSearch.value = ''
  await loadCandidates()
}

async function add(kind: DeviceKind, id: string) {
  try {
    await store.markWitness(kind, id)
    toast.success(t('toast.support.markedWitness'))
    showAdd.value = false
    await reload()
  } catch (e) {
    toast.error(t('common.failed'), extractApiErrorMessage(e, t('common.genericError')))
  }
}

async function remove(kind: DeviceKind, id: string) {
  if (!confirm('Retirer ce capteur de la liste des témoins ?')) return
  try {
    await store.unmarkWitness(kind, id)
    toast.success(t('toast.support.removed'))
    await reload()
  } catch (e) {
    toast.error(t('common.failed'), extractApiErrorMessage(e, t('common.genericError')))
  }
}

function fmtDate(s: string | null) {
  if (!s) return '-'
  return new Date(s).toLocaleString('fr-FR')
}

onMounted(reload)
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
          <AppSearchInput v-model="search" placeholder="Rechercher (nom, série)..." />
        </div>
      </div>
    </AppCard>

    <AppCard padding="none">
      <DataTable
        :columns="columns"
        :data="store.witnesses"
        :loading="store.isLoading"
        :pagination="store.witnessesMeta ?? undefined"
        empty-message="Aucun capteur témoin enregistré."
        @page-change="handlePageChange"
      >
        <template #name="{ row }">
          <div class="font-medium text-gray-900">{{ row.name }}</div>
          <div class="text-xs text-gray-500">{{ row.serialNumber ?? row.id }}</div>
        </template>
        <template #kind="{ row }">
          <AppBadge variant="info" size="sm">{{ labelOf(deviceKindLabel, row.kind) }}</AppBadge>
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
        <AppSearchInput v-model="candidateSearch" placeholder="Rechercher un capteur..." />
        <div v-if="loadingCandidates" class="py-6 text-center text-sm text-gray-500">Chargement...</div>
        <div v-else class="max-h-96 overflow-y-auto divide-y divide-gray-100">
          <div
            v-for="d in candidates"
            :key="`${d.kind}:${d.id}`"
            class="flex items-center justify-between py-2"
          >
            <div>
              <div class="text-sm font-medium text-gray-900">{{ d.name }}</div>
              <div class="text-xs text-gray-500">{{ labelOf(deviceKindLabel, d.kind) }} · {{ d.siteName ?? 'sans site' }}</div>
            </div>
            <AppButton size="sm" @click="add(d.kind, d.id)">Marquer</AppButton>
          </div>
          <div v-if="candidates.length === 0" class="py-6 text-center text-sm text-gray-500">Aucun candidat.</div>
        </div>
      </div>
    </AppModal>
  </div>
</template>
