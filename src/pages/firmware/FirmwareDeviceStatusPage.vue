<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFirmwareStore } from '@/stores/firmware.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import type { DeviceFirmwareStatus, FirmwareDeviceKind } from '@/types'
import { sortByRecent } from '@/utils/sort'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const store = useFirmwareStore()
const permissions = usePermissions()
const toast = useToast()

const deviceKindFilter = ref<FirmwareDeviceKind | ''>('')
const selectedDevice = ref<DeviceFirmwareStatus | null>(null)
const selectedFirmwareVersionId = ref('')

const deviceKindOptions = computed(() => [
  { value: '', label: t('firmware.allTypes') },
  { value: 'rfid', label: t('firmware.deviceKinds.rfid') },
  { value: 'biometric', label: t('firmware.deviceKinds.biometric') },
])

const columns = computed(() => [
  { key: 'deviceName', label: t('firmware.terminal') },
  { key: 'deviceKind', label: t('firmware.deviceKind') },
  { key: 'currentVersion', label: t('firmware.currentVersion') },
  { key: 'targetVersion', label: t('firmware.targetVersion') },
  { key: 'updateStatus', label: t('common.status') },
  { key: 'lastUpdatedAt', label: t('firmware.lastUpdate') },
  { key: 'actions', label: t('common.actions') },
])

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  success: 'success',
  in_progress: 'info',
  pending: 'warning',
  failed: 'danger',
  skipped: 'neutral',
}

const statusLabel = computed<Record<string, string>>(() => ({
  success: t('firmware.upToDate'),
  in_progress: t('firmware.inProgress'),
  pending: t('firmware.pending'),
  failed: t('firmware.failed'),
  skipped: t('firmware.skipped'),
}))

const filteredStatuses = computed(() => {
  if (!deviceKindFilter.value) return store.deviceStatuses
  return store.deviceStatuses.filter((d) => d.deviceKind === deviceKindFilter.value)
})

const currentPage = ref(1)
const perPage = ref(15)

const pagedStatuses = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return sortByRecent(filteredStatuses.value).slice(start, start + perPage.value)
})

const paginationObj = computed(() => {
  const total = filteredStatuses.value.length
  return { currentPage: currentPage.value, totalPages: Math.ceil(total / perPage.value) || 1, perPage: perPage.value, total }
})

const handlePageChange = (page: number) => { currentPage.value = page }

watch(deviceKindFilter, () => { currentPage.value = 1 })

const compatibleVersions = computed(() => {
  if (!selectedDevice.value) return []
  return store.versions.filter((v) => v.deviceKind === selectedDevice.value!.deviceKind)
})

const compatibleVersionOptions = computed(() => [
  { value: '', label: t('firmware.selectVersion') },
  ...compatibleVersions.value.map((v) => ({
    value: v.id,
    label: v.version + (v.isAutoUpdate ? ' ' + t('firmware.autoSuffix') : ''),
  })),
])

// Polling adaptatif : 5s tant qu'une OTA est en cours, 30s sinon.
const POLL_FAST_MS = 5000
const POLL_IDLE_MS = 30000
let pollTimer: ReturnType<typeof setTimeout> | null = null

const hasActiveOta = computed(() =>
  store.deviceStatuses.some((d) => d.updateStatus === 'pending' || d.updateStatus === 'in_progress')
)

async function scheduleNextPoll() {
  if (pollTimer) clearTimeout(pollTimer)
  const delay = hasActiveOta.value ? POLL_FAST_MS : POLL_IDLE_MS
  pollTimer = setTimeout(async () => {
    try {
      await store.fetchDeviceStatuses({ perPage: 1000 })
    } finally {
      scheduleNextPoll()
    }
  }, delay)
}

onMounted(async () => {
  await Promise.all([store.fetchDeviceStatuses({ perPage: 1000 }), store.fetchVersions({ perPage: 1000 })])
  scheduleNextPoll()
})

onUnmounted(() => {
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = null
  store.stopProgressPolling()
})

// Compteurs globaux par statut (toujours visibles)
const statusCounts = computed(() => {
  const s = { success: 0, in_progress: 0, pending: 0, failed: 0, skipped: 0 }
  for (const d of filteredStatuses.value) {
    const k = d.updateStatus as keyof typeof s
    if (k in s) s[k]++
  }
  return s
})

const totalDevices = computed(() => filteredStatuses.value.length)
const progressPercent = computed(() => {
  if (!totalDevices.value) return 0
  return Math.round((statusCounts.value.success / totalDevices.value) * 100)
})

const activeCompanyProgress = computed(() => store.companyUpdateProgress)

async function retryAllFailed() {
  const versionId = activeCompanyProgress.value?.devices?.[0]?.firmwareVersionId
    ?? store.latestPublishedVersion?.id
  if (!versionId) {
    toast.error(t('firmware.triggerError'))
    return
  }
  try {
    await store.retryFailed(versionId)
    toast.success(t('firmware.triggeredSuccess'))
    await store.fetchDeviceStatuses({ perPage: 1000 })
  } catch {
    toast.error(t('firmware.triggerError'))
  }
}

function openUpdateModal(device: DeviceFirmwareStatus) {
  selectedDevice.value = device
  selectedFirmwareVersionId.value = ''
}

async function confirmUpdate() {
  if (!selectedDevice.value || !selectedFirmwareVersionId.value) return
  try {
    await store.triggerUpdate(selectedDevice.value.deviceId, selectedFirmwareVersionId.value)
    toast.success(t('firmware.triggeredSuccess'))
    selectedDevice.value = null
    await store.fetchDeviceStatuses({ perPage: 1000 })
  } catch {
    toast.error(t('firmware.triggerError'))
  }
}

function formatDate(d?: string) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('fr-FR')
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ t('firmware.statusTitle') }}</h1>

    <!-- Vue d'ensemble OTA : progression + compteurs par statut -->
    <AppCard>
      <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Etat global du parc</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {{ progressPercent }}% a jour
              <span class="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400">({{ statusCounts.success }} / {{ totalDevices }})</span>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <AppButton
              v-if="permissions.isSetupRole.value && statusCounts.failed > 0"
              variant="ghost"
              size="sm"
              @click="retryAllFailed"
            >
              <ArrowPathIcon class="mr-1 h-4 w-4" />
              Reessayer les echecs ({{ statusCounts.failed }})
            </AppButton>
          </div>
        </div>

        <!-- Barre de progression segmentee -->
        <div
          class="flex h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
          role="progressbar"
          :aria-valuenow="progressPercent"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            class="h-full bg-green-500 transition-all"
            :style="{ width: totalDevices ? `${(statusCounts.success / totalDevices) * 100}%` : '0%' }"
          />
          <div
            class="h-full bg-blue-500 transition-all"
            :style="{ width: totalDevices ? `${(statusCounts.in_progress / totalDevices) * 100}%` : '0%' }"
          />
          <div
            class="h-full bg-amber-500 transition-all"
            :style="{ width: totalDevices ? `${(statusCounts.pending / totalDevices) * 100}%` : '0%' }"
          />
          <div
            class="h-full bg-red-500 transition-all"
            :style="{ width: totalDevices ? `${(statusCounts.failed / totalDevices) * 100}%` : '0%' }"
          />
        </div>

        <!-- Pastilles compteurs -->
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div class="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-900/20">
            <p class="text-xs font-medium text-green-700 dark:text-green-300">{{ statusLabel.success }}</p>
            <p class="text-xl font-bold text-green-700 dark:text-green-200">{{ statusCounts.success }}</p>
          </div>
          <div class="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-900/20">
            <p class="text-xs font-medium text-blue-700 dark:text-blue-300">{{ statusLabel.in_progress }}</p>
            <p class="text-xl font-bold text-blue-700 dark:text-blue-200">{{ statusCounts.in_progress }}</p>
          </div>
          <div class="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-900/20">
            <p class="text-xs font-medium text-amber-700 dark:text-amber-300">{{ statusLabel.pending }}</p>
            <p class="text-xl font-bold text-amber-700 dark:text-amber-200">{{ statusCounts.pending }}</p>
          </div>
          <div class="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-900/20">
            <p class="text-xs font-medium text-red-700 dark:text-red-300">{{ statusLabel.failed }}</p>
            <p class="text-xl font-bold text-red-700 dark:text-red-200">{{ statusCounts.failed }}</p>
          </div>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            <p class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ statusLabel.skipped }}</p>
            <p class="text-xl font-bold text-gray-700 dark:text-gray-200">{{ statusCounts.skipped }}</p>
          </div>
        </div>

        <!-- Progression OTA company-wide en cours (si polling actif) -->
        <div
          v-if="activeCompanyProgress"
          class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm dark:border-blue-900 dark:bg-blue-900/20"
        >
          <div class="flex items-center justify-between">
            <span class="font-medium text-blue-700 dark:text-blue-300">
              Mise a jour en masse en cours
            </span>
            <span class="font-mono text-blue-700 dark:text-blue-200">
              {{ activeCompanyProgress.success }} / {{ activeCompanyProgress.total }}
            </span>
          </div>
        </div>
      </div>
    </AppCard>

    <AppCard>
      <div class="mb-4 flex items-center gap-4">
        <div class="w-64">
          <AppSelect v-model="deviceKindFilter" :options="deviceKindOptions" />
        </div>
      </div>

      <DataTable :columns="columns" :data="pagedStatuses" :loading="store.isLoading" :pagination="paginationObj" @page-change="handlePageChange">
        <template #deviceKind="{ row }">
          <AppBadge variant="info">{{ row.deviceKind === 'rfid' ? t('firmware.deviceKinds.rfid') : t('firmware.deviceKinds.biometric') }}</AppBadge>
        </template>
        <template #currentVersion="{ row }">
          <span class="font-mono text-sm">{{ row.currentVersion || '-' }}</span>
        </template>
        <template #targetVersion="{ row }">
          <span class="font-mono text-sm text-blue-600">{{ row.targetVersion || '-' }}</span>
        </template>
        <template #updateStatus="{ row }">
          <AppBadge :variant="statusVariant[row.updateStatus] ?? 'neutral'">
            {{ statusLabel[row.updateStatus] ?? row.updateStatus }}
          </AppBadge>
        </template>
        <template #lastUpdatedAt="{ row }">{{ formatDate(row.lastUpdatedAt) }}</template>
        <template #actions="{ row }">
          <div class="flex items-center gap-2" @click.stop>
            <AppButton
              v-if="permissions.isSetupRole.value"
              size="sm"
              variant="primary"
              @click="openUpdateModal(row)"
            >
              {{ t('firmware.updateBtn') }}
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>

    <!-- Modal declenchement OTA -->
    <div
      v-if="selectedDevice"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="selectedDevice = null"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 class="mb-1 text-lg font-semibold text-gray-900">{{ t('firmware.updateModal') }}</h3>
        <p class="mb-4 text-sm text-gray-600">
          {{ t('firmware.terminalLabel') }} <span class="font-medium">{{ selectedDevice.deviceName }}</span>
          - {{ t('firmware.currentVersionLabel') }} <span class="font-mono text-sm">{{ selectedDevice.currentVersion || t('firmware.unknown') }}</span>
        </p>

        <div class="mb-6">
          <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('firmware.chooseTarget') }}</label>
          <AppSelect v-model="selectedFirmwareVersionId" :options="compatibleVersionOptions" :placeholder="t('firmware.selectVersion')" />
          <p v-if="compatibleVersions.length === 0" class="mt-1 text-xs text-gray-500">
            {{ t('firmware.noVersionForType') }}
          </p>
        </div>

        <div class="flex justify-end gap-3">
          <AppButton variant="ghost" @click="selectedDevice = null">{{ t('common.cancel') }}</AppButton>
          <AppButton
            variant="primary"
            :disabled="!selectedFirmwareVersionId || store.isLoading"
            @click="confirmUpdate"
          >
            {{ t('firmware.triggerBtn') }}
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
