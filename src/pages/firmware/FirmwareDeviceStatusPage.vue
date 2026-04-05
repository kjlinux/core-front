<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFirmwareStore } from '@/stores/firmware.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import type { DeviceFirmwareStatus, DeviceKind } from '@/types'

const { t } = useI18n()
const store = useFirmwareStore()
const permissions = usePermissions()
const toast = useToast()

const deviceKindFilter = ref<DeviceKind | ''>('')
const selectedDevice = ref<DeviceFirmwareStatus | null>(null)
const selectedFirmwareVersionId = ref('')

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

const compatibleVersions = computed(() => {
  if (!selectedDevice.value) return []
  return store.versions.filter((v) => v.deviceKind === selectedDevice.value!.deviceKind)
})

onMounted(async () => {
  await Promise.all([store.fetchDeviceStatuses(), store.fetchVersions({})])
})

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
    await store.fetchDeviceStatuses()
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
    <h1 class="text-2xl font-bold text-gray-900">{{ t('firmware.statusTitle') }}</h1>

    <AppCard>
      <div class="mb-4 flex items-center gap-4">
        <select
          v-model="deviceKindFilter"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{{ t('firmware.allTypes') }}</option>
          <option value="rfid">{{ t('firmware.deviceKinds.rfid') }}</option>
          <option value="biometric">{{ t('firmware.deviceKinds.biometric') }}</option>
        </select>
      </div>

      <DataTable :columns="columns" :data="filteredStatuses" :loading="store.isLoading">
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
          — {{ t('firmware.currentVersionLabel') }} <span class="font-mono text-sm">{{ selectedDevice.currentVersion || t('firmware.unknown') }}</span>
        </p>

        <div class="mb-6">
          <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('firmware.chooseTarget') }}</label>
          <select
            v-model="selectedFirmwareVersionId"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>{{ t('firmware.selectVersion') }}</option>
            <option v-for="v in compatibleVersions" :key="v.id" :value="v.id">
              {{ v.version }}{{ v.isAutoUpdate ? ' ' + t('firmware.autoSuffix') : '' }}
            </option>
          </select>
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
