<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSupportStore } from '@/stores/support.store'
import { useServerTable } from '@/composables/useServerTable'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSearchInput from '@/components/ui/AppSearchInput.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import { extractApiErrorMessage } from '@/utils/api-error'
import { SignalIcon, EyeIcon } from '@heroicons/vue/24/outline'
import type { DeviceKind } from '@/types'
import type { TableColumn } from '@/types/common'
import { deviceKindLabel, labelOf } from '@/utils/support-labels'

const store = useSupportStore()
const router = useRouter()
const toast = useToast()
const { t } = useI18n()

const { filters, search, applyFilters, handlePageChange, reload } = useServerTable({
  initialFilters: {
    type: '' as DeviceKind | '',
    status: '' as 'online' | 'offline' | '',
  },
  fetcher: async (p) => {
    try {
      await store.fetchDevices({
        page: p.page,
        perPage: p.perPage,
        search: p.search || undefined,
        type: (p.type || undefined) as DeviceKind | undefined,
        status: (p.status || undefined) as 'online' | 'offline' | undefined,
      })
    } catch (e) {
      toast.error(t('toast.support.loadSensorsError'), extractApiErrorMessage(e, t('common.genericError')))
    }
  },
})

const typeOptions = [
  { value: '', label: 'Tous les types' },
  { value: 'rfid', label: 'RFID' },
  { value: 'biometric', label: 'Biométrique' },
  { value: 'feelback', label: 'Feelback' },
]
const statusOptions = [
  { value: '', label: 'Tous statuts' },
  { value: 'online', label: 'En ligne' },
  { value: 'offline', label: 'Hors ligne' },
]

const columns: TableColumn[] = [
  { key: 'name', label: 'Nom', sortable: false },
  { key: 'kind', label: 'Type', sortable: false },
  { key: 'siteName', label: 'Site', sortable: false },
  { key: 'status', label: 'Statut', sortable: false },
  { key: 'lastSeenAt', label: 'Dernière activité', sortable: false },
  { key: 'firmwareVersion', label: 'Firmware', sortable: false },
  { key: 'actions', label: '', sortable: false, align: 'right' },
]

async function ping(kind: DeviceKind, id: string) {
  try {
    await store.pingDevice(kind, id)
    toast.success(t('toast.support.statusCommandSent'))
  } catch (e) {
    toast.error(t('toast.support.pingFailed'), extractApiErrorMessage(e, t('common.genericError')))
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
    <div>
      <h1 class="text-2xl font-semibold text-gray-900">Capteurs</h1>
      <p class="text-sm text-gray-500">Tous les capteurs, toutes entreprises confondues</p>
    </div>

    <AppCard padding="sm">
      <div class="flex flex-wrap gap-3 items-end">
        <div class="flex-1 min-w-55">
          <AppSearchInput v-model="search" placeholder="Rechercher (nom, série, site)..." />
        </div>
        <AppSelect v-model="filters.type" :options="typeOptions" label="Type" @update:model-value="applyFilters" />
        <AppSelect v-model="filters.status" :options="statusOptions" label="Statut" @update:model-value="applyFilters" />
      </div>
    </AppCard>

    <AppCard padding="none">
      <DataTable
        :columns="columns"
        :data="store.devices"
        :loading="store.isLoading"
        :pagination="store.devicesMeta ?? undefined"
        empty-message="Aucun capteur"
        @page-change="handlePageChange"
      >
        <template #name="{ row }">
          <div class="font-medium text-gray-900">{{ row.name }}</div>
          <div class="text-xs text-gray-500">{{ row.serialNumber ?? row.id }}</div>
        </template>
        <template #kind="{ row }">
          <AppBadge variant="info" size="sm">{{ labelOf(deviceKindLabel, row.kind) }}</AppBadge>
          <AppBadge v-if="row.isWitness" variant="warning" size="sm" class="ml-1">Témoin</AppBadge>
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
        <template #firmwareVersion="{ row }">{{ row.firmwareVersion ?? '-' }}</template>
        <template #actions="{ row }">
          <div class="text-right space-x-2 whitespace-nowrap" @click.stop>
            <AppButton
              v-if="row.kind === 'rfid' || row.kind === 'biometric'"
              size="sm"
              variant="outline"
              @click="ping(row.kind, row.id)"
            >
              <SignalIcon class="w-4 h-4" /> Ping
            </AppButton>
            <AppButton size="sm" variant="ghost" @click="router.push(`/support-it/devices/${row.kind}/${row.id}`)">
              <EyeIcon class="w-4 h-4" />
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>
  </div>
</template>
