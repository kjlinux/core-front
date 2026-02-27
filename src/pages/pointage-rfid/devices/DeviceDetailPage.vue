<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRfidDeviceStore } from '@/stores/rfid-device.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import { mqttApi } from '@/services/api/mqtt.api'
import type { DeviceCommand } from '@/services/api/mqtt.api'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import {
  ArrowPathIcon,
  ArrowPathRoundedSquareIcon,
  SignalIcon,
  PowerIcon,
} from '@heroicons/vue/24/outline'
import { ref } from 'vue'

const route = useRoute()
const router = useRouter()
const store = useRfidDeviceStore()
const permissions = usePermissions()
const toast = useToast()

const deviceId = route.params.id as string
const sendingCommand = ref<string | null>(null)

const device = computed(() => store.devices.find((d) => d.id === deviceId) ?? store.currentDevice)
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

async function handleCommand(command: DeviceCommand) {
  sendingCommand.value = command
  try {
    await mqttApi.sendCommand(deviceId, 'rfid', command)
    toast.showSuccess(`Commande ${commandLabels[command]} envoyee`)
  } catch {
    toast.showError(`Erreur lors de l'envoi de la commande ${commandLabels[command]}`)
  } finally {
    sendingCommand.value = null
  }
}

async function handleDelete() {
  try {
    await store.deleteDevice(deviceId)
    toast.showSuccess('Terminal supprime')
    router.push('/pointage-rfid/devices')
  } catch {
    toast.showError('Erreur lors de la suppression')
  }
}

onMounted(async () => {
  await store.fetchDevices()
  if (!device.value) {
    await store.fetchDevice(deviceId)
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" @click="router.push('/pointage-rfid/devices')">
        &larr; Retour
      </AppButton>
      <h1 class="text-2xl font-bold text-gray-900">Detail du terminal RFID</h1>
    </div>

    <div v-if="store.isLoading && !device" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <template v-else-if="device">
      <AppCard title="Informations du terminal">
        <div class="flex items-start justify-between">
          <div class="grid grid-cols-2 gap-6">
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Nom</p>
              <p class="mt-1 font-semibold text-gray-900">{{ device.name }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Numero de serie</p>
              <p class="mt-1 font-mono text-gray-900">{{ device.serialNumber }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Statut</p>
              <AppBadge :variant="device.isOnline ? 'success' : 'danger'" class="mt-1">
                {{ device.isOnline ? 'En ligne' : 'Hors ligne' }}
              </AppBadge>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Site</p>
              <p class="mt-1 text-gray-900">{{ device.siteName }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Dernier ping</p>
              <p class="mt-1 text-gray-900">{{ formatDate(device.lastPingAt) }}</p>
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard v-if="canManage" title="Commandes MQTT">
        <div class="flex flex-wrap gap-3">
          <AppButton
            variant="secondary"
            :disabled="sendingCommand === 'REBOOT'"
            @click="handleCommand('REBOOT')"
          >
            <PowerIcon class="w-4 h-4 mr-2" />
            Reboot
          </AppButton>
          <AppButton
            variant="secondary"
            :disabled="sendingCommand === 'RESET'"
            @click="handleCommand('RESET')"
          >
            <ArrowPathRoundedSquareIcon class="w-4 h-4 mr-2" />
            Reset
          </AppButton>
          <AppButton
            variant="secondary"
            :disabled="sendingCommand === 'STATUS'"
            @click="handleCommand('STATUS')"
          >
            <SignalIcon class="w-4 h-4 mr-2" />
            Statut
          </AppButton>
          <AppButton
            variant="secondary"
            :disabled="sendingCommand === 'RESTART'"
            @click="handleCommand('RESTART')"
          >
            <ArrowPathIcon class="w-4 h-4 mr-2" />
            Restart
          </AppButton>
        </div>
      </AppCard>

      <div v-if="canManage" class="flex justify-end">
        <AppButton variant="danger" @click="handleDelete">
          Supprimer ce terminal
        </AppButton>
      </div>
    </template>

    <div v-else class="text-center py-12 text-gray-500">
      Terminal introuvable
    </div>
  </div>
</template>
