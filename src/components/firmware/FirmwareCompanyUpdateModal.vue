<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useFirmwareStore } from '@/stores/firmware.store'
import { firmwareApi } from '@/services/api/firmware.api'
import { useToast } from '@/composables/useToast'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import type { OtaUpdateStatus } from '@/types'

const props = defineProps<{ firmwareVersionId: string; firmwareVersion: string; deviceKind: string }>()
const emit = defineEmits<{ close: [] }>()

const store = useFirmwareStore()
const toast = useToast()

type ModalStep = 'confirm' | 'progress' | 'done'
const step = ref<ModalStep>('confirm')
const isStarting = ref(false)

const kindLabel = computed(() => props.deviceKind === 'rfid' ? 'RFID' : 'Biometrique')

const progress = computed(() => store.companyUpdateProgress)
const progressPct = computed(() => {
  if (!progress.value || progress.value.total === 0) return 0
  return Math.round((progress.value.success / progress.value.total) * 100)
})
const isDone = computed(() =>
  progress.value !== null &&
  progress.value.pending === 0 &&
  progress.value.inProgress === 0
)

async function startUpdate() {
  isStarting.value = true
  try {
    store.companyUpdateProgress = null
    await store.triggerCompanyUpdate(props.firmwareVersionId)
    step.value = 'progress'
    try {
      store.companyUpdateProgress = await firmwareApi.getCompanyUpdateProgress(props.firmwareVersionId)
    } catch (e) {
      toast.error('Impossible de charger la progression initiale')
      throw e
    }
  } catch {
    toast.error('Erreur lors du declenchement de la mise a jour')
  } finally {
    isStarting.value = false
  }
}

async function retryFailed() {
  try {
    await store.retryFailed(props.firmwareVersionId)
    toast.success('Capteurs en echec relances')
  } catch {
    toast.error('Erreur lors de la relance')
  }
}

const pendingCount = computed(() =>
  (progress.value?.pending ?? 0) + (progress.value?.inProgress ?? 0)
)

async function retryPending() {
  try {
    const result = await store.retryPending(props.firmwareVersionId)
    toast.success(`${result.triggered} capteur(s) en attente relance(s)`)
  } catch {
    toast.error('Erreur lors de la relance')
  }
}

function close() {
  store.stopProgressPolling()
  emit('close')
}

const stopWatcher = (() => {
  let interval: ReturnType<typeof setInterval> | null = null
  interval = setInterval(() => {
    if (step.value === 'progress' && isDone.value) {
      step.value = 'done'
      if (interval) clearInterval(interval)
    }
  }, 1000)
  return () => { if (interval) clearInterval(interval) }
})()

onUnmounted(() => {
  stopWatcher()
  store.stopProgressPolling()
})

const statusVariant: Record<OtaUpdateStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  pending:     'neutral',
  in_progress: 'info',
  success:     'success',
  failed:      'danger',
  skipped:     'neutral',
}
const statusLabel: Record<OtaUpdateStatus, string> = {
  pending:     'En attente',
  in_progress: 'En cours...',
  success:     'Termine',
  failed:      'Echec',
  skipped:     'Ignore',
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="close">
    <div class="w-full max-w-lg rounded-xl bg-white shadow-2xl">

      <div class="border-b border-gray-200 px-6 py-4">
        <h2 class="text-lg font-semibold text-gray-900">Mise a jour firmware v{{ firmwareVersion }}</h2>
        <p class="mt-0.5 text-sm text-gray-500">Capteurs {{ kindLabel }}</p>
      </div>

      <div v-if="step === 'confirm'" class="px-6 py-5">
        <p class="text-sm text-gray-700">
          Cette action va envoyer la mise a jour firmware <strong>v{{ firmwareVersion }}</strong>
          a tous vos capteurs <strong>{{ kindLabel }}</strong> connectes.
        </p>
        <p class="mt-2 text-sm text-gray-500">
          Chaque capteur telechargera le nouveau firmware et redemarrera automatiquement.
        </p>
        <div class="mt-6 flex justify-end gap-3">
          <AppButton variant="ghost" @click="close">Annuler</AppButton>
          <AppButton variant="primary" :loading="isStarting" @click="startUpdate">
            Demarrer la mise a jour
          </AppButton>
        </div>
      </div>

      <div v-else-if="step === 'progress'" class="px-6 py-5">
        <div class="mb-4">
          <div class="mb-1 flex items-center justify-between text-sm">
            <span class="font-medium text-gray-700">Progression globale</span>
            <span class="text-gray-500">{{ progress?.success ?? 0 }} / {{ progress?.total ?? 0 }}</span>
          </div>
          <div class="h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              class="h-full rounded-full bg-blue-600 transition-all duration-500"
              :style="{ width: `${progressPct}%` }"
            />
          </div>
          <div class="mt-2 flex gap-4 text-xs text-gray-500">
            <span v-if="(progress?.pending ?? 0) > 0">En attente : {{ progress?.pending }}</span>
            <span v-if="(progress?.inProgress ?? 0) > 0">En cours : {{ progress?.inProgress }}</span>
            <span v-if="(progress?.success ?? 0) > 0" class="text-green-600">Termines : {{ progress?.success }}</span>
            <span v-if="(progress?.failed ?? 0) > 0" class="text-red-600">Echecs : {{ progress?.failed }}</span>
          </div>
        </div>

        <div class="max-h-64 overflow-y-auto divide-y divide-gray-100 rounded-lg border border-gray-200">
          <div
            v-for="device in progress?.devices ?? []"
            :key="device.deviceId"
            class="flex items-center justify-between px-4 py-2.5"
          >
            <div>
              <p class="text-sm font-medium text-gray-900">{{ device.deviceName }}</p>
              <p v-if="device.errorMessage" class="text-xs text-red-500">{{ device.errorMessage }}</p>
            </div>
            <AppBadge :variant="statusVariant[device.status]">
              {{ statusLabel[device.status] }}
            </AppBadge>
          </div>
          <div v-if="!progress?.devices?.length" class="px-4 py-6 text-center text-sm text-gray-400">
            Chargement...
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between gap-3">
          <div class="flex gap-2">
            <AppButton
              v-if="(progress?.failed ?? 0) > 0 && pendingCount === 0"
              variant="outline"
              @click="retryFailed"
            >
              Relancer les echecs ({{ progress?.failed }})
            </AppButton>
            <AppButton
              v-if="pendingCount > 0"
              variant="outline"
              @click="retryPending"
            >
              Relancer les terminaux en attente ({{ pendingCount }})
            </AppButton>
          </div>
          <AppButton variant="ghost" @click="close">Fermer</AppButton>
        </div>
      </div>

      <div v-else-if="step === 'done'" class="px-6 py-5 text-center">
        <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900">Mise a jour terminee</h3>
        <p class="mt-2 text-sm text-gray-600">
          <span class="text-green-600 font-medium">{{ progress?.success ?? 0 }} capteur(s)</span> mis a jour avec succes.
          <template v-if="(progress?.failed ?? 0) > 0">
            <br><span class="text-red-500 font-medium">{{ progress?.failed }} echec(s)</span> - vous pouvez relancer depuis la page Firmware.
          </template>
        </p>
        <div class="mt-6 flex justify-center gap-3">
          <AppButton
            v-if="(progress?.failed ?? 0) > 0"
            variant="outline"
            @click="retryFailed(); step = 'progress'"
          >
            Relancer les echecs
          </AppButton>
          <AppButton variant="primary" @click="close">Fermer</AppButton>
        </div>
      </div>

    </div>
  </div>
</template>
