<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRfidDeviceStore } from '@/stores/rfid-device.store'
import { useCompanyStore } from '@/stores/company.store'
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
import {
  EyeIcon,
  TrashIcon,
  ArrowPathIcon,
  ArrowPathRoundedSquareIcon,
  SignalIcon,
  PowerIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const deviceStore = useRfidDeviceStore()
const companyStore = useCompanyStore()
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

const canManage = computed(() => permissions.isSuperAdmin.value || permissions.isAdminEnterprise.value)

const commandLabels: Record<DeviceCommand, string> = {
  REBOOT: 'Reboot',
  RESET: 'Reset',
  STATUS: 'Statut',
  RESTART: 'Restart',
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('fr-FR')
}

async function handleCommand(deviceId: string, command: DeviceCommand) {
  sendingCommand.value = `${deviceId}-${command}`
  try {
    await mqttApi.sendCommand(deviceId, 'rfid', command)
    toast.showSuccess(`Commande ${commandLabels[command]} envoyee`)
  } catch {
    toast.showError(`Erreur lors de l'envoi de la commande ${commandLabels[command]}`)
  } finally {
    sendingCommand.value = null
  }
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
  if (!newDevice.value.name || !newDevice.value.serialNumber) {
    toast.showError('Veuillez remplir tous les champs obligatoires')
    return
  }
  isSubmitting.value = true
  try {
    await deviceStore.registerDevice(newDevice.value)
    toast.showSuccess('Terminal RFID ajoute')
    showAddModal.value = false
    newDevice.value = { name: '', serialNumber: '', companyId: '', siteId: '' }
  } catch {
    toast.showError("Erreur lors de l'ajout du terminal")
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([deviceStore.fetchDevices(), companyStore.fetchCompanies()])
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Terminaux RFID</h1>
        <p class="text-sm text-gray-500 mt-1">Gestion des lecteurs de cartes RFID</p>
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
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numero serie</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernier ping</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commandes</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr
              v-for="device in filteredDevices"
              :key="device.id"
              class="hover:bg-gray-50 cursor-pointer"
              @click="router.push(`/pointage-rfid/devices/${device.id}`)"
            >
              <td class="px-4 py-3 font-mono text-sm">{{ device.serialNumber }}</td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ device.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ device.siteName }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="device.isOnline ? 'success' : 'danger'">
                  {{ device.isOnline ? 'En ligne' : 'Hors ligne' }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(device.lastPingAt) }}</td>
              <td class="px-4 py-3" @click.stop>
                <div class="flex gap-1" v-if="canManage">
                  <AppButton
                    size="sm"
                    variant="ghost"
                    :disabled="sendingCommand === `${device.id}-REBOOT`"
                    title="Reboot"
                    @click="handleCommand(device.id, 'REBOOT')"
                  >
                    <PowerIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton
                    size="sm"
                    variant="ghost"
                    :disabled="sendingCommand === `${device.id}-RESET`"
                    title="Reset"
                    @click="handleCommand(device.id, 'RESET')"
                  >
                    <ArrowPathRoundedSquareIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton
                    size="sm"
                    variant="ghost"
                    :disabled="sendingCommand === `${device.id}-STATUS`"
                    title="Statut"
                    @click="handleCommand(device.id, 'STATUS')"
                  >
                    <SignalIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton
                    size="sm"
                    variant="ghost"
                    :disabled="sendingCommand === `${device.id}-RESTART`"
                    title="Restart"
                    @click="handleCommand(device.id, 'RESTART')"
                  >
                    <ArrowPathIcon class="w-4 h-4" />
                  </AppButton>
                </div>
              </td>
              <td class="px-4 py-3" @click.stop>
                <div class="flex gap-2">
                  <AppButton size="sm" variant="ghost" @click="router.push(`/pointage-rfid/devices/${device.id}`)" title="Voir">
                    <EyeIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton v-if="canManage" size="sm" variant="ghost" class="text-red-600 hover:text-red-700" @click="handleDelete(device.id)" title="Supprimer">
                    <TrashIcon class="w-4 h-4" />
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <AppModal v-model="showAddModal" title="Ajouter un terminal RFID" size="md">
      <div class="space-y-4">
        <AppInput v-model="newDevice.name" label="Nom du terminal *" placeholder="Ex: Lecteur Entree principale" />
        <AppInput v-model="newDevice.serialNumber" label="Numero de serie *" placeholder="Ex: RFID-2026-001" />
        <AppSelect v-model="newDevice.companyId" label="Entreprise" :options="companyOptions" />
        <AppInput v-model="newDevice.siteId" label="ID du site" />
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
