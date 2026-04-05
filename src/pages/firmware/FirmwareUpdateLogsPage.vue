<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFirmwareStore } from '@/stores/firmware.store'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import type { OtaUpdateStatus } from '@/types'

const { t } = useI18n()
const store = useFirmwareStore()

const statusFilter = ref<OtaUpdateStatus | ''>('')
const deviceKindFilter = ref('')

const columns = computed(() => [
  { key: 'deviceName', label: t('firmware.terminal') },
  { key: 'deviceKind', label: t('firmware.deviceKind') },
  { key: 'firmwareVersion', label: t('firmware.version') },
  { key: 'triggeredBy', label: t('firmware.triggerType') },
  { key: 'status', label: t('common.status') },
  { key: 'startedAt', label: t('firmware.start') },
  { key: 'completedAt', label: t('firmware.end') },
  { key: 'errorMessage', label: t('firmware.errorLabel') },
])

const statusVariant: Record<OtaUpdateStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  success: 'success',
  in_progress: 'info',
  pending: 'warning',
  failed: 'danger',
  skipped: 'neutral',
}

const statusLabel = computed<Record<OtaUpdateStatus, string>>(() => ({
  success: t('firmware.status.success'),
  in_progress: t('firmware.status.in_progress'),
  pending: t('firmware.status.pending'),
  failed: t('firmware.status.failed'),
  skipped: t('firmware.status.skipped'),
}))

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
    <h1 class="text-2xl font-bold text-gray-900">{{ t('firmware.logsTitle') }}</h1>

    <AppCard>
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <select
          v-model="deviceKindFilter"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="loadData"
        >
          <option value="">{{ t('firmware.allTypes') }}</option>
          <option value="rfid">{{ t('firmware.deviceKinds.rfid') }}</option>
          <option value="biometric">{{ t('firmware.deviceKinds.biometric') }}</option>
        </select>

        <select
          v-model="statusFilter"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="loadData"
        >
          <option value="">{{ t('firmware.allStatuses') }}</option>
          <option value="pending">{{ t('firmware.status.pending') }}</option>
          <option value="in_progress">{{ t('firmware.status.in_progress') }}</option>
          <option value="success">{{ t('firmware.status.success') }}</option>
          <option value="failed">{{ t('firmware.status.failed') }}</option>
          <option value="skipped">{{ t('firmware.status.skipped') }}</option>
        </select>

        <AppButton variant="ghost" size="sm" @click="loadData">{{ t('common.refresh') }}</AppButton>
      </div>

      <DataTable :columns="columns" :data="store.updateLogs" :loading="store.isLoading">
        <template #deviceKind="{ row }">
          <AppBadge variant="info">{{ row.deviceKind === 'rfid' ? t('firmware.deviceKinds.rfid') : t('firmware.deviceKinds.biometric') }}</AppBadge>
        </template>
        <template #firmwareVersion="{ row }">
          <span class="font-mono text-sm">{{ row.firmwareVersion || '-' }}</span>
        </template>
        <template #triggeredBy="{ row }">
          <AppBadge :variant="row.triggeredBy === 'auto' ? 'info' : 'neutral'">
            {{ row.triggeredBy === 'auto' ? t('firmware.triggeredBy.auto') : t('firmware.triggeredBy.manual') }}
          </AppBadge>
        </template>
        <template #status="{ row }">
          <AppBadge :variant="statusVariant[row.status as OtaUpdateStatus] ?? 'neutral'">
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
        <span>{{ t('common.page') }} {{ store.pagination.currentPage }} / {{ store.pagination.totalPages }} — {{ store.pagination.total }} {{ t('firmware.entries') }}</span>
        <div class="flex gap-2">
          <AppButton
            variant="ghost"
            size="sm"
            :disabled="store.pagination.currentPage <= 1"
            @click="store.fetchLogs({ page: store.pagination.currentPage - 1 })"
          >
            {{ t('common.previous') }}
          </AppButton>
          <AppButton
            variant="ghost"
            size="sm"
            :disabled="store.pagination.currentPage >= store.pagination.totalPages"
            @click="store.fetchLogs({ page: store.pagination.currentPage + 1 })"
          >
            {{ t('common.next') }}
          </AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>
