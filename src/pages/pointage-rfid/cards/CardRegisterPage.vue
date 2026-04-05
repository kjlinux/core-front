<template>
  <div>
    <div class="mb-6">
      <AppButton variant="outline" size="sm" @click="handleCancel">
        <ArrowLeftIcon class="h-4 w-4 mr-2 inline" />
        {{ t('common.back') }}
      </AppButton>
    </div>

    <AppCard>
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ t('cards.registerTitle') }}</h1>
        <p class="mt-1 text-sm text-gray-500">{{ t('cards.registerSubtitle') }}</p>
      </div>

      <CardForm
        v-model="formData"
        :companies="companyStore.companies"
        :devices="deviceStore.devices"
        :scan-status="scanStatus"
        :loading="loading"
        @scan-request="handleScanRequest"
        @toggle-device-online="handleToggleDeviceOnline"
        @submit="handleSubmit"
      />
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import CardForm from '@/components/forms/CardForm.vue'
import { useCardStore } from '@/stores/card.store'
import { useCompanyStore } from '@/stores/company.store'
import { useRfidDeviceStore } from '@/stores/rfid-device.store'
import { useToast } from '@/composables/useToast'
import { mqttApi } from '@/services/api/mqtt.api'
import { getEcho } from '@/services/echo'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import type { RfidCard } from '@/types'

const { t } = useI18n()
const router = useRouter()
const cardStore = useCardStore()
const companyStore = useCompanyStore()
const deviceStore = useRfidDeviceStore()
const toast = useToast()

const loading = ref(false)
const formData = ref<Partial<RfidCard>>({})
const scanStatus = ref<'idle' | 'waiting' | 'received'>('idle')
let scanTimeoutId: ReturnType<typeof setTimeout> | null = null

const togglingDeviceId = ref<string | null>(null)

async function handleToggleDeviceOnline(deviceId: string) {
  const device = deviceStore.devices.find((d) => d.id === deviceId)
  if (!device) return
  togglingDeviceId.value = deviceId
  try {
    await deviceStore.updateDevice(deviceId, { isOnline: true })
    toast.showSuccess(t('cards.onlineSuccess', { name: device.name }))
  } catch {
    toast.showError(t('cards.onlineError'))
  } finally {
    togglingDeviceId.value = null
  }
}

onMounted(async () => {
  await Promise.all([
    companyStore.fetchCompanies({ perPage: 100 }),
    deviceStore.fetchDevices(),
  ])
})

onUnmounted(() => {
  stopScanListener()
})

function stopScanListener() {
  if (scanTimeoutId) {
    clearTimeout(scanTimeoutId)
    scanTimeoutId = null
  }
  const echo = getEcho()
  if (echo) {
    echo.channel('cards').stopListening('.card.scanned')
  }
  scanStatus.value = 'idle'
}

async function handleScanRequest(deviceId: string) {
  scanStatus.value = 'waiting'

  try {
    await mqttApi.sendCommand(deviceId, 'rfid', 'SCAN')
  } catch {
    toast.showError(t('cards.scanError'))
    scanStatus.value = 'idle'
    return
  }

  const echo = getEcho()
  if (echo) {
    echo.channel('cards')
      .stopListening('.card.scanned')
      .listen('.card.scanned', (data: { uid: string; deviceId: string }) => {
        formData.value = { ...formData.value, uid: data.uid }
        scanStatus.value = 'received'
        stopScanListener()
        // Remettre a idle apres 2s pour permettre une correction manuelle
        setTimeout(() => { scanStatus.value = 'idle' }, 2000)
      })
  }

  // Timeout 30s
  scanTimeoutId = setTimeout(() => {
    if (scanStatus.value === 'waiting') {
      stopScanListener()
      toast.showWarning(t('cards.noScanReceived'))
    }
  }, 30000)
}

const handleSubmit = async () => {
  loading.value = true
  try {
    await cardStore.registerCard(formData.value)
    toast.success(t('common.success'), t('cards.registeredSuccess'))
    router.push('/pointage-rfid/cards')
  } catch (error: any) {
    toast.error(t('common.error'), error.message || t('cards.registerError'))
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push('/pointage-rfid/cards')
}
</script>
