<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import QRCode from 'qrcode'
import { qrcodeApi } from '@/services/api/qrcode.api'
import { employeeApi } from '@/services/api/employee.api'
import { useToast } from '@/composables/useToast'
import type { Employee } from '@/types'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const toast = useToast()

const employees = ref<Employee[]>([])
const selectedEmployeeId = ref('')
const isLoading = ref(false)

// Session d'enrôlement en cours
const session = ref<{
  token: string
  employeeName: string
  expiresIn: number
} | null>(null)
const qrDataUrl = ref<string | null>(null)
const sessionStatus = ref<'pending' | 'completed' | 'expired'>('pending')
const timeLeft = ref(0)

let pollInterval: ReturnType<typeof setInterval> | null = null
let countdownInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  const response = await employeeApi.getAll({ perPage: 200 })
  employees.value = response.data
})

onUnmounted(() => {
  stopPolling()
})

const employeeOptions = computed(() => [
  { label: 'Selectionner un employe', value: '' },
  ...employees.value.map((e) => ({
    label: `${e.firstName} ${e.lastName} (${e.employeeNumber})`,
    value: e.id,
  })),
])

const enrolledEmployees = computed(() => employees.value.filter((e) => e.deviceFingerprint))
const unenrolledEmployees = computed(() => employees.value.filter((e) => e.isActive && !e.deviceFingerprint))

async function startEnrollment() {
  if (!selectedEmployeeId.value) return
  isLoading.value = true
  try {
    const result = await qrcodeApi.createEnrollSession(selectedEmployeeId.value)
    session.value = result
    sessionStatus.value = 'pending'
    timeLeft.value = result.expiresIn

    // Générer le QR Code contenant l'URL de soumission
    const enrollUrl = `${window.location.origin}/qr-scan?enroll=${result.sessionToken}`
    qrDataUrl.value = await QRCode.toDataURL(enrollUrl, { width: 280, margin: 2 })

    startPolling(result.sessionToken)
    startCountdown()
  } catch {
    toast.error('Erreur lors de la creation de la session')
  } finally {
    isLoading.value = false
  }
}

function startPolling(token: string) {
  pollInterval = setInterval(async () => {
    try {
      const status = await qrcodeApi.getEnrollSession(token)
      if (status.status === 'completed') {
        sessionStatus.value = 'completed'
        stopPolling()
        toast.success(`Telephone de ${status.employeeName} enrole avec succes`)
        // Rafraîchir la liste
        const response = await employeeApi.getAll({ perPage: 200 })
        employees.value = response.data
        selectedEmployeeId.value = ''
      }
    } catch {
      // Session expirée (404)
      sessionStatus.value = 'expired'
      stopPolling()
    }
  }, 2000)
}

function startCountdown() {
  countdownInterval = setInterval(() => {
    timeLeft.value -= 1
    if (timeLeft.value <= 0) {
      if (sessionStatus.value === 'pending') {
        sessionStatus.value = 'expired'
      }
      stopPolling()
    }
  }, 1000)
}

function stopPolling() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null }
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null }
}

function cancelSession() {
  stopPolling()
  session.value = null
  qrDataUrl.value = null
  sessionStatus.value = 'pending'
  timeLeft.value = 0
}

const timeLeftFormatted = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = timeLeft.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

async function revokeDevice(employeeId: string, name: string) {
  try {
    await qrcodeApi.revokeDevice(employeeId)
    toast.success(`Telephone de ${name} revoque`)
    const response = await employeeApi.getAll({ perPage: 200 })
    employees.value = response.data
  } catch {
    toast.error('Erreur lors de la revocation')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Enrolement des telephones</h1>
      <p class="mt-1 text-sm text-gray-500">
        Associez le telephone de chaque employe a son compte pour le pointage QR.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Formulaire d'enrôlement -->
      <div class="space-y-4">
        <AppCard>
          <h2 class="mb-4 font-semibold text-gray-900">Enroler un telephone</h2>

          <!-- Étape 1 : sélection employé -->
          <template v-if="!session">
            <div class="space-y-4">
              <AppSelect
                v-model="selectedEmployeeId"
                label="Employe"
                :options="employeeOptions"
              />
              <AppButton
                variant="primary"
                :loading="isLoading"
                :disabled="!selectedEmployeeId"
                class="w-full"
                @click="startEnrollment"
              >
                Generer le QR d'enrolement
              </AppButton>
            </div>
          </template>

          <!-- Étape 2 : QR affiché, en attente du scan -->
          <template v-else>
            <!-- Succès -->
            <div v-if="sessionStatus === 'completed'" class="flex flex-col items-center gap-4 py-2">
              <div class="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg class="h-9 w-9 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div class="text-center">
                <p class="font-semibold text-gray-900">Telephone enrole</p>
                <p class="text-sm text-gray-500">{{ session.employeeName }}</p>
              </div>
              <AppButton variant="outline" class="w-full" @click="cancelSession">
                Enroler un autre employe
              </AppButton>
            </div>

            <!-- Expiré -->
            <div v-else-if="sessionStatus === 'expired'" class="flex flex-col items-center gap-4 py-2">
              <div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <svg class="h-9 w-9 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="text-center">
                <p class="font-semibold text-gray-900">Session expiree</p>
                <p class="text-sm text-gray-500">Le QR Code n'est plus valide.</p>
              </div>
              <AppButton variant="primary" class="w-full" @click="cancelSession">
                Recommencer
              </AppButton>
            </div>

            <!-- En attente du scan -->
            <div v-else class="flex flex-col items-center gap-4">
              <div class="text-center">
                <p class="text-sm font-medium text-gray-700">
                  {{ session.employeeName }}
                </p>
                <p class="mt-0.5 text-xs text-gray-500">
                  Demandez a l'employe de scanner ce QR Code avec son telephone
                </p>
              </div>

              <div class="relative">
                <img
                  v-if="qrDataUrl"
                  :src="qrDataUrl"
                  alt="QR Code d'enrolement"
                  class="rounded-lg border border-gray-200"
                />
                <div
                  class="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-800 px-3 py-1 text-xs font-medium text-white"
                >
                  Expire dans {{ timeLeftFormatted }}
                </div>
              </div>

              <div class="flex items-center gap-2 text-sm text-gray-500">
                <div class="h-2 w-2 animate-pulse rounded-full bg-primary" />
                En attente du scan...
              </div>

              <AppButton variant="ghost" size="sm" @click="cancelSession">
                Annuler
              </AppButton>
            </div>
          </template>
        </AppCard>

        <!-- Stats rapides -->
        <div class="grid grid-cols-2 gap-3">
          <AppCard>
            <p class="text-sm font-medium text-gray-700">Enroles</p>
            <p class="mt-1 text-2xl font-bold text-gray-900">{{ enrolledEmployees.length }}</p>
            <p class="text-xs text-gray-400">telephones actifs</p>
          </AppCard>
          <AppCard>
            <p class="text-sm font-medium text-gray-700">En attente</p>
            <p class="mt-1 text-2xl font-bold text-gray-900">{{ unenrolledEmployees.length }}</p>
            <p class="text-xs text-gray-400">employes actifs</p>
          </AppCard>
        </div>
      </div>

      <!-- Liste des appareils enrôlés -->
      <AppCard>
        <h2 class="mb-4 font-semibold text-gray-900">Appareils enroles ({{ enrolledEmployees.length }})</h2>
        <div v-if="enrolledEmployees.length === 0" class="py-8 text-center text-sm text-gray-500">
          Aucun telephone enrole pour l'instant.
        </div>
        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="emp in enrolledEmployees"
            :key="emp.id"
            class="flex items-center justify-between py-3"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900">{{ emp.firstName }} {{ emp.lastName }}</p>
              <p class="font-mono text-xs text-gray-400 truncate">{{ emp.deviceFingerprint }}</p>
              <p v-if="emp.deviceInfo" class="text-xs text-gray-500">{{ emp.deviceInfo }}</p>
            </div>
            <div class="ml-3 flex items-center gap-2 shrink-0">
              <AppBadge variant="success">Enrole</AppBadge>
              <AppButton
                size="sm"
                variant="ghost"
                class="text-red-600 hover:text-red-700"
                @click="revokeDevice(emp.id, `${emp.firstName} ${emp.lastName}`)"
              >
                Revoquer
              </AppButton>
            </div>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>
