<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBiometricStore } from '@/stores/biometric.store'
import { useCompanyStore } from '@/stores/company.store'
import { useSiteStore } from '@/stores/site.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import { useServerTable } from '@/composables/useServerTable'
import { mqttApi } from '@/services/api/mqtt.api'
import type { DeviceCommand } from '@/services/api/mqtt.api'
import { deriveDeviceOnline } from '@/utils/device-status'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import type { TableColumn } from '@/types/common'
import type { BiometricDevice } from '@/types'
import {
  EyeIcon,
  ArrowPathIcon,
  ArrowPathRoundedSquareIcon,
  PowerIcon,
  SunIcon,
  MoonIcon,
  SignalIcon,
  FingerPrintIcon,
  PlusIcon,
  WifiIcon,
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()
const store = useBiometricStore()
const companyStore = useCompanyStore()
const siteStore = useSiteStore()
const permissions = usePermissions()
const toast = useToast()

const showAddModal = ref(false)
const isSubmitting = ref(false)
const sendingCommand = ref<string | null>(null)

const { filters, search, applyFilters, handlePageChange, reload } = useServerTable({
  initialFilters: {
    companyId: '' as string,
    status: '' as '' | 'online' | 'offline',
  },
  fetcher: (p) =>
    store.fetchDevices({
      page: p.page,
      perPage: p.perPage,
      search: p.search || undefined,
      companyId: p.companyId || undefined,
      isOnline: p.status === '' ? undefined : p.status === 'online',
    }),
})

const newDevice = ref({
  name: '',
  serialNumber: '',
  companyId: '',
  siteId: '',
  firmwareVersion: '',
})

function generateSerialNumber(prefix: string): string {
  const year = new Date().getFullYear()
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`)
  let max = 0
  for (const d of store.devices) {
    const match = d.serialNumber.match(pattern)
    if (match) max = Math.max(max, parseInt(match[1]!))
  }
  return `${prefix}-${year}-${String(max + 1).padStart(3, '0')}`
}

const statusOptions = computed(() => [
  { label: t('biometric.allStatuses'), value: '' },
  { label: t('biometric.online'), value: 'online' },
  { label: t('biometric.offline'), value: 'offline' },
])

const companyOptions = computed(() => [
  { label: t('companies.allCompanies'), value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
])

const addCompanyOptions = computed(() => [
  { label: t('biometric.selectSite'), value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
])

const addSiteOptions = computed(() => {
  if (!newDevice.value.companyId) return [{ label: t('biometric.selectSite'), value: '' }]
  const sites = siteStore.sites.filter((s) => s.companyId === newDevice.value.companyId)
  return [
    { label: t('biometric.selectSite'), value: '' },
    ...sites.map((s) => ({ label: s.name, value: s.id })),
  ]
})

watch(() => newDevice.value.companyId, () => {
  newDevice.value.siteId = ''
})

const deviceColumns = computed<TableColumn[]>(() => [
  { key: 'serialNumber', label: t('biometric.serialNumber'), sortable: true },
  { key: 'name', label: t('biometric.name'), sortable: true },
  { key: 'status', label: t('biometric.status'), sortable: false },
  { key: 'enrolledCount', label: t('biometric.enrolled'), sortable: true, align: 'center' as const },
  { key: 'firmwareVersion', label: t('biometric.firmware'), sortable: true },
  { key: 'lastSyncAt', label: t('biometric.lastSync'), sortable: true },
  { key: 'commands', label: t('biometric.commands'), sortable: false },
  { key: 'actions', label: t('biometric.actions'), sortable: false, align: 'right' as const },
])

const canManage = computed(() => permissions.isAdminOrSuperOrTech.value)

const commandLabels = computed<Record<string, string>>(() => ({
  RESET: t('biometric.reset'),
  REBOOT: t('biometric.reboot'),
  WAKE_UP: t('biometric.wake'),
  SLEEP: t('biometric.sleep'),
  STATUS: t('biometric.statusCmd'),
  ENROLE: t('biometric.enrollment'),
}))

function formatDate(date: string) {
  return new Date(date).toLocaleString('fr-FR')
}

async function handleCommand(deviceId: string, command: DeviceCommand) {
  sendingCommand.value = `${deviceId}-${command}`
  try {
    await mqttApi.sendCommand(deviceId, 'biometric', command)
    toast.showSuccess(`${t('devices.commandSent', { label: commandLabels.value[command] })}`)
  } catch {
    toast.showError(`${t('devices.commandError', { label: commandLabels.value[command] })}`)
  } finally {
    sendingCommand.value = null
  }
}

async function handleToggleOnline(device: BiometricDevice) {
  const goingOnline = !device.isOnline
  try {
    await store.setDeviceOnline(device.id, goingOnline)
    toast.showSuccess(goingOnline ? t('devices.setOnlineSuccess') : t('devices.setOfflineSuccess'))
  } catch {
    toast.showError(t('devices.statusChangeError'))
  }
}

async function handleSync(device: BiometricDevice) {
  try {
    await store.syncDevice(device.id)
    toast.showSuccess(t('biometric.syncLaunched') + ' ' + device.name)
  } catch {
    toast.showError(t('devices.statusChangeError'))
  }
}

async function handleAddDevice() {
  if (!newDevice.value.name || !newDevice.value.companyId || !newDevice.value.siteId) {
    toast.showError(t('devices.fillRequired'))
    return
  }
  isSubmitting.value = true
  try {
    await store.createDevice(newDevice.value)
    toast.showSuccess(t('devices.addedSuccess'))
    showAddModal.value = false
    newDevice.value = { name: '', serialNumber: '', companyId: '', siteId: '', firmwareVersion: '' }
    await reload()
  } catch {
    toast.showError(t('devices.addError'))
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([companyStore.fetchCompanies({ perPage: 200 }), siteStore.fetchSites({ perPage: 200 })])
  await reload()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('biometric.devicesTitle') }}</h1>
        <p class="text-sm text-gray-500 mt-1">{{ t('biometric.devicesDesc') }}</p>
      </div>
      <AppButton v-if="canManage" variant="primary" @click="() => { newDevice.serialNumber = generateSerialNumber('BIO'); showAddModal = true }">
        <PlusIcon class="w-4 h-4 mr-1" />
        {{ t('biometric.addDevice') }}
      </AppButton>
    </div>

    <AppCard>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <AppInput v-model="search" :placeholder="t('common.search') || 'Rechercher...'" :label="t('common.search') || 'Rechercher'" />
        <AppSelect v-model="filters.companyId" :options="companyOptions" :label="t('biometric.companyLabel')" @update:model-value="applyFilters" />
        <AppSelect v-model="filters.status" :options="statusOptions" :label="t('biometric.status')" @update:model-value="applyFilters" />
      </div>

      <DataTable
        :columns="deviceColumns"
        :data="store.devices"
        :loading="store.isLoading"
        :pagination="store.devicesPagination"
        :empty-message="t('biometric.notFound')"
        @row-click="(row) => router.push(`/biometrique/devices/${row.id}`)"
        @page-change="handlePageChange"
      >
        <template #status="{ row }">
          <AppBadge :variant="deriveDeviceOnline(row.lastSyncAt) ? 'success' : 'danger'">
            {{ deriveDeviceOnline(row.lastSyncAt) ? t('biometric.online') : t('biometric.offline') }}
          </AppBadge>
        </template>
        <template #lastSyncAt="{ row }">{{ formatDate(row.lastSyncAt) }}</template>
        <template #commands="{ row }">
          <div class="flex gap-1" v-if="canManage" @click.stop>
            <AppButton size="sm" variant="ghost" :disabled="sendingCommand === `${row.id}-RESET`" :title="t('biometric.reset')" @click="handleCommand(row.id, 'RESET')">
              <ArrowPathRoundedSquareIcon class="w-4 h-4" />
            </AppButton>
            <AppButton size="sm" variant="ghost" :disabled="sendingCommand === `${row.id}-REBOOT`" :title="t('biometric.reboot')" @click="handleCommand(row.id, 'REBOOT')">
              <PowerIcon class="w-4 h-4" />
            </AppButton>
            <AppButton size="sm" variant="ghost" :disabled="sendingCommand === `${row.id}-WAKE_UP`" :title="t('biometric.wake')" @click="handleCommand(row.id, 'WAKE_UP')">
              <SunIcon class="w-4 h-4" />
            </AppButton>
            <AppButton size="sm" variant="ghost" :disabled="sendingCommand === `${row.id}-SLEEP`" :title="t('biometric.sleep')" @click="handleCommand(row.id, 'SLEEP')">
              <MoonIcon class="w-4 h-4" />
            </AppButton>
            <AppButton size="sm" variant="ghost" :disabled="sendingCommand === `${row.id}-STATUS`" :title="t('biometric.statusCmd')" @click="handleCommand(row.id, 'STATUS')">
              <SignalIcon class="w-4 h-4" />
            </AppButton>
            <AppButton size="sm" variant="ghost" :title="t('biometric.enrollment')" @click="router.push({ name: 'bio-enrollment-new', query: { deviceId: row.id } })">
              <FingerPrintIcon class="w-4 h-4" />
            </AppButton>
          </div>
        </template>
        <template #actions="{ row }">
          <div class="flex gap-2" @click.stop>
            <AppButton size="sm" variant="ghost" @click="router.push(`/biometrique/devices/${row.id}`)" :title="t('biometric.view')">
              <EyeIcon class="w-4 h-4" />
            </AppButton>
            <AppButton v-if="canManage" size="sm" variant="ghost" @click="handleSync(row)" :title="t('biometric.sync')">
              <ArrowPathIcon class="w-4 h-4" />
            </AppButton>
            <AppButton
              v-if="canManage"
              size="sm"
              variant="ghost"
              :class="row.isOnline ? 'text-green-600' : 'text-gray-400'"
              :title="row.isOnline ? t('biometric.setOffline') : t('biometric.setOnline')"
              @click="handleToggleOnline(row)"
            >
              <WifiIcon class="w-4 h-4" />
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>

    <AppModal v-model="showAddModal" :title="t('biometric.addBioTitle')" size="md">
      <div class="space-y-4">
        <AppInput v-model="newDevice.name" :label="t('biometric.name') + ' *'" placeholder="Ex: Lecteur Entrée principale" />
        <div>
          <p class="text-sm font-medium text-gray-700 mb-1">{{ t('biometric.serialNumber') }}</p>
          <p class="font-mono text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">{{ newDevice.serialNumber }}</p>
        </div>
        <AppSelect v-model="newDevice.companyId" :label="t('biometric.companyLabel')" :options="addCompanyOptions" />
        <AppSelect v-model="newDevice.siteId" :label="t('biometric.siteLabel')" :options="addSiteOptions" :disabled="!newDevice.companyId" />
        <AppInput v-model="newDevice.firmwareVersion" :label="t('biometric.firmware')" placeholder="Ex: 2.1.0" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showAddModal = false">{{ t('common.cancel') }}</AppButton>
          <AppButton variant="primary" :loading="isSubmitting" @click="handleAddDevice">{{ t('biometric.addBtn') }}</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
