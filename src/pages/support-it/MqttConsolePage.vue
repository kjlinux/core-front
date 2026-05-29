<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  mqttApi,
  type DeviceType,
  type DeviceCommand,
  type RfidCommand,
  type BiometricCommand,
} from '@/services/api/mqtt.api'
import { useRfidDeviceStore } from '@/stores/rfid-device.store'
import { useBiometricStore } from '@/stores/biometric.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppLiveIndicator from '@/components/ui/AppLiveIndicator.vue'
import {
  PaperAirplaneIcon,
  SignalIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'

const rfidStore = useRfidDeviceStore()
const biometricStore = useBiometricStore()
const toast = useToast()

const deviceType = ref<DeviceType>('rfid')
const selectedDeviceId = ref<string>('')
const selectedCommand = ref<DeviceCommand>('STATUS')
const sending = ref(false)
const testing = ref(false)
const brokerConnected = ref<boolean | null>(null)

interface LogEntry {
  id: string
  at: string
  deviceType: DeviceType
  deviceName: string
  command: string
  topic?: string
  status: 'ok' | 'error'
  message?: string
}
const logs = ref<LogEntry[]>([])

const RFID_COMMANDS: RfidCommand[] = ['STATUS', 'RESET', 'REBOOT', 'WAKE_UP', 'SLEEP', 'SCAN']
const BIOMETRIC_COMMANDS: BiometricCommand[] = [...RFID_COMMANDS, 'ENROLE']

const commandOptions = computed(() =>
  (deviceType.value === 'rfid' ? RFID_COMMANDS : BIOMETRIC_COMMANDS).map((c) => ({
    label: c,
    value: c,
  }))
)

const deviceOptions = computed(() => {
  const list = deviceType.value === 'rfid'
    ? rfidStore.devices
    : biometricStore.devices
  return [
    { label: 'Selectionner un capteur...', value: '' },
    ...list.map((d) => ({
      label: `${d.name} - ${d.serialNumber}${d.isOnline ? '' : ' (hors ligne)'}`,
      value: d.id,
    })),
  ]
})

const selectedDevice = computed(() => {
  const list = deviceType.value === 'rfid'
    ? rfidStore.devices
    : biometricStore.devices
  return list.find((d) => d.id === selectedDeviceId.value) ?? null
})

async function testBroker() {
  testing.value = true
  try {
    const r = await mqttApi.testConnection()
    brokerConnected.value = r.connected
    if (r.connected) toast.success('Broker MQTT connecte')
    else toast.error('Broker MQTT inaccessible')
  } catch (e) {
    brokerConnected.value = false
    toast.error('Test broker echoue', String((e as Error).message))
  } finally {
    testing.value = false
  }
}

async function sendCommand() {
  if (!selectedDeviceId.value || !selectedCommand.value) return
  sending.value = true
  const device = selectedDevice.value
  const entry: LogEntry = {
    id: Date.now().toString(),
    at: new Date().toISOString(),
    deviceType: deviceType.value,
    deviceName: device?.name ?? selectedDeviceId.value,
    command: selectedCommand.value,
    status: 'ok',
  }
  try {
    const res = await mqttApi.sendCommand(selectedDeviceId.value, deviceType.value, selectedCommand.value)
    entry.topic = res.topic
    logs.value.unshift(entry)
    toast.success(`Commande ${selectedCommand.value} envoyee`, res.topic)
  } catch (e) {
    entry.status = 'error'
    entry.message = String((e as Error).message)
    logs.value.unshift(entry)
    toast.error(`Echec envoi ${selectedCommand.value}`)
  } finally {
    sending.value = false
  }
}

function clearLogs() {
  logs.value = []
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR')
}

onMounted(async () => {
  await Promise.all([
    rfidStore.fetchDevices().catch(() => undefined),
    biometricStore.fetchDevices().catch(() => undefined),
  ])
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Console MQTT</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Envoyer des commandes en direct aux capteurs et tester le broker
        </p>
      </div>
      <AppLiveIndicator />
    </div>

    <!-- Statut broker -->
    <AppCard>
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <SignalIcon
            :class="[
              'h-8 w-8',
              brokerConnected === true
                ? 'text-green-500'
                : brokerConnected === false
                ? 'text-red-500'
                : 'text-gray-400',
            ]"
          />
          <div>
            <p class="font-semibold text-gray-900 dark:text-gray-100">Broker MQTT</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              <span v-if="brokerConnected === true">Connecte</span>
              <span v-else-if="brokerConnected === false">Hors ligne</span>
              <span v-else>Etat inconnu - lancer un test</span>
            </p>
          </div>
        </div>
        <AppButton variant="ghost" size="sm" :loading="testing" @click="testBroker">
          Tester
        </AppButton>
      </div>
    </AppCard>

    <!-- Formulaire envoi -->
    <AppCard>
      <h3 class="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Envoyer une commande</h3>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
          <AppSelect
            v-model="deviceType"
            :options="[
              { label: 'RFID', value: 'rfid' },
              { label: 'Biometrique', value: 'biometric' },
            ]"
          />
        </div>
        <div class="sm:col-span-2">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Capteur</label>
          <AppSelect v-model="selectedDeviceId" :options="deviceOptions" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Commande</label>
          <AppSelect v-model="selectedCommand" :options="commandOptions" />
        </div>
      </div>
      <div class="mt-4 flex justify-end">
        <AppButton
          variant="primary"
          :loading="sending"
          :disabled="!selectedDeviceId"
          @click="sendCommand"
        >
          <PaperAirplaneIcon class="mr-1 h-4 w-4" />
          Envoyer
        </AppButton>
      </div>
    </AppCard>

    <!-- Historique -->
    <AppCard>
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Historique de session <span class="ml-1 text-xs font-normal text-gray-400">({{ logs.length }})</span>
        </h3>
        <button
          v-if="logs.length > 0"
          type="button"
          class="inline-flex items-center text-xs text-gray-500 hover:text-red-600"
          @click="clearLogs"
        >
          <TrashIcon class="mr-1 h-3 w-3" /> Vider
        </button>
      </div>
      <div v-if="logs.length === 0" class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Aucune commande envoyee dans cette session
      </div>
      <ul v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <li v-for="l in logs" :key="l.id" class="py-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">{{ l.command }}</span>
                <AppBadge :variant="l.deviceType === 'rfid' ? 'info' : 'success'" size="sm">
                  {{ l.deviceType.toUpperCase() }}
                </AppBadge>
                <AppBadge :variant="l.status === 'ok' ? 'success' : 'danger'" size="sm">
                  {{ l.status === 'ok' ? 'Envoye' : 'Echec' }}
                </AppBadge>
              </div>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ l.deviceName }}</p>
              <p v-if="l.topic" class="mt-1 font-mono text-xs text-gray-400">{{ l.topic }}</p>
              <p v-if="l.message" class="mt-1 text-xs text-red-500">{{ l.message }}</p>
            </div>
            <span class="whitespace-nowrap font-mono text-xs text-gray-400">{{ formatTime(l.at) }}</span>
          </div>
        </li>
      </ul>
    </AppCard>
  </div>
</template>
