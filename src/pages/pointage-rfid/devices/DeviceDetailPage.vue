<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useRfidDeviceStore } from '@/stores/rfid-device.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import { mqttApi } from '@/services/api/mqtt.api'
import type { DeviceCommand } from '@/services/api/mqtt.api'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import {
  ArrowPathRoundedSquareIcon,
  PowerIcon,
  SunIcon,
  MoonIcon,
  SignalIcon,
} from '@heroicons/vue/24/outline'
import { ref } from 'vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useRfidDeviceStore()
const permissions = usePermissions()
const toast = useToast()

const deviceId = route.params.id as string
const sendingCommand = ref<string | null>(null)

const device = computed(() => store.devices.find((d) => d.id === deviceId) ?? store.currentDevice)
const canManage = computed(() => permissions.isAdminOrSuperOrTech.value)

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

async function handleCommand(command: DeviceCommand) {
  sendingCommand.value = command
  try {
    await mqttApi.sendCommand(deviceId, 'rfid', command)
    toast.showSuccess(t('devices.commandSent', { label: commandLabels.value[command] }))
  } catch {
    toast.showError(t('devices.commandError', { label: commandLabels.value[command] }))
  } finally {
    sendingCommand.value = null
  }
}

async function handleDelete() {
  try {
    await store.deleteDevice(deviceId)
    toast.showSuccess(t('devices.deletedSuccess'))
    router.push('/pointage-rfid/devices')
  } catch {
    toast.showError(t('devices.deleteError'))
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
        &larr; {{ t('common.back') }}
      </AppButton>
      <h1 class="text-2xl font-bold text-gray-900">{{ t('devices.detail') }}</h1>
    </div>

    <div v-if="store.isLoading && !device" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <template v-else-if="device">
      <AppCard :title="t('devices.info')">
        <div class="flex items-start justify-between">
          <div class="grid grid-cols-2 gap-6">
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">{{ t('devices.name') }}</p>
              <p class="mt-1 font-semibold text-gray-900">{{ device.name }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">{{ t('devices.serialNumber') }}</p>
              <p class="mt-1 font-mono text-gray-900">{{ device.serialNumber }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">{{ t('devices.status') }}</p>
              <AppBadge :variant="device.isOnline ? 'success' : 'danger'" class="mt-1">
                {{ device.isOnline ? t('devices.online') : t('devices.offline') }}
              </AppBadge>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">{{ t('devices.site') }}</p>
              <p class="mt-1 text-gray-900">{{ device.siteName }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">{{ t('devices.lastPing') }}</p>
              <p class="mt-1 text-gray-900">{{ formatDate(device.lastPingAt) }}</p>
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard v-if="canManage" :title="t('devices.mqttCommands')">
        <div class="flex flex-wrap gap-3">
          <AppButton
            variant="secondary"
            :disabled="sendingCommand === 'RESET'"
            @click="handleCommand('RESET')"
          >
            <ArrowPathRoundedSquareIcon class="w-4 h-4 mr-2" />
            {{ t('devices.reset') }}
          </AppButton>
          <AppButton
            variant="secondary"
            :disabled="sendingCommand === 'REBOOT'"
            @click="handleCommand('REBOOT')"
          >
            <PowerIcon class="w-4 h-4 mr-2" />
            {{ t('devices.reboot') }}
          </AppButton>
          <AppButton
            variant="secondary"
            :disabled="sendingCommand === 'WAKE_UP'"
            @click="handleCommand('WAKE_UP')"
          >
            <SunIcon class="w-4 h-4 mr-2" />
            {{ t('devices.wake') }}
          </AppButton>
          <AppButton
            variant="secondary"
            :disabled="sendingCommand === 'SLEEP'"
            @click="handleCommand('SLEEP')"
          >
            <MoonIcon class="w-4 h-4 mr-2" />
            {{ t('devices.sleep') }}
          </AppButton>
          <AppButton
            variant="secondary"
            :disabled="sendingCommand === 'STATUS'"
            @click="handleCommand('STATUS')"
          >
            <SignalIcon class="w-4 h-4 mr-2" />
            {{ t('devices.statusCmd') }}
          </AppButton>
        </div>
      </AppCard>

      <div v-if="canManage" class="flex justify-end">
        <AppButton variant="danger" @click="handleDelete">
          {{ t('devices.deleteDevice') }}
        </AppButton>
      </div>
    </template>

    <div v-else class="text-center py-12 text-gray-500">
      {{ t('devices.notFoundMsg') }}
    </div>
  </div>
</template>
