<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFirmwareStore } from '@/stores/firmware.store'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import type { OtaUpdateStatus } from '@/types'

const store = useFirmwareStore()

const statusFilter = ref<OtaUpdateStatus | ''>('')
const deviceKindFilter = ref('')

const columns = [
  { key: 'deviceName', label: 'Terminal' },
  { key: 'deviceKind', label: 'Type' },
  { key: 'firmwareVersion', label: 'Version' },
  { key: 'triggeredBy', label: 'Declenchement' },
  { key: 'status', label: 'Statut' },
  { key: 'startedAt', label: 'Debut' },
  { key: 'completedAt', label: 'Fin' },
  { key: 'errorMessage', label: 'Erreur' },
]

const statusVariant: Record<OtaUpdateStatus, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  success: 'success',
  in_progress: 'info',
  pending: 'warning',
  failed: 'danger',
  skipped: 'default',
}

const statusLabel: Record<OtaUpdateStatus, string> = {
  success: 'Succes',
  in_progress: 'En cours',
  pending: 'En attente',
  failed: 'Echec',
  skipped: 'Ignore',
}

onMounted(() => loadData())

async function loadData() {
  const params: Record<string, unknown> = {}
  if (statusFilter.value) params.status = statusFilter.value
  if (deviceKindFilter.value) params.deviceKind = deviceKindFilter.value
  await store.fetchLogs(params)
}

function formatDatetime(d?: string) {
  if (!d) return '-'
  return new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Historique des mises a jour</h1>

    <AppCard>
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <select
          v-model="deviceKindFilter"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="loadData"
        >
          <option value="">Tous les types</option>
          <option value="rfid">RFID</option>
          <option value="biometric">Biometrique</option>
        </select>

        <select
          v-model="statusFilter"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="loadData"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="in_progress">En cours</option>
          <option value="success">Succes</option>
          <option value="failed">Echec</option>
          <option value="skipped">Ignore</option>
        </select>

        <AppButton variant="ghost" size="sm" @click="loadData">Actualiser</AppButton>
      </div>

      <DataTable :columns="columns" :data="store.updateLogs" :loading="store.isLoading">
        <template #deviceKind="{ row }">
          <AppBadge variant="info">{{ row.deviceKind === 'rfid' ? 'RFID' : 'Biometrique' }}</AppBadge>
        </template>
        <template #firmwareVersion="{ row }">
          <span class="font-mono text-sm">{{ row.firmwareVersion || '-' }}</span>
        </template>
        <template #triggeredBy="{ row }">
          <AppBadge :variant="row.triggeredBy === 'auto' ? 'info' : 'default'">
            {{ row.triggeredBy === 'auto' ? 'Automatique' : 'Manuel' }}
          </AppBadge>
        </template>
        <template #status="{ row }">
          <AppBadge :variant="statusVariant[row.status as OtaUpdateStatus] ?? 'default'">
            {{ statusLabel[row.status as OtaUpdateStatus] ?? row.status }}
          </AppBadge>
        </template>
        <template #startedAt="{ row }">{{ formatDatetime(row.startedAt) }}</template>
        <template #completedAt="{ row }">{{ formatDatetime(row.completedAt) }}</template>
        <template #errorMessage="{ row }">
          <span v-if="row.errorMessage" class="text-xs text-red-600">{{ row.errorMessage }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>
      </DataTable>

      <div v-if="store.pagination.totalPages > 1" class="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>Page {{ store.pagination.currentPage }} / {{ store.pagination.totalPages }} — {{ store.pagination.total }} entrees</span>
        <div class="flex gap-2">
          <AppButton
            variant="ghost"
            size="sm"
            :disabled="store.pagination.currentPage <= 1"
            @click="store.fetchLogs({ page: store.pagination.currentPage - 1 })"
          >
            Precedent
          </AppButton>
          <AppButton
            variant="ghost"
            size="sm"
            :disabled="store.pagination.currentPage >= store.pagination.totalPages"
            @click="store.fetchLogs({ page: store.pagination.currentPage + 1 })"
          >
            Suivant
          </AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>
