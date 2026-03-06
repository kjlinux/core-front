<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBiometricStore } from '@/stores/biometric.store'
import { useCompanyStore } from '@/stores/company.store'
import { useEmployeeStore } from '@/stores/employee.store'
import { useSiteStore } from '@/stores/site.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import {
  CheckCircleIcon,
  XCircleIcon,
  FingerPrintIcon,
  ArrowLeftIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const store = useBiometricStore()
const companyStore = useCompanyStore()
const employeeStore = useEmployeeStore()
const siteStore = useSiteStore()
const toast = useToast()

const step = ref(1)
const selectedCompanyId = ref('')
const selectedSiteId = ref('')
const selectedEmployeeId = ref('')
const selectedDeviceId = ref('')

const prefillDeviceId = route.query.deviceId as string | undefined
const prefillEmployeeId = route.query.employeeId as string | undefined
const captureStatus = ref<'idle' | 'waiting' | 'capturing' | 'success' | 'error'>('idle')
const captureError = ref('')
const enrollmentId = ref<string | null>(null)

// --- Cascading options ---

const companyOptions = computed(() => [
  { label: 'Selectionner une entreprise', value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
])

const siteOptions = computed(() => {
  if (!selectedCompanyId.value) return [{ label: 'Selectionner un site', value: '' }]
  const sites = siteStore.sites.filter((s) => s.companyId === selectedCompanyId.value)
  return [
    { label: 'Selectionner un site', value: '' },
    ...sites.map((s) => ({ label: s.name, value: s.id })),
  ]
})

const employeeOptions = computed(() => {
  if (!selectedSiteId.value) return [{ label: 'Selectionner un employe', value: '' }]
  const list = employeeStore.employees.filter((e) => e.siteId === selectedSiteId.value)
  return [
    { label: 'Selectionner un employe', value: '' },
    ...list.map((e) => ({ label: `${e.firstName} ${e.lastName}`, value: e.id })),
  ]
})

const deviceOptions = computed(() => {
  if (!selectedCompanyId.value) return [{ label: 'Selectionner un terminal', value: '' }]
  const devices = store.devices.filter((d) => d.companyId === selectedCompanyId.value)
  return [
    { label: 'Selectionner un terminal', value: '' },
    ...devices.map((d) => ({ label: `${d.name} (${d.serialNumber})`, value: d.id })),
  ]
})

const selectedEmployee = computed(() => employeeStore.employees.find((e) => e.id === selectedEmployeeId.value))
const selectedDevice = computed(() => store.devices.find((d) => d.id === selectedDeviceId.value))

// Reset downstream when company changes
watch(selectedCompanyId, () => {
  selectedSiteId.value = ''
  selectedEmployeeId.value = ''
  selectedDeviceId.value = ''
})

// Reset employee when site changes
watch(selectedSiteId, () => {
  selectedEmployeeId.value = ''
})

const captureStatusLabel = computed(() => {
  switch (captureStatus.value) {
    case 'waiting': return 'Envoi de la commande...'
    case 'capturing': return "En attente de l'empreinte sur le terminal..."
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
    const enrollment = await store.enrollViaDevice(selectedEmployeeId.value, selectedDeviceId.value)
    enrollmentId.value = enrollment.id

    captureStatus.value = 'capturing'

    await store.pollEnrollmentStatus(
      enrollment.id,
      (updated) => {
        if (updated.status === 'enrolled') {
          captureStatus.value = 'success'
        } else if (updated.status === 'failed') {
          captureStatus.value = 'error'
          captureError.value = "Le terminal n'a pas pu capturer l'empreinte"
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
    companyStore.fetchCompanies({ perPage: 100 }),
    employeeStore.fetchEmployees({ perPage: 500, companyId: undefined, siteId: undefined, departmentId: undefined, search: undefined }),
    siteStore.fetchSites({ perPage: 200 }),
    store.fetchDevices(),
  ])

  // Apply prefills: employee drives company+site selection
  if (prefillEmployeeId) {
    const employee = employeeStore.employees.find((e) => e.id === prefillEmployeeId)
    if (employee) {
      selectedCompanyId.value = employee.companyId
      // nextTick to let watchers reset before setting site
      await new Promise((resolve) => setTimeout(resolve, 0))
      selectedSiteId.value = employee.siteId
      await new Promise((resolve) => setTimeout(resolve, 0))
      selectedEmployeeId.value = prefillEmployeeId
    }
  }

  if (prefillDeviceId) {
    const device = store.devices.find((d) => d.id === prefillDeviceId)
    if (device && !selectedCompanyId.value) {
      selectedCompanyId.value = device.companyId
    }
    selectedDeviceId.value = prefillDeviceId
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" @click="router.push('/biometrique/enrollment')">
        <ArrowLeftIcon class="w-4 h-4 mr-1" />
        Retour
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
          label="Entreprise *"
          :options="companyOptions"
        />

        <AppSelect
          v-model="selectedSiteId"
          label="Site *"
          :options="siteOptions"
          :disabled="!selectedCompanyId"
        />

        <AppSelect
          v-model="selectedEmployeeId"
          label="Employe *"
          :options="employeeOptions"
          :disabled="!selectedSiteId"
        />

        <AppSelect
          v-model="selectedDeviceId"
          label="Terminal biometrique *"
          :options="deviceOptions"
          :disabled="!selectedCompanyId"
        />

        <div class="pt-4">
          <AppButton
            variant="primary"
            :disabled="!selectedEmployeeId || !selectedDeviceId"
            @click="goToStep2"
          >
            Continuer
          </AppButton>
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
            <div>
              <CheckCircleIcon v-if="captureStatus === 'success'" class="w-16 h-16 text-green-500" />
              <XCircleIcon v-else-if="captureStatus === 'error'" class="w-16 h-16 text-red-500" />
              <FingerPrintIcon v-else class="w-16 h-16 text-gray-400" />
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
            <AppButton
              variant="secondary"
              @click="step = 1"
              :disabled="captureStatus === 'waiting' || captureStatus === 'capturing'"
            >
              Retour
            </AppButton>

            <AppButton
              v-if="captureStatus === 'idle'"
              variant="primary"
              @click="launchCapture"
            >
              Lancer la capture
            </AppButton>

            <AppButton
              v-else-if="captureStatus === 'waiting' || captureStatus === 'capturing'"
              variant="primary"
              :loading="true"
              disabled
            >
              {{ captureStatus === 'waiting' ? 'Envoi...' : 'Capture en cours...' }}
            </AppButton>

            <AppButton
              v-else-if="captureStatus === 'success'"
              variant="primary"
              @click="router.push('/biometrique/enrollment')"
            >
              Voir les inscriptions
            </AppButton>

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
