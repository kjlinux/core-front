<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRfidDeviceStore } from '@/stores/rfid-device.store'
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

const router = useRouter()
const deviceStore = useRfidDeviceStore()
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
  isOnline: false,
})

function generateSerialNumber(prefix: string): string {
  const year = new Date().getFullYear()
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`)
  let max = 0
  for (const d of deviceStore.devices) {
    const match = d.serialNumber.match(pattern)
    if (match) max = Math.max(max, parseInt(match[1]))
  }
  return `${prefix}-${year}-${String(max + 1).padStart(3, '0')}`
}

const togglingStatus = ref<string | null>(null)

async function handleToggleStatus(device: { id: string; isOnline: boolean }) {
  togglingStatus.value = device.id
  try {
    await deviceStore.updateDevice(device.id, { isOnline: !device.isOnline })
    toast.showSuccess(device.isOnline ? 'Terminal mis hors ligne' : 'Terminal mis en ligne')
  } catch {
    toast.showError('Erreur lors du changement de statut')
  } finally {
    togglingStatus.value = null
  }
}

const statusOptions = [
  { label: 'Tous les statuts', value: '' },
  { label: 'En ligne', value: 'online' },
  { label: 'Hors ligne', value: 'offline' },
]

const companyOptions = computed(() => [
  { label: 'Toutes les entreprises', value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
])

const siteOptionsForForm = computed(() => {
  if (!newDevice.value.companyId) return []
  return siteStore.sites
    .filter(s => s.companyId === newDevice.value.companyId)
    .map(s => ({ label: s.name, value: s.id }))
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

const commandLabels: Record<string, string> = {
  RESET: 'Reset',
  REBOOT: 'Reboot',
  WAKE_UP: 'Reveil',
  SLEEP: 'Veille',
  STATUS: 'Statut',
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
  if (!newDevice.value.name) {
    toast.showError('Veuillez remplir tous les champs obligatoires')
    return
  }
  isSubmitting.value = true
  try {
    await deviceStore.registerDevice(newDevice.value)
    toast.showSuccess('Terminal RFID ajoute')
    showAddModal.value = false
    newDevice.value = { name: '', serialNumber: '', companyId: '', siteId: '', isOnline: false }
  } catch {
    toast.showError("Erreur lors de l'ajout du terminal")
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    deviceStore.fetchDevices(),
    companyStore.fetchCompanies({ perPage: 100 }),
    siteStore.fetchSites({ perPage: 200 }),
  ])
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Terminaux RFID</h1>
        <p class="text-sm text-gray-500 mt-1">Gestion des lecteurs de cartes RFID</p>
      </div>
      <AppButton v-if="canManage" variant="primary" @click="() => { newDevice.serialNumber = generateSerialNumber('RFID'); showAddModal = true }">
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
                    :disabled="sendingCommand === `${device.id}-RESET`"
                    title="Reset"
                    @click="handleCommand(device.id, 'RESET')"
                  >
                    <ArrowPathRoundedSquareIcon class="w-4 h-4" />
                  </AppButton>
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
                    :disabled="sendingCommand === `${device.id}-WAKE_UP`"
                    title="Reveil"
                    @click="handleCommand(device.id, 'WAKE_UP')"
                  >
                    <SunIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton
                    size="sm"
                    variant="ghost"
                    :disabled="sendingCommand === `${device.id}-SLEEP`"
                    title="Veille"
                    @click="handleCommand(device.id, 'SLEEP')"
                  >
                    <MoonIcon class="w-4 h-4" />
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
                </div>
              </td>
              <td class="px-4 py-3" @click.stop>
                <div class="flex gap-2">
                  <AppButton size="sm" variant="ghost" @click="router.push(`/pointage-rfid/devices/${device.id}`)" title="Voir">
                    <EyeIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton
                    v-if="canManage"
                    size="sm"
                    :variant="device.isOnline ? 'ghost' : 'ghost'"
                    :class="device.isOnline ? 'text-green-600 hover:text-red-600' : 'text-gray-400 hover:text-green-600'"
                    :disabled="togglingStatus === device.id"
                    :title="device.isOnline ? 'Mettre hors ligne' : 'Mettre en ligne'"
                    @click="handleToggleStatus(device)"
                  >
                    <WifiIcon v-if="device.isOnline" class="w-4 h-4" />
                    <NoSymbolIcon v-else class="w-4 h-4" />
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
        <div>
          <p class="text-sm font-medium text-gray-700 mb-1">Numero de serie</p>
          <p class="font-mono text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">{{ newDevice.serialNumber }}</p>
        </div>
        <AppSelect
          v-model="newDevice.companyId"
          label="Entreprise"
          :options="companyOptions"
          @update:model-value="newDevice.siteId = ''"
        />
        <AppSelect
          v-model="newDevice.siteId"
          label="Site"
          :options="siteOptionsForForm"
          placeholder="Selectionner un site"
          :disabled="!newDevice.companyId"
        />
        <div class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
          <div>
            <p class="text-sm font-medium text-gray-700">Statut initial</p>
            <p class="text-xs text-gray-500">{{ newDevice.isOnline ? 'En ligne' : 'Hors ligne' }}</p>
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
          <AppButton variant="secondary" @click="showAddModal = false">Annuler</AppButton>
          <AppButton variant="primary" :loading="isSubmitting" @click="handleAddDevice">Ajouter</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
