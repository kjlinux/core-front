<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
import { TrashIcon } from '@heroicons/vue/24/outline'

const deviceStore = useFeelbackDeviceStore()
const companyStore = useCompanyStore()
const siteStore = useSiteStore()
const permissions = usePermissions()
const toast = useToast()

const showAddModal = ref(false)
const filterCompany = ref('')
const filterStatus = ref('')
const newDevice = ref({
  serialNumber: '',
  companyId: '',
  siteId: '',
})

const statusOptions = [
  { label: 'Tous les statuts', value: '' },
  { label: 'En ligne', value: 'online' },
  { label: 'Hors ligne', value: 'offline' },
]

const companyOptions = computed(() => [
  { label: 'Toutes les entreprises', value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
])

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

const siteOptionsForForm = computed(() => {
  const filtered = newDevice.value.companyId
    ? siteStore.sites.filter((s) => s.companyId === newDevice.value.companyId)
    : siteStore.sites
  return [
    { label: 'Selectionner un site', value: '' },
    ...filtered.map((s) => ({ label: s.name, value: s.id })),
  ]
})

const canManage = computed(() => permissions.isSuperAdmin.value || permissions.isAdminEnterprise.value)

function formatDate(date: string) {
  return new Date(date).toLocaleString('fr-FR')
}

async function handleDelete(id: string) {
  try {
    await deviceStore.deleteDevice(id)
    toast.showSuccess('Terminal supprime')
  } catch {
    toast.showError('Erreur lors de la suppression')
  }
}

async function handleAddDevice() {
  if (!newDevice.value.serialNumber) {
    toast.showError('Le numero de serie est obligatoire')
    return
  }
  try {
    await deviceStore.registerDevice(newDevice.value)
    toast.showSuccess('Terminal Feelback ajoute')
    showAddModal.value = false
    newDevice.value = { serialNumber: '', companyId: '', siteId: '' }
  } catch {
    toast.showError("Erreur lors de l'ajout")
  }
}

onMounted(async () => {
  await Promise.all([deviceStore.fetchDevices(), companyStore.fetchCompanies(), siteStore.fetchSites()])
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Terminaux Feelback</h1>
        <p class="text-sm text-gray-500 mt-1">Gestion des bornes de satisfaction client</p>
      </div>
      <AppButton v-if="canManage" variant="primary" @click="showAddModal = true">
        Ajouter un terminal
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
        Aucun terminal trouve
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serie</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernier ping</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr v-for="device in filteredDevices" :key="device.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-mono text-sm">{{ device.serialNumber }}</td>
              <td class="px-4 py-3 text-sm text-gray-900">{{ device.siteName }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="device.isOnline ? 'success' : 'danger'">
                  {{ device.isOnline ? 'En ligne' : 'Hors ligne' }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(device.lastPingAt) }}</td>
              <td class="px-4 py-3">
                <div v-if="canManage">
                  <AppButton size="sm" variant="ghost" class="text-red-600 hover:text-red-700" @click="handleDelete(device.id)" title="Supprimer">
                    <TrashIcon class="w-4 h-4" />
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <AppModal v-model="showAddModal" title="Ajouter un terminal Feelback" size="md">
      <div class="space-y-4">
        <AppInput v-model="newDevice.serialNumber" label="Numero de serie *" placeholder="Ex: FLB-2024-001" />
        <AppSelect v-model="newDevice.companyId" label="Entreprise" :options="companyOptions" @update:model-value="newDevice.siteId = ''" />
        <AppSelect v-model="newDevice.siteId" label="Site" :options="siteOptionsForForm" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showAddModal = false">Annuler</AppButton>
          <AppButton variant="primary" @click="handleAddDevice">Ajouter</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
