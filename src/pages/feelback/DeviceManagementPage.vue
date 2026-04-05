<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFeelbackDeviceStore } from '@/stores/feelback-device.store'
import { useCompanyStore } from '@/stores/company.store'
import { useSiteStore } from '@/stores/site.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import type { FeelbackDevice } from '@/types'
import { TrashIcon, WifiIcon, PlusIcon, PencilIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const deviceStore = useFeelbackDeviceStore()
const companyStore = useCompanyStore()
const siteStore = useSiteStore()
const permissions = usePermissions()
const toast = useToast()

const showAddModal = ref(false)
const showEditModal = ref(false)
const filterCompany = ref('')
const filterStatus = ref('')
const isSubmitting = ref(false)

const newDevice = ref({
  serialNumber: '',
  companyId: '',
  siteId: '',
})

function generateSerialNumber(prefix: string): string {
  const year = new Date().getFullYear()
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`)
  let max = 0
  for (const d of deviceStore.devices) {
    const match = d.serialNumber.match(pattern)
    if (match) max = Math.max(max, parseInt(match[1]!))
  }
  return `${prefix}-${year}-${String(max + 1).padStart(3, '0')}`
}

const editDevice = ref<FeelbackDevice | null>(null)
const editForm = ref({
  companyId: '',
  siteId: '',
})

const statusOptions = computed(() => [
  { label: t('feelback.allStatuses'), value: '' },
  { label: t('common.online'), value: 'online' },
  { label: t('common.offline'), value: 'offline' },
])

const companyOptions = computed(() => [
  { label: t('feelback.allCompanies'), value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
])

const addCompanyOptions = computed(() => [
  { label: t('feelback.company'), value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
])

const addSiteOptions = computed(() => {
  if (!newDevice.value.companyId) return [{ label: t('feelback.site'), value: '' }]
  const sites = siteStore.sites.filter((s) => s.companyId === newDevice.value.companyId)
  return [
    { label: t('feelback.site'), value: '' },
    ...sites.map((s) => ({ label: s.name, value: s.id })),
  ]
})

const editSiteOptions = computed(() => {
  if (!editForm.value.companyId) return [{ label: t('feelback.site'), value: '' }]
  const sites = siteStore.sites.filter((s) => s.companyId === editForm.value.companyId)
  return [
    { label: t('feelback.site'), value: '' },
    ...sites.map((s) => ({ label: s.name, value: s.id })),
  ]
})

watch(() => newDevice.value.companyId, () => {
  newDevice.value.siteId = ''
})

watch(() => editForm.value.companyId, () => {
  editForm.value.siteId = ''
})

const filteredDevices = computed(() => {
  let list = deviceStore.devices
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

function formatDate(date: string) {
  return new Date(date).toLocaleString('fr-FR')
}

function openEditModal(device: FeelbackDevice) {
  editDevice.value = device
  editForm.value = { companyId: device.companyId, siteId: device.siteId }
  showEditModal.value = true
}

async function handleToggleOnline(device: FeelbackDevice) {
  try {
    await deviceStore.setDeviceOnline(device.id, !device.isOnline)
    toast.showSuccess(device.isOnline ? device.serialNumber + ' mis hors ligne' : device.serialNumber + ' mis en ligne')
  } catch {
    toast.showError('Erreur lors du changement de statut')
  }
}

async function handleDelete(id: string) {
  if (!confirm(t('common.confirm_delete'))) return
  try {
    await deviceStore.deleteDevice(id)
    toast.showSuccess(t('common.delete'))
  } catch {
    toast.showError('Erreur lors de la suppression')
  }
}

async function handleAddDevice() {
  if (!newDevice.value.companyId || !newDevice.value.siteId) {
    toast.showError('Veuillez remplir tous les champs obligatoires')
    return
  }
  isSubmitting.value = true
  try {
    await deviceStore.registerDevice(newDevice.value)
    toast.showSuccess(t('feelback.addDevice'))
    showAddModal.value = false
    newDevice.value = { serialNumber: '', companyId: '', siteId: '' }
  } catch {
    toast.showError("Erreur lors de l'ajout")
  } finally {
    isSubmitting.value = false
  }
}

async function handleEditDevice() {
  if (!editDevice.value || !editForm.value.siteId) {
    toast.showError('Veuillez selectionner un site')
    return
  }
  isSubmitting.value = true
  try {
    await deviceStore.updateDevice(editDevice.value.id, editForm.value)
    toast.showSuccess('Terminal mis a jour')
    showEditModal.value = false
  } catch {
    toast.showError('Erreur lors de la mise a jour')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([deviceStore.fetchDevices(), companyStore.fetchCompanies(), siteStore.fetchSites({ perPage: 200 })])
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('feelback.devicesTitle') }}</h1>
        <p class="text-sm text-gray-500 mt-1">{{ t('feelback.devicesSubtitle') }}</p>
      </div>
      <AppButton v-if="canManage" variant="primary" @click="() => { newDevice.serialNumber = generateSerialNumber('FLB'); showAddModal = true }">
        <PlusIcon class="w-4 h-4 mr-1" />
        {{ t('feelback.addDevice') }}
      </AppButton>
    </div>

    <AppCard>
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <AppSelect v-model="filterCompany" :options="companyOptions" class="w-64" />
        <AppSelect v-model="filterStatus" :options="statusOptions" class="w-48" />
      </div>

      <div v-if="deviceStore.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>

      <div v-else-if="filteredDevices.length === 0" class="text-center py-12 text-gray-500">
        {{ t('feelback.noDevice') }}
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('feelback.serial') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('feelback.site') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('feelback.status') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('feelback.lastPing') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('feelback.company') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr v-for="device in filteredDevices" :key="device.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-mono text-sm">{{ device.serialNumber }}</td>
              <td class="px-4 py-3 text-sm text-gray-900">{{ device.siteName }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="device.isOnline ? 'success' : 'danger'">
                  {{ device.isOnline ? t('common.online') : t('common.offline') }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(device.lastPingAt) }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ companyStore.companies.find((c) => c.id === device.companyId)?.name ?? '-' }}
              </td>
              <td class="px-4 py-3" @click.stop>
                <div v-if="canManage" class="flex gap-1">
                  <AppButton
                    size="sm"
                    variant="ghost"
                    :class="device.isOnline ? 'text-green-600' : 'text-gray-400'"
                    :title="device.isOnline ? t('common.offline') : t('common.online')"
                    @click="handleToggleOnline(device)"
                  >
                    <WifiIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton size="sm" variant="ghost" :title="t('common.edit')" @click="openEditModal(device)">
                    <PencilIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton size="sm" variant="ghost" class="text-red-600 hover:text-red-700" @click="handleDelete(device.id)" :title="t('common.delete')">
                    <TrashIcon class="w-4 h-4" />
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <AppModal v-model="showAddModal" :title="t('feelback.addDeviceTitle')" size="md">
      <div class="space-y-4">
        <div>
          <p class="text-sm font-medium text-gray-700 mb-1">{{ t('feelback.serialNumber') }}</p>
          <p class="font-mono text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">{{ newDevice.serialNumber }}</p>
        </div>
        <AppSelect v-model="newDevice.companyId" :label="`${t('feelback.company')} *`" :options="addCompanyOptions" />
        <AppSelect v-model="newDevice.siteId" :label="`${t('feelback.site')} *`" :options="addSiteOptions" :disabled="!newDevice.companyId" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showAddModal = false">{{ t('common.cancel') }}</AppButton>
          <AppButton variant="primary" :loading="isSubmitting" @click="handleAddDevice">{{ t('common.add') }}</AppButton>
        </div>
      </template>
    </AppModal>

    <AppModal v-model="showEditModal" :title="t('feelback.editDevice')" size="md">
      <div class="space-y-4">
        <div>
          <p class="text-sm text-gray-500">{{ t('feelback.serialNumber') }}</p>
          <p class="font-mono text-sm font-medium">{{ editDevice?.serialNumber }}</p>
        </div>
        <AppSelect v-model="editForm.companyId" :label="`${t('feelback.company')} *`" :options="addCompanyOptions" />
        <AppSelect v-model="editForm.siteId" :label="`${t('feelback.site')} *`" :options="editSiteOptions" :disabled="!editForm.companyId" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showEditModal = false">{{ t('common.cancel') }}</AppButton>
          <AppButton variant="primary" :loading="isSubmitting" @click="handleEditDevice">{{ t('common.save') }}</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
