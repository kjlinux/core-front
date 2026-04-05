<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBiometricStore } from '@/stores/biometric.store'
import { useCompanyStore } from '@/stores/company.store'
import { useSiteStore } from '@/stores/site.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import { mqttApi } from '@/services/api/mqtt.api'
import type { DeviceCommand } from '@/services/api/mqtt.api'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
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
const filterCompany = ref('')
const filterStatus = ref('')
const isSubmitting = ref(false)
const sendingCommand = ref<string | null>(null)

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

const filteredDevices = computed(() => {
  let list = store.devices
  if (filterCompany.value) {
    list = list.filter((d) => d.companyId === filterCompany.value)
  }
  if (filterStatus.value === 'online') {
    list = list.filter((d) => d.isOnline)
  } else if (filterStatus.value === 'offline') {
    list = list.filter((d) => !d.isOnline)
  }
  return list
})

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
  try {
    await store.setDeviceOnline(device.id, !device.isOnline)
    toast.showSuccess(device.isOnline ? device.name + ' mis hors ligne' : device.name + ' mis en ligne')
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
    await store.fetchDevices()
  } catch {
    toast.showError(t('devices.addError'))
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([store.fetchDevices(), companyStore.fetchCompanies(), siteStore.fetchSites({ perPage: 200 })])
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
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <AppSelect v-model="filterCompany" :options="companyOptions" class="w-full sm:w-64" />
        <AppSelect v-model="filterStatus" :options="statusOptions" class="w-full sm:w-48" />
      </div>

      <div v-if="store.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>

      <div v-else-if="filteredDevices.length === 0" class="text-center py-12 text-gray-500">
        {{ t('biometric.notFound') }}
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('biometric.serialNumber') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('biometric.name') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('biometric.status') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('biometric.enrolled') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('biometric.firmware') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('biometric.lastSync') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('biometric.commands') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('biometric.actions') }}</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr
              v-for="device in filteredDevices"
              :key="device.id"
              class="hover:bg-gray-50 cursor-pointer"
              @click="router.push(`/biometrique/devices/${device.id}`)"
            >
              <td class="px-4 py-3 font-mono text-sm">{{ device.serialNumber }}</td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ device.name }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="device.isOnline ? 'success' : 'danger'">
                  {{ device.isOnline ? t('biometric.online') : t('biometric.offline') }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ device.enrolledCount }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ device.firmwareVersion }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(device.lastSyncAt) }}</td>
              <td class="px-4 py-3" @click.stop>
                <div class="flex gap-1" v-if="canManage">
                  <AppButton
                    size="sm"
                    variant="ghost"
                    :disabled="sendingCommand === `${device.id}-RESET`"
                    :title="t('biometric.reset')"
                    @click="handleCommand(device.id, 'RESET')"
                  >
                    <ArrowPathRoundedSquareIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton
                    size="sm"
                    variant="ghost"
                    :disabled="sendingCommand === `${device.id}-REBOOT`"
                    :title="t('biometric.reboot')"
                    @click="handleCommand(device.id, 'REBOOT')"
                  >
                    <PowerIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton
                    size="sm"
                    variant="ghost"
                    :disabled="sendingCommand === `${device.id}-WAKE_UP`"
                    :title="t('biometric.wake')"
                    @click="handleCommand(device.id, 'WAKE_UP')"
                  >
                    <SunIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton
                    size="sm"
                    variant="ghost"
                    :disabled="sendingCommand === `${device.id}-SLEEP`"
                    :title="t('biometric.sleep')"
                    @click="handleCommand(device.id, 'SLEEP')"
                  >
                    <MoonIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton
                    size="sm"
                    variant="ghost"
                    :disabled="sendingCommand === `${device.id}-STATUS`"
                    :title="t('biometric.statusCmd')"
                    @click="handleCommand(device.id, 'STATUS')"
                  >
                    <SignalIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton
                    size="sm"
                    variant="ghost"
                    :title="t('biometric.enrollment')"
                    @click="router.push({ name: 'bio-enrollment-new', query: { deviceId: device.id } })"
                  >
                    <FingerPrintIcon class="w-4 h-4" />
                  </AppButton>
                </div>
              </td>
              <td class="px-4 py-3" @click.stop>
                <div class="flex gap-2">
                  <AppButton size="sm" variant="ghost" @click="router.push(`/biometrique/devices/${device.id}`)" :title="t('biometric.view')">
                    <EyeIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton v-if="canManage" size="sm" variant="ghost" @click="handleSync(device)" :title="t('biometric.sync')">
                    <ArrowPathIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton
                    v-if="canManage"
                    size="sm"
                    :variant="device.isOnline ? 'ghost' : 'ghost'"
                    :class="device.isOnline ? 'text-green-600' : 'text-gray-400'"
                    :title="device.isOnline ? t('biometric.setOffline') : t('biometric.setOnline')"
                    @click="handleToggleOnline(device)"
                  >
                    <WifiIcon class="w-4 h-4" />
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <AppModal v-model="showAddModal" :title="t('biometric.addBioTitle')" size="md">
      <div class="space-y-4">
        <AppInput v-model="newDevice.name" :label="t('biometric.name') + ' *'" placeholder="Ex: Lecteur Entree principale" />
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
