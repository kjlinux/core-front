<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBiometricStore } from '@/stores/biometric.store'
import { useCompanyStore } from '@/stores/company.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import type { BiometricDevice } from '@/types'

const router = useRouter()
const store = useBiometricStore()
const companyStore = useCompanyStore()
const permissions = usePermissions()
const toast = useToast()

const showAddModal = ref(false)
const filterCompany = ref('')
const filterStatus = ref('')
const isSubmitting = ref(false)

const newDevice = ref({
  name: '',
  serialNumber: '',
  companyId: '',
  siteId: '',
  firmwareVersion: '',
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

const canManage = computed(() => permissions.isSuperAdmin.value || permissions.isAdminEnterprise.value)

function formatDate(date: string) {
  return new Date(date).toLocaleString('fr-FR')
}

async function handleSync(device: BiometricDevice) {
  try {
    await store.syncDevice(device.id)
    toast.showSuccess('Synchronisation lancee pour ' + device.name)
  } catch {
    toast.showError('Erreur lors de la synchronisation')
  }
}

async function handleAddDevice() {
  if (!newDevice.value.name || !newDevice.value.serialNumber) {
    toast.showError('Veuillez remplir tous les champs obligatoires')
    return
  }
  isSubmitting.value = true
  try {
    await store.startEnrollment(newDevice.value as any)
    toast.showSuccess('Terminal ajoute avec succes')
    showAddModal.value = false
    newDevice.value = { name: '', serialNumber: '', companyId: '', siteId: '', firmwareVersion: '' }
    await store.fetchDevices()
  } catch {
    toast.showError("Erreur lors de l'ajout du terminal")
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([store.fetchDevices(), companyStore.fetchCompanies()])
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Terminaux biometriques</h1>
        <p class="text-sm text-gray-500 mt-1">Gestion des lecteurs d'empreintes digitales</p>
      </div>
      <AppButton v-if="canManage" variant="primary" @click="showAddModal = true">
        Ajouter un terminal
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
        Aucun terminal trouve
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numero serie</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inscrits</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firmware</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Derniere synchro</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                  {{ device.isOnline ? 'En ligne' : 'Hors ligne' }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ device.enrolledCount }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ device.firmwareVersion }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(device.lastSyncAt) }}</td>
              <td class="px-4 py-3" @click.stop>
                <div class="flex gap-2">
                  <AppButton size="sm" variant="ghost" @click="router.push(`/biometrique/devices/${device.id}`)">
                    Voir
                  </AppButton>
                  <AppButton v-if="canManage" size="sm" variant="secondary" @click="handleSync(device)">
                    Sync
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <AppModal v-model="showAddModal" title="Ajouter un terminal biometrique" size="md">
      <div class="space-y-4">
        <AppInput v-model="newDevice.name" label="Nom du terminal *" placeholder="Ex: Lecteur Entree principale" />
        <AppInput v-model="newDevice.serialNumber" label="Numero de serie *" placeholder="Ex: BIO-2024-001" />
        <AppSelect v-model="newDevice.companyId" label="Entreprise" :options="companyOptions" />
        <AppInput v-model="newDevice.firmwareVersion" label="Version firmware" placeholder="Ex: 2.1.0" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showAddModal = false">Annuler</AppButton>
          <AppButton variant="primary" :loading="isSubmitting" @click="handleAddDevice">Ajouter</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
