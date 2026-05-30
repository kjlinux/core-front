<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useRfidDeviceStore } from '@/stores/rfid-device.store'
import { useCompanyStore } from '@/stores/company.store'
import { useSiteStore } from '@/stores/site.store'
import { usePermissions } from '@/composables/usePermissions'
import { useServerTable } from '@/composables/useServerTable'
import { useToast } from '@/composables/useToast'
import { mqttApi } from '@/services/api/mqtt.api'
import type { DeviceCommand } from '@/services/api/mqtt.api'
import { rfidDeviceApi } from '@/services/api/rfid-device.api'
import { deriveDeviceOnline } from '@/utils/device-status'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import type { TableColumn } from '@/types/common'
import {
  EyeIcon,
  TrashIcon,
  ArrowPathRoundedSquareIcon,
  PowerIcon,
  SunIcon,
  MoonIcon,
  SignalIcon,
  WifiIcon,
  NoSymbolIcon,
} from '@heroicons/vue/24/outline'
import { sortByRecent } from '@/utils/sort'

const { t } = useI18n()
const router = useRouter()
const deviceStore = useRfidDeviceStore()
const companyStore = useCompanyStore()
const siteStore = useSiteStore()
const permissions = usePermissions()
const toast = useToast()

const showAddModal = ref(false)
const isSubmitting = ref(false)
const sendingCommand = ref<string | null>(null)

const { filters, search, applyFilters, handlePageChange, reload } = useServerTable({
  initialFilters: { companyId: '', status: '' as '' | 'online' | 'offline' },
  fetcher: (p) =>
    deviceStore.fetchDevices({
      page: p.page,
      perPage: p.perPage,
      companyId: p.companyId || undefined,
      status: p.status || undefined,
      search: p.search || undefined,
    }),
})

const newDevice = ref({
  name: '',
  serialNumber: '',
  companyId: '',
  siteId: '',
  isOnline: false,
})

function generateSerialNumber(prefix: string, devices: { serialNumber: string }[]): string {
  const year = new Date().getFullYear()
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`)
  let max = 0
  for (const d of devices) {
    const match = d.serialNumber.match(pattern)
    if (match) max = Math.max(max, parseInt(match[1]!))
  }
  return `${prefix}-${year}-${String(max + 1).padStart(3, '0')}`
}

// Le numéro de série est calculé à partir de la liste COMPLÈTE des devices
// (la table n'affiche qu'une page server-side), donc on récupère tout au moment d'ouvrir le modal.
async function openAddModal() {
  let all: { serialNumber: string }[] = deviceStore.devices
  try {
    const response = await rfidDeviceApi.getAll({ perPage: 1000 })
    all = response.data
  } catch {
    // fallback sur la page courante si la récupération échoue
  }
  newDevice.value.serialNumber = generateSerialNumber('RFID', all)
  showAddModal.value = true
}

const togglingStatus = ref<string | null>(null)

async function handleToggleStatus(device: { id: string; isOnline: boolean }) {
  togglingStatus.value = device.id
  const goingOnline = !device.isOnline
  try {
    await deviceStore.updateDevice(device.id, { isOnline: goingOnline })
    toast.showSuccess(goingOnline ? t('devices.setOnlineSuccess') : t('devices.setOfflineSuccess'))
  } catch {
    toast.showError(t('devices.statusChangeError'))
  } finally {
    togglingStatus.value = null
  }
}

const statusOptions = computed(() => [
  { label: t('common.all'), value: '' },
  { label: t('devices.online'), value: 'online' },
  { label: t('devices.offline'), value: 'offline' },
])

const companyOptions = computed(() => [
  { label: t('companies.allCompanies'), value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
])

const siteOptionsForForm = computed(() => {
  if (!newDevice.value.companyId) return []
  return siteStore.sites
    .filter(s => s.companyId === newDevice.value.companyId)
    .map(s => ({ label: s.name, value: s.id }))
})

const tableData = computed(() => sortByRecent(deviceStore.devices))

const canManage = computed(() => permissions.isAdminOrSuperOrTech.value)

const deviceColumns = computed<TableColumn[]>(() => [
  { key: 'serialNumber', label: t('devices.serialNumber'), sortable: true },
  { key: 'name', label: t('devices.name'), sortable: true },
  { key: 'siteName', label: t('devices.site'), sortable: true },
  { key: 'status', label: t('devices.status'), sortable: false },
  { key: 'lastPingAt', label: t('devices.lastPing'), sortable: true },
  { key: 'commands', label: t('devices.commands'), sortable: false },
  { key: 'actions', label: t('devices.actions'), sortable: false, align: 'right' as const },
])

const commandLabels = computed<Record<string, string>>(() => ({
  RESET: t('devices.reset'),
  REBOOT: t('devices.reboot'),
  WAKE_UP: t('devices.wake'),
  SLEEP: t('devices.sleep'),
  STATUS: t('devices.statusCmd'),
}))

function formatDate(date: string) {
  return new Date(date).toLocaleString('fr-FR')
}

async function handleCommand(deviceId: string, command: DeviceCommand) {
  sendingCommand.value = `${deviceId}-${command}`
  try {
    await mqttApi.sendCommand(deviceId, 'rfid', command)
    toast.showSuccess(t('devices.commandSent', { label: commandLabels.value[command] }))
  } catch {
    toast.showError(t('devices.commandError', { label: commandLabels.value[command] }))
  } finally {
    sendingCommand.value = null
  }
}

async function handleDelete(id: string) {
  try {
    await deviceStore.deleteDevice(id)
    toast.showSuccess(t('devices.deletedSuccess'))
  } catch {
    toast.showError(t('devices.deleteError'))
  }
}

async function handleAddDevice() {
  if (!newDevice.value.name || !newDevice.value.companyId || !newDevice.value.siteId) {
    toast.showError(t('devices.fillRequired'))
    return
  }
  isSubmitting.value = true
  try {
    await deviceStore.registerDevice(newDevice.value)
    toast.showSuccess(t('devices.addedSuccess'))
    showAddModal.value = false
    await reload()
    newDevice.value = { name: '', serialNumber: '', companyId: '', siteId: '', isOnline: false }
  } catch {
    toast.showError(t('devices.addError'))
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    companyStore.fetchCompanies({ perPage: 100 }),
    siteStore.fetchSites({ perPage: 200 }),
  ])
  await reload()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('devices.rfidTitle') }}</h1>
        <p class="text-sm text-gray-500 mt-1">{{ t('devices.rfidSubtitle') }}</p>
      </div>
      <AppButton v-if="canManage" variant="primary" @click="openAddModal">
        {{ t('devices.addDevice') }}
      </AppButton>
    </div>

    <AppCard>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <AppInput v-model="search" :placeholder="t('common.search') || 'Rechercher...'" :label="t('common.search') || 'Rechercher'" />
        <AppSelect v-model="filters.companyId" :options="companyOptions" :label="t('devices.companyLabel')" @update:model-value="applyFilters" />
        <AppSelect v-model="filters.status" :options="statusOptions" :label="t('devices.status')" @update:model-value="applyFilters" />
      </div>

      <DataTable
        :columns="deviceColumns"
        :data="tableData"
        :loading="deviceStore.isLoading"
        :pagination="deviceStore.pagination"
        default-sort-column="name"
        default-sort-direction="desc"
        :empty-message="t('devices.notFound')"
        @row-click="(row) => router.push(`/pointage-rfid/devices/${row.id}`)"
        @page-change="handlePageChange"
      >
        <template #status="{ row }">
          <AppBadge :variant="deriveDeviceOnline(row.lastPingAt) ? 'success' : 'danger'">
            {{ deriveDeviceOnline(row.lastPingAt) ? t('devices.online') : t('devices.offline') }}
          </AppBadge>
        </template>
        <template #lastPingAt="{ row }">
          {{ formatDate(row.lastPingAt) }}
        </template>
        <template #commands="{ row }">
          <div class="flex gap-1" v-if="canManage" @click.stop>
            <AppButton size="sm" variant="ghost" :disabled="sendingCommand === `${row.id}-RESET`" :title="t('devices.reset')" @click="handleCommand(row.id, 'RESET')">
              <ArrowPathRoundedSquareIcon class="w-4 h-4" />
            </AppButton>
            <AppButton size="sm" variant="ghost" :disabled="sendingCommand === `${row.id}-REBOOT`" :title="t('devices.reboot')" @click="handleCommand(row.id, 'REBOOT')">
              <PowerIcon class="w-4 h-4" />
            </AppButton>
            <AppButton size="sm" variant="ghost" :disabled="sendingCommand === `${row.id}-WAKE_UP`" :title="t('devices.wake')" @click="handleCommand(row.id, 'WAKE_UP')">
              <SunIcon class="w-4 h-4" />
            </AppButton>
            <AppButton size="sm" variant="ghost" :disabled="sendingCommand === `${row.id}-SLEEP`" :title="t('devices.sleep')" @click="handleCommand(row.id, 'SLEEP')">
              <MoonIcon class="w-4 h-4" />
            </AppButton>
            <AppButton size="sm" variant="ghost" :disabled="sendingCommand === `${row.id}-STATUS`" :title="t('devices.statusCmd')" @click="handleCommand(row.id, 'STATUS')">
              <SignalIcon class="w-4 h-4" />
            </AppButton>
          </div>
        </template>
        <template #actions="{ row }">
          <div class="flex gap-2" @click.stop>
            <AppButton size="sm" variant="ghost" @click="router.push(`/pointage-rfid/devices/${row.id}`)" :title="t('devices.view')">
              <EyeIcon class="w-4 h-4" />
            </AppButton>
            <AppButton
              v-if="canManage"
              size="sm"
              variant="ghost"
              :class="row.isOnline ? 'text-green-600 hover:text-red-600' : 'text-gray-400 hover:text-green-600'"
              :disabled="togglingStatus === row.id"
              :title="row.isOnline ? t('devices.setOffline') : t('devices.setOnline')"
              @click="handleToggleStatus(row)"
            >
              <WifiIcon v-if="row.isOnline" class="w-4 h-4" />
              <NoSymbolIcon v-else class="w-4 h-4" />
            </AppButton>
            <AppButton v-if="canManage" size="sm" variant="ghost" class="text-red-600 hover:text-red-700" @click="handleDelete(row.id)" :title="t('devices.deleteBtn')">
              <TrashIcon class="w-4 h-4" />
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>

    <AppModal v-model="showAddModal" :title="t('devices.addRfidTitle')" size="md">
      <div class="space-y-4">
        <AppInput v-model="newDevice.name" :label="t('devices.deviceName')" :placeholder="t('devices.deviceNamePlaceholder')" :required="true" />
        <div>
          <p class="text-sm font-medium text-gray-700 mb-1">{{ t('devices.serialLabel') }}</p>
          <p class="font-mono text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">{{ newDevice.serialNumber }}</p>
        </div>
        <AppSelect
          v-model="newDevice.companyId"
          :label="t('devices.companyLabel')"
          :options="companyOptions"
          :required="true"
          @update:model-value="newDevice.siteId = ''"
        />
        <AppSelect
          v-model="newDevice.siteId"
          :label="t('devices.siteLabel')"
          :options="siteOptionsForForm"
          :placeholder="t('devices.selectSite')"
          :required="true"
          :disabled="!newDevice.companyId"
        />
        <div class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
          <div>
            <p class="text-sm font-medium text-gray-700">{{ t('devices.initialStatus') }}</p>
            <p class="text-xs text-gray-500">{{ newDevice.isOnline ? t('devices.online') : t('devices.offline') }}</p>
          </div>
          <button
            type="button"
            :class="[
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
              newDevice.isOnline ? 'bg-green-500' : 'bg-gray-300'
            ]"
            @click="newDevice.isOnline = !newDevice.isOnline"
          >
            <span
              :class="[
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                newDevice.isOnline ? 'translate-x-5' : 'translate-x-0'
              ]"
            />
          </button>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showAddModal = false">{{ t('common.cancel') }}</AppButton>
          <AppButton variant="primary" :loading="isSubmitting" @click="handleAddDevice">{{ t('devices.addBtn') }}</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
