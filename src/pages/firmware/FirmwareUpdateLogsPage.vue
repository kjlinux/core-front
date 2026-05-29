<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFirmwareStore } from '@/stores/firmware.store'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
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

const deviceKindOptions = computed(() => [
  { value: '', label: t('firmware.allTypes') },
  { value: 'rfid', label: t('firmware.deviceKinds.rfid') },
  { value: 'biometric', label: t('firmware.deviceKinds.biometric') },
])
const statusOptions = computed(() => [
  { value: '', label: t('firmware.allStatuses') },
  { value: 'pending', label: t('firmware.status.pending') },
  { value: 'in_progress', label: t('firmware.status.in_progress') },
  { value: 'success', label: t('firmware.status.success') },
  { value: 'failed', label: t('firmware.status.failed') },
  { value: 'skipped', label: t('firmware.status.skipped') },
])

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
        <div class="w-56">
          <AppSelect v-model="deviceKindFilter" :options="deviceKindOptions" @update:model-value="loadData" />
        </div>
        <div class="w-56">
          <AppSelect v-model="statusFilter" :options="statusOptions" @update:model-value="loadData" />
        </div>

        <AppButton variant="ghost" size="sm" @click="loadData">{{ t('common.refresh') }}</AppButton>
      </div>

      <DataTable
        :columns="columns"
        :data="store.updateLogs"
        :loading="store.isLoading"
        :pagination="store.pagination.totalPages > 0 ? { currentPage: store.pagination.currentPage, totalPages: store.pagination.totalPages, perPage: store.pagination.perPage ?? 20, total: store.pagination.total } : undefined"
        @page-change="(p) => store.fetchLogs({ page: p })"
      >
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
    </AppCard>
  </div>
</template>
