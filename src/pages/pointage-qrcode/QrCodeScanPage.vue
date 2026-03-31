<script setup lang="ts">
import { ref } from 'vue'
import { useQrcodeStore } from '@/stores/qrcode.store'
import { useToast } from '@/composables/useToast'
import type { QrAttendanceRecord } from '@/types'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const store = useQrcodeStore()
const toast = useToast()

const token = ref('')
const lastResult = ref<QrAttendanceRecord | null>(null)
const error = ref<string | null>(null)

async function scan() {
  if (!token.value.trim()) {
    toast.error('Veuillez saisir un token QR Code')
    return
  }
  error.value = null
  lastResult.value = null
  try {
    lastResult.value = await store.simulateScan(token.value.trim())
    token.value = ''
    toast.success('Pointage enregistre')
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    error.value = msg || 'QR Code invalide ou inactif'
  }
}

function getStatusVariant(status: string) {
  const map: Record<string, string> = {
    present: 'success',
    absent: 'danger',
    late: 'warning',
    left_early: 'info',
  }
  return map[status] || 'default'
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    present: 'Present',
    absent: 'Absent',
    late: 'En retard',
    left_early: 'Parti tot',
  }
  return map[status] || status
}
</script>

<template>
  <div class="mx-auto max-w-lg space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Scanner QR Code</h1>

    <AppCard>
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          Saisissez ou collez le token du QR Code pour simuler un scan de pointage.
        </p>
        <AppInput
          v-model="token"
          label="Token QR Code"
          placeholder="Entrez le token..."
          @keydown.enter="scan"
        />
        <AppButton
          variant="primary"
          :loading="store.isLoading"
          :disabled="!token.trim()"
          class="w-full"
          @click="scan"
        >
          Simuler le scan
        </AppButton>
      </div>
    </AppCard>

    <AppCard v-if="error" class="border-red-200 bg-red-50">
      <p class="text-sm text-red-700">{{ error }}</p>
    </AppCard>

    <AppCard v-if="lastResult" class="border-green-200 bg-green-50">
      <h3 class="mb-3 font-semibold text-gray-900">Resultat du scan</h3>
      <dl class="space-y-2">
        <div class="flex justify-between">
          <dt class="text-sm text-gray-600">Employe</dt>
          <dd class="text-sm font-medium text-gray-900">{{ lastResult.employeeName }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-gray-600">Date</dt>
          <dd class="text-sm font-medium text-gray-900">{{ lastResult.date }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-gray-600">Entree</dt>
          <dd class="text-sm font-medium text-gray-900">{{ lastResult.entryTime ?? '-' }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-gray-600">Sortie</dt>
          <dd class="text-sm font-medium text-gray-900">{{ lastResult.exitTime ?? '-' }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-gray-600">Statut</dt>
          <dd>
            <AppBadge :variant="getStatusVariant(lastResult.status)">
              {{ getStatusLabel(lastResult.status) }}
            </AppBadge>
          </dd>
        </div>
      </dl>
    </AppCard>
  </div>
</template>
