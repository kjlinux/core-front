<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBiometricStore } from '@/stores/biometric.store'
import { useCompanyStore } from '@/stores/company.store'
import { useEmployeeStore } from '@/stores/employee.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'

const router = useRouter()
const route = useRoute()
const store = useBiometricStore()
const companyStore = useCompanyStore()
const employeeStore = useEmployeeStore()
const toast = useToast()

const step = ref(1)
const selectedCompanyId = ref('')
const selectedEmployeeId = ref('')
const selectedDeviceId = ref('')

// Pre-fill from query params (coming from device list or enrollment list)
const prefillDeviceId = route.query.deviceId as string | undefined
const prefillEmployeeId = route.query.employeeId as string | undefined
const captureStatus = ref<'idle' | 'waiting' | 'capturing' | 'success' | 'error'>('idle')
const captureError = ref('')
const enrollmentId = ref<string | null>(null)

const companyOptions = computed(() => [
  { label: 'Selectionner une entreprise', value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
])

const employeeOptions = computed(() => {
  const list = selectedCompanyId.value
    ? employeeStore.employees.filter((e) => e.companyId === selectedCompanyId.value)
    : employeeStore.employees
  return [
    { label: 'Selectionner un employe', value: '' },
    ...list.map((e) => ({ label: `${e.firstName} ${e.lastName}`, value: e.id })),
  ]
})

const deviceOptions = computed(() => [
  { label: 'Selectionner un terminal', value: '' },
  ...store.devices.map((d) => ({ label: `${d.name} (${d.serialNumber})`, value: d.id })),
])

const selectedEmployee = computed(() => employeeStore.employees.find((e) => e.id === selectedEmployeeId.value))
const selectedDevice = computed(() => store.devices.find((d) => d.id === selectedDeviceId.value))

const captureStatusLabel = computed(() => {
  switch (captureStatus.value) {
    case 'waiting': return 'Envoi de la commande...'
    case 'capturing': return 'En attente de l\'empreinte sur le terminal...'
    case 'success': return 'Empreinte capturee avec succes!'
    case 'error': return captureError.value || 'Erreur lors de la capture'
    default: return 'Pret'
  }
})

function goToStep2() {
  if (!selectedEmployeeId.value || !selectedDeviceId.value) {
    toast.showError('Veuillez selectionner un employe et un terminal')
    return
  }
  step.value = 2
  captureStatus.value = 'idle'
  captureError.value = ''
  enrollmentId.value = null
}

async function launchCapture() {
  captureStatus.value = 'waiting'
  captureError.value = ''

  try {
    // Step 1: Send ENROLE command via backend -> MQTT -> device
    const enrollment = await store.enrollViaDevice(selectedEmployeeId.value, selectedDeviceId.value)
    enrollmentId.value = enrollment.id

    captureStatus.value = 'capturing'

    // Step 2: Poll enrollment status until device responds with template_hash
    await store.pollEnrollmentStatus(
      enrollment.id,
      (updated) => {
        // Callback on each poll - status is still 'pending' or changed
        if (updated.status === 'enrolled') {
          captureStatus.value = 'success'
        } else if (updated.status === 'failed') {
          captureStatus.value = 'error'
          captureError.value = 'Le terminal n\'a pas pu capturer l\'empreinte'
        }
      },
      { interval: 2000, timeout: 60000 },
    )

    captureStatus.value = 'success'
    toast.showSuccess('Empreinte capturee et enregistree avec succes')
  } catch (error: unknown) {
    captureStatus.value = 'error'
    const message = error instanceof Error ? error.message : 'Erreur lors de la capture'
    captureError.value = message
    toast.showError(message)
  }
}

function retryCapture() {
  captureStatus.value = 'idle'
  captureError.value = ''
  enrollmentId.value = null
}

onMounted(async () => {
  await Promise.all([
    companyStore.fetchCompanies(),
    employeeStore.fetchEmployees(),
    store.fetchDevices(),
  ])

  // Apply prefill after data is loaded
  if (prefillDeviceId) selectedDeviceId.value = prefillDeviceId
  if (prefillEmployeeId) selectedEmployeeId.value = prefillEmployeeId
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" @click="router.push('/biometrique/enrollment')">
        &larr; Retour
      </AppButton>
      <h1 class="text-2xl font-bold text-gray-900">Nouvelle inscription biometrique</h1>
    </div>

    <!-- Steps indicator -->
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          :class="step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'"
        >1</div>
        <span class="text-sm font-medium" :class="step >= 1 ? 'text-primary' : 'text-gray-400'">Selection</span>
      </div>
      <div class="h-px flex-1 bg-gray-200"></div>
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          :class="step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'"
        >2</div>
        <span class="text-sm font-medium" :class="step >= 2 ? 'text-primary' : 'text-gray-400'">Capture</span>
      </div>
    </div>

    <!-- Step 1: Selection -->
    <AppCard v-if="step === 1" title="Etape 1 - Selection de l'employe et du terminal">
      <div class="space-y-4 max-w-md">
        <AppSelect
          v-model="selectedCompanyId"
          label="Entreprise"
          :options="companyOptions"
        />
        <AppSelect
          v-model="selectedEmployeeId"
          label="Employe *"
          :options="employeeOptions"
        />
        <AppSelect
          v-model="selectedDeviceId"
          label="Terminal biometrique *"
          :options="deviceOptions"
        />
        <div class="pt-4">
          <AppButton variant="primary" @click="goToStep2">Continuer</AppButton>
        </div>
      </div>
    </AppCard>

    <!-- Step 2: Capture -->
    <AppCard v-if="step === 2" title="Etape 2 - Capture de l'empreinte">
      <div class="space-y-6">
        <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p class="text-xs text-gray-500 uppercase">Employe</p>
            <p class="font-semibold text-gray-900">
              {{ selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : '-' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 uppercase">Terminal</p>
            <p class="font-semibold text-gray-900">{{ selectedDevice?.name ?? '-' }}</p>
          </div>
        </div>

        <div class="flex flex-col items-center gap-6">
          <div
            class="w-48 h-48 rounded-2xl border-4 flex flex-col items-center justify-center gap-3"
            :class="{
              'border-gray-300 bg-gray-50': captureStatus === 'idle',
              'border-yellow-400 bg-yellow-50': captureStatus === 'waiting',
              'border-blue-400 bg-blue-50 animate-pulse': captureStatus === 'capturing',
              'border-green-400 bg-green-50': captureStatus === 'success',
              'border-red-400 bg-red-50': captureStatus === 'error',
            }"
          >
            <div class="text-5xl">
              <span v-if="captureStatus === 'success'" class="text-green-500">&#10003;</span>
              <span v-else-if="captureStatus === 'error'" class="text-red-500">&#10007;</span>
              <span v-else class="text-gray-400">[~]</span>
            </div>
            <p class="text-sm text-center font-medium px-2" :class="{
              'text-gray-500': captureStatus === 'idle',
              'text-yellow-600': captureStatus === 'waiting',
              'text-blue-600': captureStatus === 'capturing',
              'text-green-600': captureStatus === 'success',
              'text-red-600': captureStatus === 'error',
            }">
              {{ captureStatus === 'idle' ? 'Placez votre doigt sur le lecteur' : captureStatusLabel }}
            </p>
          </div>

          <div class="flex gap-3">
            <AppButton variant="secondary" @click="step = 1" :disabled="captureStatus === 'waiting' || captureStatus === 'capturing'">
              Retour
            </AppButton>

            <!-- Idle: Start capture -->
            <AppButton
              v-if="captureStatus === 'idle'"
              variant="primary"
              @click="launchCapture"
            >
              Lancer la capture
            </AppButton>

            <!-- Waiting/Capturing: Disabled button showing state -->
            <AppButton
              v-else-if="captureStatus === 'waiting' || captureStatus === 'capturing'"
              variant="primary"
              :loading="true"
              disabled
            >
              {{ captureStatus === 'waiting' ? 'Envoi...' : 'Capture en cours...' }}
            </AppButton>

            <!-- Success: Go to list -->
            <AppButton
              v-else-if="captureStatus === 'success'"
              variant="primary"
              @click="router.push('/biometrique/enrollment')"
            >
              Voir les inscriptions
            </AppButton>

            <!-- Error: Retry -->
            <AppButton
              v-else-if="captureStatus === 'error'"
              variant="primary"
              @click="retryCapture"
            >
              Reessayer
            </AppButton>
          </div>
        </div>
      </div>
    </AppCard>
  </div>
</template>
